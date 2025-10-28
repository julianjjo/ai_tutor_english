import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { Flashcard } from '../types';

export const useTextToSpeech = () => {
    const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Lazily initialize AudioContext to avoid issues with browser autoplay policies
    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        return audioContextRef.current;
    };

    const playText = useCallback(async (card: Flashcard, saveAudio: (cardId: string, audioBase64: string) => Promise<void>) => {
        if (loadingCardId) return; // Prevent multiple requests at once
        
        setLoadingCardId(card.id);
        setError(null);

        try {
            let audioToPlay = card.audioBase64;

            if (!audioToPlay) {
                const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: card.front }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // A standard, clear English voice
                            },
                        },
                    },
                });
                
                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                if (base64Audio) {
                    audioToPlay = base64Audio;
                    // Save for future use, but don't wait for it.
                    saveAudio(card.id, base64Audio).catch(console.error); 
                } else {
                    throw new Error("No audio data received from API.");
                }
            }
            
            if (audioToPlay) {
                const outputAudioContext = getAudioContext();
                const audioBuffer = await decodeAudioData(
                    decode(audioToPlay),
                    outputAudioContext,
                    24000,
                    1
                );
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            } else {
                 throw new Error("No audio available to play.");
            }

        } catch (e) {
            console.error("Text-to-speech error:", e);
            setError("No se pudo reproducir el audio.");
        } finally {
            setLoadingCardId(null);
        }
    }, [loadingCardId]);

    return { playText, loadingCardId, error };
};