import { LiveServerMessage, Session } from '@google/genai';

export enum ConversationState {
    IDLE = 'IDLE',
    LISTENING = 'LISTENING',
    SPEAKING = 'SPEAKING',
    ERROR = 'ERROR',
}

export interface Persona {
    id: string;
    name: string;
    description: string;
    prompt: string;
    icon: string;
}

export interface Scenario {
    id: string;
    name: string;
    description: string;
    prompt: string;
    icon: string;
}

export interface TranscriptEntry {
    id: number;
    speaker: 'user' | 'ai';
    text: string;
    isPartial?: boolean;
}

export interface SavedConversation {
    id: string;
    title: string;
    timestamp: number;
    transcript: TranscriptEntry[];
    personaId: string;
    scenarioId: string;
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    repetition: number;
    easinessFactor: number;
    interval: number;
    nextReviewAt: string;
    audioBase64?: string | null;
}

// Types for Supabase table rows
export interface DatabaseConversation {
    id: string;
    created_at: string;
    title: string;
    timestamp: string;
    transcript: TranscriptEntry[];
    personaId: string;
    scenarioId: string;
    user_id: string;
}

export interface DatabaseFlashcard {
    id:string;
    created_at: string;
    front: string;
    back: string;
    repetition: number;
    easiness_factor: number;
    interval: number;
    next_review_at: string;
    audio_base_64?: string | null;
    user_id: string;
}