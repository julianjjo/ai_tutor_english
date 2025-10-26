import React from 'react';

interface ControlsProps {
    isConversing: boolean;
    onToggleConversation: () => void;
    onNewConversation: () => void;
    onSaveConversation: () => void;
    canSave: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
    isConversing, 
    onToggleConversation,
    onNewConversation,
    onSaveConversation,
    canSave
}) => {
    return (
        <div className="flex justify-center items-center gap-8">
             <button
                onClick={onNewConversation}
                disabled={isConversing}
                className="flex flex-col items-center text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Nueva conversación"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold">Nueva</span>
            </button>

            <button
                onClick={onToggleConversation}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4
                    ${isConversing
                        ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400'
                        : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400'
                    }
                `}
                aria-label={isConversing ? 'Detener conversación' : 'Iniciar conversación'}
            >
                {isConversing ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="8" y="8" width="8" height="8" rx="1" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                )}
            </button>
            
            <button
                onClick={onSaveConversation}
                disabled={!canSave}
                className="flex flex-col items-center text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Guardar conversación"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-xs font-semibold">Guardar</span>
            </button>
        </div>
    );
};

export default Controls;