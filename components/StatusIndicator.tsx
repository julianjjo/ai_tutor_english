
import React from 'react';
import { ConversationState } from '../types';

interface StatusIndicatorProps {
    state: ConversationState;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
    const getStatusInfo = () => {
        switch (state) {
            case ConversationState.LISTENING:
                return { text: 'Escuchando...', color: 'bg-blue-500', animate: true };
            case ConversationState.SPEAKING:
                return { text: 'Hablando...', color: 'bg-teal-500', animate: true };
            case ConversationState.IDLE:
                return { text: 'Presiona el micrófono para hablar', color: 'bg-gray-500', animate: false };
            case ConversationState.ERROR:
                return { text: 'Error', color: 'bg-red-500', animate: false };
            default:
                return { text: 'Listo', color: 'bg-gray-500', animate: false };
        }
    };

    const { text, color, animate } = getStatusInfo();

    return (
        <div className="flex items-center justify-center space-x-2 mb-4 h-6">
            <div className={`w-3 h-3 rounded-full ${color} ${animate ? 'animate-pulse' : ''}`}></div>
            <p className="text-gray-300">{text}</p>
        </div>
    );
};

export default StatusIndicator;
