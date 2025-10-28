import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Session, Type } from '@google/genai';
import { ConversationState, Persona, Scenario, TranscriptEntry } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

export const useConversation = (selectedPersona: Persona, selectedScenario: Scenario) => {
    const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.IDLE);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const sessionPromiseRef = useRef<Promise<Session> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const cleanupAudio = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();

        streamRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        audioContextRef.current = null;
        outputAudioContextRef.current = null;
        nextStartTimeRef.current = 0;
    }, []);

    const stopConversation = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing live session:", e);
            } finally {
                sessionPromiseRef.current = null;
            }
        }
        cleanupAudio();
        setConversationState(ConversationState.IDLE);
    }, [cleanupAudio]);
    
    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const { text } = message.serverContent.outputTranscription;
            setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'ai' && last.isPartial) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { speaker: 'ai', text, id: Date.now(), isPartial: true }];
            });
        }

        if (message.serverContent?.inputTranscription) {
            const { text } = message.serverContent.inputTranscription;
            setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last?.speaker === 'user' && last.isPartial) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { speaker: 'user', text, id: Date.now(), isPartial: true }];
            });
        }

        if (message.serverContent?.turnComplete) {
            setTranscript(prev => prev.map(entry => ({ ...entry, isPartial: false })));
        }

        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            setConversationState(ConversationState.SPEAKING);
            try {
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);

                const currentTime = outputAudioContextRef.current.currentTime;
                const startTime = Math.max(nextStartTimeRef.current, currentTime);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                audioSourcesRef.current.add(source);

                source.onended = () => {
                    audioSourcesRef.current.delete(source);
                    if (audioSourcesRef.current.size === 0) {
                        setConversationState(ConversationState.LISTENING);
                    }
                };
            } catch (e) {
                console.error("Error processing audio:", e);
                setError("No se pudo reproducir el audio de la IA.");
                setConversationState(ConversationState.LISTENING);
            }
        }
    }, []);

    const startConversation = useCallback(async () => {
        setError(null);
        setTranscript([]);
        if (conversationState !== ConversationState.IDLE) return;

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
            setConversationState(ConversationState.LISTENING);
            
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        try {
                            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                            scriptProcessorRef.current.onaudioprocess = (event) => {
                                const inputData = event.inputBuffer.getChannelData(0);
                                const pcmBlob = {
                                    data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                    mimeType: 'audio/pcm;rate=16000',
                                };
                                sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(e => console.error("Error sending audio:", e));
                            };
                            
                            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(audioContextRef.current.destination);
                        } catch (e) {
                            console.error("Microphone error:", e);
                            setError("Acceso al micrófono denegado. Por favor, permite el acceso para continuar.");
                            await stopConversation();
                        }
                    },
                    onmessage: handleMessage,
                    onerror: (e) => {
                        console.error("Live session error:", e);
                        setError("Ocurrió un error en la conexión. Intenta de nuevo.");
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction: `${selectedPersona.prompt} ${selectedScenario.prompt}`,
                },
            });
            await sessionPromiseRef.current;
        } catch (e) {
            console.error("Failed to start conversation:", e);
            setError("No se pudo iniciar la conversación. Verifica tu clave de API.");
            setConversationState(ConversationState.IDLE);
            cleanupAudio();
        }
    }, [conversationState, selectedPersona, selectedScenario, cleanupAudio, stopConversation, handleMessage]);

    const generateTranslation = useCallback(async (text: string, clean: boolean = false): Promise<{ translation: string, explanation: string }> => {
        if (!text) return { translation: '', explanation: '' };
        
        const cleanSchema = {
            type: Type.OBJECT,
            properties: {
                translation: { type: Type.STRING },
            },
        };

        const fullSchema = {
            type: Type.OBJECT,
            properties: {
                translation: { type: Type.STRING, description: "The most direct and common Spanish translation." },
                explanation: { type: Type.STRING, description: "A brief explanation in Spanish about the translation. Mention any nuances, alternative translations, or common usage contexts. Format the explanation with markdown, using **bold text** for emphasis and numbered lists for alternatives (e.g., '1. First option... 2. Second option...')." },
            },
        };

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate the following English text to Spanish and provide an explanation: "${text}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: clean ? cleanSchema : fullSchema,
                }
            });

            const jsonResponse = JSON.parse(result.text);
            return {
                translation: jsonResponse.translation || 'No se encontró traducción.',
                explanation: jsonResponse.explanation || '',
            };

        } catch (e) {
            console.error("Translation error:", e);
            return { translation: 'Error al traducir.', explanation: 'No se pudo obtener una explicación.' };
        }
    }, []);

    const generateFlashcardContent = useCallback(async (text: string): Promise<{ front: string; back: string; explanation: string } | null> => {
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

            const schema = {
                type: Type.OBJECT,
                properties: {
                    front: { type: Type.STRING, description: "The original English word or phrase to be learned from the text." },
                    back: { type: Type.STRING, description: "The most direct and common Spanish translation for the English phrase." },
                    explanation: { type: Type.STRING, description: "A very brief, one-sentence explanation in Spanish about the usage or context of the phrase." },
                },
                required: ["front", "back"]
            };

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `From the following text, extract the core English phrase to be learned, its Spanish translation, and a brief explanation in Spanish. The text might be messy or contain multiple languages. Focus on the single most important learning point.\n\nText: "${text}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });

            const jsonResponse = JSON.parse(result.text);
            return {
                front: jsonResponse.front || text, // fallback to original text
                back: jsonResponse.back || 'No se encontró traducción.',
                explanation: jsonResponse.explanation || '',
            };

        } catch (e) {
            console.error("Flashcard content generation error:", e);
            setError("No se pudo procesar el texto para la flashcard.");
            return null;
        }
    }, []);

    return { transcript, conversationState, error, startConversation, stopConversation, generateTranslation, generateFlashcardContent };
};