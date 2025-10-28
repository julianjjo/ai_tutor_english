# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered English tutor application built with React, TypeScript, and Vite. The app provides real-time conversational practice with AI tutors, featuring voice interaction, flashcard creation, and progress tracking. It integrates with Google's Gemini AI for conversation and Supabase for data persistence.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Setup

The app requires several environment variables:
- `GEMINI_API_KEY` - Google Gemini API key for AI conversations
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

These should be set in a `.env` file in the project root.

## Architecture

### Core Components
- **App.tsx** - Main application component with state management
- **Auth** - User authentication using Supabase
- **ConversationView** - Real-time conversation interface with voice
- **FlashcardsPanel** - Spaced repetition flashcard system
- **HistoryPanel** - Conversation history management

### Custom Hooks
- **useConversation** - Manages real-time audio conversation with Gemini AI
- **useSupabaseData** - Handles data persistence to Supabase
- **useTextSelection** - Text selection and translation features
- **useTextToSpeech** - Text-to-speech functionality

### Key Features
- Real-time voice conversation using WebRTC and Google Gemini Live API
- Flashcard system with SM2 (spaced repetition) algorithm
- Text selection with instant translations
- User authentication and session management
- Conversation history and progress tracking

### Data Flow
1. User authentication through Supabase
2. Real-time audio streaming to Gemini API
3. Conversation data stored in Supabase tables
4. Flashcards generated from conversation content
5. Audio processed and stored as base64 in database

### File Structure
- `components/` - React components
- `hooks/` - Custom React hooks
- `utils/` - Utility functions (audio processing, SM2 algorithm)
- `types.ts` - TypeScript type definitions
- `constants.ts` - App constants (personas, scenarios)
- `supabaseClient.ts` - Supabase client configuration

### Dependencies
- React 19 with TypeScript
- Google GenAI SDK for conversation
- Supabase for authentication and database
- Vite for build tooling
- Tailwind CSS for styling

The app uses a CDN-based import map for React and other dependencies, allowing it to run in AI Studio environments.