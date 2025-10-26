import React, { useState } from 'react';
import { Flashcard } from '../types';

interface FlashcardsPanelProps {
    flashcards: Flashcard[];
    onDelete: (id: string) => void;
}

const FlashcardItem: React.FC<{ card: Flashcard; onDelete: (id: string) => void }> = ({ card, onDelete }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(card.id);
    };

    return (
        <div className="w-full h-48 [perspective:1000px]" onClick={() => setIsFlipped(!isFlipped)}>
            <div
                className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
            >
                {/* Front */}
                <div className="absolute w-full h-full bg-slate-700 rounded-lg p-4 flex flex-col justify-between items-center text-center [backface-visibility:hidden]">
                    <span className="text-xs text-slate-400 self-start">Inglés</span>
                    <p className="text-lg text-white">{card.front}</p>
                    <span className="text-xs text-slate-400 self-end">Toca para voltear</span>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full bg-teal-600 rounded-lg p-4 flex flex-col justify-between items-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <span className="text-xs text-teal-100 self-start">Español</span>
                    <p className="text-lg font-semibold text-white">{card.back}</p>
                    <span className="text-xs text-teal-100 self-end">Toca para voltear</span>
                </div>
            </div>
             <button
                onClick={handleDelete}
                className="absolute top-2 right-2 p-1.5 rounded-full text-slate-300 bg-slate-800/50 hover:bg-red-500/30 hover:text-red-400 transition-colors z-10"
                aria-label="Borrar flashcard"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

const FlashcardsPanel: React.FC<FlashcardsPanelProps> = ({ flashcards, onDelete }) => {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold text-teal-300 mb-4 text-center">Mis Flashcards</h2>
            {flashcards.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-lg">No tienes flashcards.</p>
                    <p>Selecciona texto en la conversación para crear una.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {flashcards.map((card) => (
                       <div key={card.id} className="relative">
                           <FlashcardItem card={card} onDelete={onDelete} />
                       </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlashcardsPanel;