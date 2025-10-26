import React from 'react';

interface SelectionToolbarProps {
    text: string;
    top: number;
    left: number;
    onAddFlashcard: (text: string) => void;
    onTranslate: (text: string) => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ text, top, left, onAddFlashcard, onTranslate }) => {
    return (
        <div
            className="selection-toolbar absolute z-20 flex gap-1 bg-slate-800 border border-slate-600 rounded-lg p-1 shadow-lg animate-fade-in-fast"
            style={{ top: `${top}px`, left: `${left}px` }}
        >
            <button
                onClick={() => onAddFlashcard(text)}
                title="Crear una flashcard con este texto"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Crear Flashcard
            </button>
            <button
                onClick={() => onTranslate(text)}
                title="Traducir este texto"
                className="px-3 py-1 text-sm bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13l4-4M19 5h-4M3 19h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
                Traducir
            </button>
        </div>
    );
};

export default SelectionToolbar;