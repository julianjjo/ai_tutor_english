import React, { useState, useMemo } from 'react';
import { Flashcard } from '../types';

interface FlashcardsPanelProps {
    flashcards: Flashcard[];
    onDelete: (id: string) => void;
    onReview: (card: Flashcard, quality: number) => void;
}

const ReviewCard: React.FC<{ card: Flashcard; onReview: (quality: number) => void; }> = ({ card, onReview }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full h-48 [perspective:1000px] mb-4" onClick={() => setIsFlipped(true)}>
                <div
                    className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                >
                    {/* Front */}
                    <div className="absolute w-full h-full bg-slate-700 rounded-lg p-4 flex flex-col justify-between items-center text-center [backface-visibility:hidden]">
                        <span className="text-xs text-slate-400 self-start">Inglés</span>
                        <p className="text-2xl text-white font-bold">{card.front}</p>
                        <span className="text-xs text-slate-400 self-end">Toca para voltear</span>
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full bg-teal-600 rounded-lg p-4 flex flex-col justify-center items-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <p className="text-2xl font-semibold text-white">{card.back}</p>
                    </div>
                </div>
            </div>
            {isFlipped && (
                <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 animate-fade-in-fast">
                    <button onClick={() => onReview(1)} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white transition-colors">Olvidé</button>
                    <button onClick={() => onReview(3)} className="p-2 bg-orange-500/80 hover:bg-orange-500 rounded-md text-white transition-colors">Difícil</button>
                    <button onClick={() => onReview(4)} className="p-2 bg-yellow-500/80 hover:bg-yellow-500 rounded-md text-white transition-colors">Bien</button>
                    <button onClick={() => onReview(5)} className="p-2 bg-green-600/80 hover:bg-green-600 rounded-md text-white transition-colors">Fácil</button>
                </div>
            )}
        </div>
    );
};


const ReviewSession: React.FC<{
    cards: Flashcard[];
    onFinish: () => void;
    onReview: (card: Flashcard, quality: number) => void;
}> = ({ cards, onFinish, onReview }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (currentIndex >= cards.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <p className="text-xl text-teal-300 font-bold mb-2">¡Buen trabajo!</p>
                <p className="text-slate-400 mb-6">Has completado tu sesión de repaso.</p>
                <button onClick={onFinish} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Volver</button>
            </div>
        );
    }

    const card = cards[currentIndex];

    const handleReview = (quality: number) => {
        onReview(card, quality);
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
        }, 300); // Wait for card flip animation before changing
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-teal-300 text-center">Repasando...</h2>
                 <p className="text-slate-400">{currentIndex + 1} / {cards.length}</p>
            </div>
            <ReviewCard card={card} onReview={handleReview} />
        </div>
    );
};


const FlashcardsPanel: React.FC<FlashcardsPanelProps> = ({ flashcards, onDelete, onReview }) => {
    const [isReviewing, setIsReviewing] = useState(false);

    const dueCards = useMemo(() => {
        const now = new Date();
        return flashcards
            .filter(card => new Date(card.nextReviewAt) <= now)
            .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
    }, [flashcards]);

    if (isReviewing) {
        return <ReviewSession cards={dueCards} onFinish={() => setIsReviewing(false)} onReview={onReview} />;
    }

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold text-teal-300 mb-2 text-center">Mis Flashcards</h2>
            <div className="text-center mb-4 px-2">
                <button
                    onClick={() => setIsReviewing(true)}
                    disabled={dueCards.length === 0}
                    className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    Repasar Flashcards ({dueCards.length} pendientes)
                </button>
            </div>

            {flashcards.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-lg">No tienes flashcards.</p>
                    <p>Selecciona texto en la conversación para crear una.</p>
                </div>
            ) : (
                <div className="space-y-2 overflow-y-auto pr-2 flex-grow">
                    <p className="text-sm text-slate-400 text-center mb-2">Todas las flashcards ({flashcards.length})</p>
                    {flashcards.map(card => (
                       <div key={card.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-white">{card.front}</p>
                                <p className="text-sm text-slate-300">{card.back}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                                className="p-1.5 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                                aria-label="Borrar flashcard"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                       </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlashcardsPanel;