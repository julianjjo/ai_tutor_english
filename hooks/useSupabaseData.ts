import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SavedConversation, Flashcard, TranscriptEntry, DatabaseConversation, DatabaseFlashcard } from '../types';
import { calculateSM2 } from '../utils/sm2';

const supabaseUrl = 'https://srqaxcdhgombfhvapnzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycWF4Y2RoZ29tYmZodmFwbnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDI1MTIsImV4cCI6MjA3NzA3ODUxMn0._wEJXvpEaW_SlTY4PpQOUl1mqF_O6ah7iLnUSMo4xYQ';
const supabase = createClient(supabaseUrl, supabaseKey);

export const useSupabaseData = () => {
    const [history, setHistory] = useState<SavedConversation[]>([]);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, flashcardsRes] = await Promise.all([
                    supabase.from('conversations').select('*').order('timestamp', { ascending: false }),
                    supabase.from('flashcards').select('*').order('created_at', { ascending: false })
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
                }));
                setFlashcards(mappedFlashcards);

            } catch (e: any) {
                console.error("Failed to load data from Supabase:", e);
                setError("No se pudo cargar el historial o las flashcards.");
            }
        };
        fetchData();
    }, []);

    const saveConversation = useCallback(async (transcript: TranscriptEntry[], personaId: string, scenarioId: string, title: string) => {
        if (transcript.length === 0) return;
        
        const conversationData = {
            title,
            timestamp: new Date().toISOString(),
            transcript: transcript.map(t => ({ ...t, isPartial: false })),
            personaId,
            scenarioId,
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
    }, []);

    const deleteConversation = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('conversations').delete().eq('id', id);
            if (error) throw error;
            setHistory(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            console.error("Failed to delete history item from Supabase:", e);
            setError("No se pudo borrar la conversación.");
        }
    }, []);

    const createFlashcard = useCallback(async ({ front, back }: { front: string; back: string }) => {
        try {
            const { data, error } = await supabase.from('flashcards').insert({ front, back }).select().single();
            if (error) throw error;
            const newCard: Flashcard = {
                id: data.id,
                front: data.front,
                back: data.back,
                repetition: data.repetition,
                easinessFactor: data.easiness_factor,
                interval: data.interval,
                nextReviewAt: data.next_review_at,
            };
            setFlashcards(prev => [newCard, ...prev]);
        } catch (e) {
            console.error("Flashcard creation error:", e);
            setError("No se pudo crear la flashcard.");
        }
    }, []);

    const deleteFlashcard = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('flashcards').delete().eq('id', id);
            if (error) throw error;
            setFlashcards(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            console.error("Failed to delete flashcard from Supabase:", e);
            setError("No se pudo borrar la flashcard.");
        }
    }, []);
    
    const updateFlashcardReview = useCallback(async (card: Flashcard, quality: number) => {
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
            
            // Update local state to reflect the changes immediately
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
    }, []);

    return { history, flashcards, error, saveConversation, deleteConversation, createFlashcard, deleteFlashcard, updateFlashcardReview };
};