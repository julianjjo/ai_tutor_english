import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../types';

interface ConversationViewProps {
    transcript: TranscriptEntry[];
}

const ConversationView: React.FC<ConversationViewProps> = ({ transcript }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-6">
                {transcript.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-lg">La conversación aparecerá aquí.</p>
                        <p>Presiona el micrófono para empezar a hablar.</p>
                      </div>
                ) : (
                    transcript.map((entry) => (
                        <div key={entry.id} className={`flex gap-3 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {entry.speaker === 'ai' && (
                                <div className="w-10 h-10 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center font-bold">IA</div>
                            )}
                            <div 
                                className={`ai-message-bubble max-w-md lg:max-w-2xl p-4 rounded-2xl ${entry.speaker === 'user'
                                            ? 'bg-blue-600 rounded-br-none'
                                            : 'bg-slate-700 rounded-bl-none'
                                        } ${entry.isPartial ? 'opacity-70' : ''}`}
                            >
                                <p className="text-white whitespace-pre-wrap select-text">
                                    {entry.text}
                                </p>
                            </div>
                            {entry.speaker === 'user' && (
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold">TÚ</div>
                            )}
                        </div>
                    ))
                )}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};

export default ConversationView;