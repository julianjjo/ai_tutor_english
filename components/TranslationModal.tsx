import React from 'react';

interface TranslationModalProps {
    word: string;
    translation: string;
    isVisible: boolean;
    onClose: () => void;
}

const TranslationModal: React.FC<TranslationModalProps> = ({ word, translation, isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-teal-300 capitalize mb-2">{word}</h3>
                <p className="text-2xl text-white font-semibold mb-4">{translation}</p>
                <button
                    onClick={onClose}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default TranslationModal;