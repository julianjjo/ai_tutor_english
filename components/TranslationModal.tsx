import React from 'react';

interface TranslationModalProps {
    word: string;
    translation: string;
    explanation: string;
    isVisible: boolean;
    onClose: () => void;
}

const TranslationModal: React.FC<TranslationModalProps> = ({ word, translation, explanation, isVisible, onClose }) => {
    if (!isVisible) return null;

    // A simple parser to handle basic markdown (bold and numbered lists)
    const renderExplanation = (text: string) => {
        if (!text) return null;
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-teal-300">$1</strong>') // Bold
            .replace(/\n(\d+\.)\s*(.*?)(?=\n\d+\.|$)/gs, '<div class="mt-2 flex"><span class="text-slate-400 mr-2 font-semibold">$1</span><span>$2</span></div>'); // Numbered lists
        return { __html: html };
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-fast"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-6 text-left flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0">
                    <p className="text-sm text-slate-400">Palabra o Frase</p>
                    <h3 className="text-2xl font-bold text-white capitalize mb-4 break-words">{word}</h3>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg mb-4 flex-shrink-0">
                     <p className="text-sm text-teal-400">Traducción</p>
                    <p className="text-xl text-white font-semibold break-words">{translation}</p>
                </div>
                
                {explanation && (
                    <div className="flex-grow overflow-y-auto pr-2">
                        <p className="text-sm text-teal-400 mb-2">Explicación</p>
                        <div 
                            className="text-slate-300 space-y-2 text-base leading-relaxed" 
                            dangerouslySetInnerHTML={renderExplanation(explanation)}
                        />
                    </div>
                )}
                
                <div className="mt-6 text-center flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TranslationModal;