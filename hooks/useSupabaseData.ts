import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { SavedConversation, Flashcard, TranscriptEntry, DatabaseConversation, DatabaseFlashcard } from '../types';
import { calculateSM2 } from '../utils/sm2';

export const useSupabaseData = (session: Session | null) => {
    const [history, setHistory] = useState<SavedConversation[]>([]);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.user) {
            setHistory([]);
            setFlashcards([]);
            return;
        }

        const fetchData = async () => {
            try {
                const [historyRes, flashcardsRes] = await Promise.all([
                    supabase.from('conversations').select('*').eq('user_id', session.user.id).order('timestamp', { ascending: false }),
                    supabase.from('flashcards').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
                ]);

                if (historyRes.error) throw historyRes.error;
                if (flashcardsRes.error) throw flashcardsRes.error;

                const mappedHistory: SavedConversation[] = historyRes.data.map((item: DatabaseConversation) => ({
                    ...item,
                    timestamp: new Date(item.timestamp).getTime(),
                }));
                setHistory(mappedHistory);

                const mappedFlashcards: Flashcard[] = (flashcardsRes.data as DatabaseFlashcard[]).map(item => ({
                    id: item.id,
                    front: item.front,
                    back: item.back,
                    repetition: item.repetition,
                    easinessFactor: item.easiness_factor,
                    interval: item.interval,
                    nextReviewAt: item.next_review_at,
                    audioBase64: item.audio_base_64,
                }));
                setFlashcards(mappedFlashcards);

            } catch (e: any) {
                console.error("Failed to load data from Supabase:", e);
                setError("No se pudo cargar el historial o las flashcards.");
            }
        };
        fetchData();
    }, [session]);

    const saveConversation = useCallback(async (transcript: TranscriptEntry[], personaId: string, scenarioId: string, title: string) => {
        if (transcript.length === 0 || !session?.user) return;
        
        const conversationData = {
            title,
            timestamp: new Date().toISOString(),
            transcript: transcript.map(t => ({ ...t, isPartial: false })),
            personaId,
            scenarioId,
            user_id: session.user.id,
        };

        try {
            const { data, error } = await supabase.from('conversations').insert(conversationData).select().single();
            if (error) throw error;
            const newSave: SavedConversation = {
                ...data,
                timestamp: new Date(data.timestamp).getTime(),
            };
            setHistory(prev => [newSave, ...prev]);
        } catch (e) {
            console.error("Failed to save history to Supabase:", e);
            setError("No se pudo guardar la conversación.");
        }
    }, [session]);

    const deleteConversation = useCallback(async (id: string) => {
        if (!session?.user) return;
        try {
            const { error } = await supabase.from('conversations').delete().eq('id', id);
            if (error) throw error;
            setHistory(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            console.error("Failed to delete history item from Supabase:", e);
            setError("No se pudo borrar la conversación.");
        }
    }, [session]);

    const createFlashcard = useCallback(async ({ front, back }: { front: string; back: string }) => {
        if (!session?.user) return;
        try {
            const initialSM2 = {
                repetition: 0,
                interval: 0,
                easiness_factor: 2.5,
            };
            const { data, error } = await supabase.from('flashcards').insert({ front, back, ...initialSM2, user_id: session.user.id }).select().single();
            if (error) throw error;
            const newCard: Flashcard = {
                id: data.id,
                front: data.front,
                back: data.back,
                repetition: data.repetition,
                easinessFactor: data.easiness_factor,
                interval: data.interval,
                nextReviewAt: data.next_review_at,
                audioBase64: data.audio_base_64,
            };
            setFlashcards(prev => [newCard, ...prev]);
        } catch (e) {
            console.error("Flashcard creation error:", e);
            setError("No se pudo crear la flashcard.");
        }
    }, [session]);

    const deleteFlashcard = useCallback(async (id: string) => {
        if (!session?.user) return;
        try {
            const { error } = await supabase.from('flashcards').delete().eq('id', id);
            if (error) throw error;
            setFlashcards(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            console.error("Failed to delete flashcard from Supabase:", e);
            setError("No se pudo borrar la flashcard.");
        }
    }, [session]);
    
    const updateFlashcardReview = useCallback(async (card: Flashcard, quality: number) => {
        if (!session?.user) return;
        try {
            const { repetition, easinessFactor, interval } = calculateSM2(card, quality);
            
            const nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + interval);

            const updates = {
                repetition,
                easiness_factor: easinessFactor,
                interval,
                next_review_at: nextReviewDate.toISOString(),
            };

            const { data, error } = await supabase.from('flashcards').update(updates).eq('id', card.id).select().single();
            if (error) throw error;
            
            setFlashcards(prev => prev.map(f => f.id === card.id ? {
                ...f,
                repetition: data.repetition,
                easinessFactor: data.easiness_factor,
                interval: data.interval,
                nextReviewAt: data.next_review_at,
            } : f));

        } catch (e) {
            console.error("Failed to update flashcard review:", e);
            setError("No se pudo actualizar la flashcard.");
        }
    }, [session]);
    
    const saveFlashcardAudio = useCallback(async (cardId: string, audioBase64: string) => {
        if (!session?.user) return;
        try {
            const { error } = await supabase.from('flashcards').update({ audio_base_64: audioBase64 }).eq('id', cardId);
            if (error) throw error;
            setFlashcards(prev => 
                prev.map(card => 
                    card.id === cardId ? { ...card, audioBase64: audioBase64 } : card
                )
            );
        } catch (e) {
            console.error("Failed to save flashcard audio:", e);
            setError("No se pudo guardar el audio de la flashcard.");
        }
    }, [session]);

    return { history, flashcards, error, saveConversation, deleteConversation, createFlashcard, deleteFlashcard, updateFlashcardReview, saveFlashcardAudio };
};