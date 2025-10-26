import React from 'react';
import { SavedConversation } from '../types';

interface HistoryPanelProps {
    conversations: SavedConversation[];
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ conversations, onLoad, onDelete }) => {
    
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDelete(id);
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold text-teal-300 mb-4 text-center">Historial de Conversaciones</h2>
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="text-lg">No hay conversaciones guardadas.</p>
                    <p>Completa una sesión y presiona "Guardar".</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {conversations.map((convo) => (
                        <div 
                            key={convo.id}
                            onClick={() => onLoad(convo.id)}
                            className="bg-slate-700/50 p-3 rounded-lg border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <p className="font-bold text-white truncate">{convo.title}</p>
                                    <p className="text-sm text-gray-400 mb-2">
                                        {new Date(convo.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, convo.id)}
                                    className="ml-2 p-1 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    aria-label="Borrar conversación"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;