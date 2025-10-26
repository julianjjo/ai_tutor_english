import React from 'react';
import { Persona, Scenario } from '../types';
import { PERSONAS, SCENARIOS } from '../constants';

interface SettingsPanelProps {
    selectedPersona: Persona;
    onPersonaChange: (persona: Persona) => void;
    selectedScenario: Scenario;
    onScenarioChange: (scenario: Scenario) => void;
    isDisabled: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    selectedPersona,
    onPersonaChange,
    selectedScenario,
    onScenarioChange,
    isDisabled,
}) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-teal-300 mb-2">1. Elige tu Nivel</h2>
                <div className="space-y-3">
                    {PERSONAS.map((persona) => (
                        <button
                            key={persona.id}
                            onClick={() => onPersonaChange(persona)}
                            disabled={isDisabled}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                                selectedPersona.id === persona.id
                                    ? 'bg-blue-600/30 border-blue-500'
                                    : 'bg-slate-700/50 border-slate-600 hover:border-blue-500'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <p className="font-bold text-slate-100">{persona.icon} {persona.name}</p>
                            <p className="text-sm text-slate-400">{persona.description}</p>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-lg font-semibold text-teal-300 mb-2">2. Elige un Escenario</h2>
                <div className="space-y-3">
                    {SCENARIOS.map((scenario) => (
                        <button
                            key={scenario.id}
                            onClick={() => onScenarioChange(scenario)}
                            disabled={isDisabled}
                             className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                                selectedScenario.id === scenario.id
                                    ? 'bg-blue-600/30 border-blue-500'
                                    : 'bg-slate-700/50 border-slate-600 hover:border-blue-500'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                           <p className="font-bold text-slate-100">{scenario.icon} {scenario.name}</p>
                           <p className="text-sm text-slate-400">{scenario.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;