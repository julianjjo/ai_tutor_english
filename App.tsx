import React, { useState, useCallback, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { ConversationState, Persona, Scenario, Flashcard } from './types';
import { PERSONAS, SCENARIOS } from './constants';

import { supabase } from './supabaseClient';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useConversation } from './hooks/useConversation';
import { useTextSelection } from './hooks/useTextSelection';
import { useTextToSpeech } from './hooks/useTextToSpeech';

import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import ConversationView from './components/ConversationView';
import StatusIndicator from './components/StatusIndicator';
import Controls from './components/Controls';
import TranslationModal from './components/TranslationModal';
import HistoryPanel from './components/HistoryPanel';
import FlashcardsPanel from './components/FlashcardsPanel';
import SelectionToolbar from './components/SelectionToolbar';
import Auth from './components/Auth';

interface ModalData {
    word: string;
    translation: string;
    explanation: string;
    isVisible: boolean;
}

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);
    
    // High-level state management
    const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[2]);
    const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
    const [modalData, setModalData] = useState<ModalData>({ word: '', translation: '', explanation: '', isVisible: false });
    const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'flashcards'>('settings');
    const [isSettingsPanelCollapsed, setIsSettingsPanelCollapsed] = useState(window.innerWidth < 768);

    // Custom hooks for separated logic
    const {
        history,
        flashcards,
        error: supabaseError,
        saveConversation,
        deleteConversation,
        createFlashcard,
        deleteFlashcard,
        updateFlashcardReview,
        saveFlashcardAudio,
    } = useSupabaseData(session);

    const {
        transcript,
        conversationState,
        error: conversationError,
        startConversation,
        stopConversation,
        generateTranslation,
        generateFlashcardContent,
    } = useConversation(selectedPersona, selectedScenario);

    const { selectionToolbar, hideSelectionToolbar } = useTextSelection();
    
    const { playText, loadingCardId, error: ttsError } = useTextToSpeech();

    // Event Handlers
    const toggleConversation = useCallback(() => {
        if (conversationState !== ConversationState.IDLE) {
            stopConversation();
        } else {
            startConversation();
        }
    }, [conversationState, startConversation, stopConversation]);

    const handleNewConversation = useCallback(async () => {
        await stopConversation();
    }, [stopConversation]);

    const handleSave = useCallback(() => {
        const title = `${selectedScenario.name} - ${selectedPersona.name}`;
        saveConversation(transcript, selectedPersona.id, selectedScenario.id, title);
    }, [transcript, saveConversation, selectedPersona, selectedScenario]);

    const handleLoadConversation = useCallback((conversationToLoad) => {
        stopConversation();
        setSelectedPersona(PERSONAS.find(p => p.id === conversationToLoad.personaId) || PERSONAS[0]);
        setSelectedScenario(SCENARIOS.find(s => s.id === conversationToLoad.scenarioId) || SCENARIOS[0]);
        setActiveTab('settings');
    }, [stopConversation]);

    const handleTranslate = async (text: string) => {
        hideSelectionToolbar();
        if (!text) return;
        setModalData({ word: text, translation: 'Traduciendo...', explanation: '', isVisible: true });
        const { translation, explanation } = await generateTranslation(text);
        setModalData({ word: text, translation, explanation, isVisible: true });
    };

    const handleCreateFlashcard = async (text: string) => {
        hideSelectionToolbar();
        
        const cardContent = await generateFlashcardContent(text);
        if (!cardContent) return;

        if (flashcards.some(f => f.front.toLowerCase() === cardContent.front.toLowerCase())) return;

        const backContent = cardContent.explanation 
            ? `${cardContent.back}\n\n${cardContent.explanation}`
            : cardContent.back;

        createFlashcard({ front: cardContent.front, back: backContent });
    };
    
    const handlePlayAudio = useCallback(async (card: Flashcard) => {
        await playText(card, saveFlashcardAudio);
    }, [playText, saveFlashcardAudio]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const overallError = supabaseError || conversationError || ttsError;
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    if (!session) {
        return <Auth />;
    }

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
                    <div className="flex-shrink-0 p-2 border-b border-slate-700 flex items-center">
                        <div className="flex bg-slate-900/50 rounded-lg p-1 flex-grow">
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
                        <button
                            onClick={() => setIsSettingsPanelCollapsed(!isSettingsPanelCollapsed)}
                            className="ml-2 p-1 rounded-full text-slate-300 hover:bg-slate-700 md:hidden"
                            aria-label={isSettingsPanelCollapsed ? 'Mostrar panel' : 'Ocultar panel'}
                            aria-expanded={!isSettingsPanelCollapsed}
                            aria-controls="settings-panel-content"
                        >
                            {isSettingsPanelCollapsed ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div 
                        id="settings-panel-content"
                        className={`flex-grow overflow-hidden transition-all duration-500 ease-in-out md:!p-4 md:!max-h-none md:overflow-y-auto ${isSettingsPanelCollapsed ? 'max-h-0 p-0' : 'max-h-[80vh] p-4'}`}
                    >
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
                                onLoad={(id) => {
                                    const convo = history.find(c => c.id === id);
                                    if(convo) {
                                        handleLoadConversation(convo);
                                    }
                                }}
                                onDelete={deleteConversation}
                            />
                        )}
                        {activeTab === 'flashcards' && (
                            <FlashcardsPanel
                                flashcards={flashcards}
                                onDelete={deleteFlashcard}
                                onReview={updateFlashcardReview}
                                onPlayAudio={handlePlayAudio}
                                loadingCardId={loadingCardId}
                            />
                        )}
                    </div>
                     <div className="mt-auto p-4 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-2 truncate" title={session.user.email ?? ''}>
                            Sesión iniciada como: <span className="font-semibold text-slate-300">{session.user.email}</span>
                        </p>
                        <button
                            onClick={handleLogout}
                            className="w-full text-center px-4 py-2 bg-slate-700/80 hover:bg-red-500/50 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="flex-grow flex flex-col bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
                    <ConversationView transcript={transcript} />
                    <div className="flex-shrink-0 p-6 border-t border-slate-700 bg-slate-900/50">
                        <StatusIndicator state={conversationState} />
                        {overallError && <p className="text-red-400 text-center text-sm mb-4">{overallError}</p>}
                        <Controls
                            isConversing={conversationState !== ConversationState.IDLE}
                            onToggleConversation={toggleConversation}
                            onNewConversation={handleNewConversation}
                            onSaveConversation={handleSave}
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