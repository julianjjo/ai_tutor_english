import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession } from '@google/genai';
import { ConversationState, Persona, Scenario, TranscriptEntry, SavedConversation, Flashcard } from './types';
import { PERSONAS, SCENARIOS } from './constants';
import { encode, decode, decodeAudioData } from './utils/audioUtils';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import ConversationView from './components/ConversationView';
import StatusIndicator from './components/StatusIndicator';
import Controls from './components/Controls';
import TranslationModal from './components/TranslationModal';
import HistoryPanel from './components/HistoryPanel';
import FlashcardsPanel from './components/FlashcardsPanel';
import SelectionToolbar from './components/SelectionToolbar';

const HISTORY_STORAGE_KEY = 'ia-english-tutor-history';
const FLASHCARDS_STORAGE_KEY = 'ia-english-tutor-flashcards';


const App: React.FC = () => {
    const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.IDLE);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[2]);
    const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
    const [modalData, setModalData] = useState<{ word: string; translation: string; isVisible: boolean }>({ word: '', translation: '', isVisible: false });
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<SavedConversation[]>([]);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'flashcards'>('settings');
    const [selectionToolbar, setSelectionToolbar] = useState<{ isVisible: boolean; text: string; top: number; left: number; } | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (savedHistory) setHistory(JSON.parse(savedHistory));

            const savedFlashcards = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
            if (savedFlashcards) setFlashcards(JSON.parse(savedFlashcards));

        } catch (e) {
            console.error("Failed to load data from localStorage:", e);
        }
    }, []);
    
    useEffect(() => {
        const handleMouseUp = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Ignora los clics dentro de la propia barra de herramientas
            if (target.closest('.selection-toolbar')) {
                return;
            }
    
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();
    
            if (selectedText && selection?.rangeCount > 0) {
                const range = selection.getRangeAt(0);
    
                const commonAncestor = range.commonAncestorContainer;
                const parentElement = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor as HTMLElement;
                
                // Comprueba si la selección está dentro de una burbuja de mensaje de la IA
                if (parentElement?.closest('.ai-message-bubble')) {
                    const rect = range.getBoundingClientRect();
                    const top = rect.top + window.scrollY - 50;
                    const left = rect.left + window.scrollX + (rect.width / 2) - 100; // Centrar barra
                    setSelectionToolbar({ isVisible: true, text: selectedText, top, left });
                } else {
                    setSelectionToolbar(null);
                }
            } else {
                setSelectionToolbar(null);
            }
        };
    
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const cleanupAudio = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
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
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    const handleMessage = async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const { text, isFinal } = message.serverContent.outputTranscription;
            setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last && last.speaker === 'ai' && !isFinal) {
                     return [...prev.slice(0, -1), { ...last, text: last.text + text, isPartial: true }];
                }
                if (last?.speaker === 'ai' && last.isPartial && isFinal) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text, isPartial: false }];
                }
                if (last?.speaker === 'ai' && !last.isPartial) {
                     return [...prev, { speaker: 'ai', text, id: Date.now(), isPartial: !isFinal }];
                }
                if (!last || last.speaker === 'user') {
                     return [...prev, { speaker: 'ai', text, id: Date.now(), isPartial: !isFinal }];
                }
                return prev;
            });
        }

        if (message.serverContent?.inputTranscription) {
            const { text, isFinal } = message.serverContent.inputTranscription;
            setTranscript(prev => {
                const last = prev[prev.length - 1];
                 if (last && last.speaker === 'user' && !isFinal) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text, isPartial: true }];
                }
                if (last?.speaker === 'user' && last.isPartial && isFinal) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text, isPartial: false }];
                }
                 if (last?.speaker === 'user' && !last.isPartial) {
                     return [...prev, { speaker: 'user', text, id: Date.now(), isPartial: !isFinal }];
                }
                 if (!last || last.speaker === 'ai') {
                     return [...prev, { speaker: 'user', text, id: Date.now(), isPartial: !isFinal }];
                 }
                return prev;
            });
        }

        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString && outputAudioContextRef.current) {
            setConversationState(ConversationState.SPEAKING);
            try {
                const audioBuffer = await decodeAudioData(
                    decode(base64EncodedAudioString),
                    outputAudioContextRef.current,
                    24000,
                    1
                );
                
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
    };

    const startConversation = async () => {
        setError(null);
        if (conversationState !== ConversationState.IDLE) {
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const systemInstruction = `${selectedPersona.prompt} ${selectedScenario.prompt}`;

            setConversationState(ConversationState.LISTENING);
            
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            audioSourcesRef.current = new Set();
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        try {
                            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = {
                                    data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                    mimeType: 'audio/pcm;rate=16000',
                                };
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                }).catch(e => console.error("Error sending audio data:", e));
                            };
                            
                            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(audioContextRef.current.destination);
                        } catch (e) {
                            console.error("Microphone access error:", e);
                            setError("Acceso al micrófono denegado. Por favor, permite el acceso para continuar.");
                            await stopConversation();
                        }
                    },
                    onmessage: handleMessage,
                    onerror: (e) => {
                        console.error("Live session error:", e);
                        setError("Ocurrió un error en la conexión. Por favor, intenta de nuevo.");
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
                    systemInstruction,
                },
            });
            await sessionPromiseRef.current;
        } catch (e) {
            console.error("Failed to start conversation:", e);
            setError("No se pudo iniciar la conversación. Verifica tu clave de API y conexión.");
            setConversationState(ConversationState.IDLE);
            cleanupAudio();
        }
    };
    
    const toggleConversation = () => {
        if (conversationState !== ConversationState.IDLE) {
            stopConversation();
        } else {
            startConversation();
        }
    };
    
    const handleNewConversation = useCallback(async () => {
        await stopConversation();
        setTranscript([]);
    }, [stopConversation]);

    const handleSaveConversation = () => {
        if (transcript.length === 0) return;
        const newSave: SavedConversation = {
            id: `convo-${Date.now()}`,
            title: `${selectedScenario.name} - ${new Date().toLocaleDateString()}`,
            timestamp: Date.now(),
            transcript: transcript.map(t => ({...t, isPartial: false})),
            personaId: selectedPersona.id,
            scenarioId: selectedScenario.id,
        };
        const updatedHistory = [newSave, ...history];
        setHistory(updatedHistory);
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
        } catch (e) {
            console.error("Failed to save history:", e);
            setError("No se pudo guardar la conversación.");
        }
    };

    const handleLoadConversation = (id: string) => {
        const conversationToLoad = history.find(c => c.id === id);
        if (conversationToLoad) {
            stopConversation();
            setTranscript(conversationToLoad.transcript);
            setSelectedPersona(PERSONAS.find(p => p.id === conversationToLoad.personaId) || PERSONAS[0]);
            setSelectedScenario(SCENARIOS.find(s => s.id === conversationToLoad.scenarioId) || SCENARIOS[0]);
            setActiveTab('settings');
        }
    };

    const handleDeleteConversation = (id: string) => {
        const updatedHistory = history.filter(c => c.id !== id);
        setHistory(updatedHistory);
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
        } catch (e) {
            console.error("Failed to delete history item:", e);
            setError("No se pudo borrar la conversación.");
        }
    };
    
    const handleTranslate = async (text: string) => {
        setSelectionToolbar(null);
        if (!text) return;

        setModalData({ word: text, translation: 'Traduciendo...', isVisible: true });
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate the following English text to Spanish: "${text}"`
            });
            setModalData({ word: text, translation: result.text, isVisible: true });
        } catch (e) {
            console.error("Translation error:", e);
            setModalData({ word: text, translation: 'Error al traducir.', isVisible: true });
        }
    };
    
    const handleCreateFlashcard = async (text: string) => {
        setSelectionToolbar(null);
        if (flashcards.some(f => f.front === text)) {
            console.log("Flashcard already exists.");
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate the following English text to Spanish: "${text}"`,
                config: {
                    systemInstruction: "You are a translation tool. Provide only the Spanish translation, without any extra text, explanations, or quotation marks."
                }
            });
            const translation = result.text.trim();

            const newFlashcard: Flashcard = {
                id: `flashcard-${Date.now()}`,
                front: text,
                back: translation,
            };

            const updatedFlashcards = [newFlashcard, ...flashcards];
            setFlashcards(updatedFlashcards);
            localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(updatedFlashcards));
        } catch (e) {
            console.error("Flashcard creation error:", e);
            setError("No se pudo crear la flashcard.");
        }
    };

    const handleDeleteFlashcard = (id: string) => {
        const updatedFlashcards = flashcards.filter(f => f.id !== id);
        setFlashcards(updatedFlashcards);
        try {
            localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(updatedFlashcards));
        } catch (e) {
            console.error("Failed to delete flashcard:", e);
            setError("No se pudo borrar la flashcard.");
        }
    };

    return (
        <div className="min-h-screen max-h-screen flex flex-col">
            <Header />

            {selectionToolbar?.isVisible && (
                <SelectionToolbar
                    text={selectionToolbar.text}
                    top={selectionToolbar.top}
                    left={selectionToolbar.left}
                    onAddFlashcard={handleCreateFlashcard}
                    onTranslate={handleTranslate}
                />
            )}

            <main className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-8 overflow-hidden">
                <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-800/60 border border-slate-700 rounded-2xl flex flex-col backdrop-blur-sm">
                    <div className="flex-shrink-0 p-2 border-b border-slate-700">
                        <div className="flex bg-slate-900/50 rounded-lg p-1">
                            {([
                                { id: 'settings', label: 'Ajustes' },
                                { id: 'history', label: 'Historial' },
                                { id: 'flashcards', label: 'Flashcards' }
                            ] as const).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-1/3 p-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto">
                        {activeTab === 'settings' && (
                            <SettingsPanel
                                selectedPersona={selectedPersona}
                                onPersonaChange={setSelectedPersona}
                                selectedScenario={selectedScenario}
                                onScenarioChange={setSelectedScenario}
                                isDisabled={conversationState !== ConversationState.IDLE}
                            />
                        )}
                        {activeTab === 'history' && (
                            <HistoryPanel
                                conversations={history}
                                onLoad={handleLoadConversation}
                                onDelete={handleDeleteConversation}
                            />
                        )}
                        {activeTab === 'flashcards' && (
                            <FlashcardsPanel
                                flashcards={flashcards}
                                onDelete={handleDeleteFlashcard}
                            />
                        )}
                    </div>
                </div>

                <div className="flex-grow flex flex-col bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
                    <ConversationView 
                        transcript={transcript} 
                    />
                    <div className="flex-shrink-0 p-6 border-t border-slate-700 bg-slate-900/50">
                        <StatusIndicator state={conversationState} />
                        {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
                        <Controls
                            isConversing={conversationState !== ConversationState.IDLE}
                            onToggleConversation={toggleConversation}
                            onNewConversation={handleNewConversation}
                            onSaveConversation={handleSaveConversation}
                            canSave={transcript.length > 0 && conversationState === ConversationState.IDLE}
                        />
                    </div>
                </div>
            </main>
            <TranslationModal
                {...modalData}
                onClose={() => setModalData(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};

export default App;