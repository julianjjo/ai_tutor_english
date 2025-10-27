import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('¡Revisa tu correo! Hemos enviado un enlace para que inicies sesión.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-800/60 border border-slate-700 rounded-2xl shadow-xl p-8 backdrop-blur-sm animate-fade-in-fast">
                <h1 className="text-2xl font-bold text-center text-white mb-2">Bienvenido al Tutor de IA</h1>
                <p className="text-center text-slate-400 mb-6">Inicia sesión para guardar tu progreso.</p>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-slate-300 text-sm font-bold mb-2">
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            className="w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Enviando...' : 'Enviar enlace mágico'}
                        </button>
                    </div>
                </form>
                {message && <p className="mt-4 text-center text-sm text-teal-300">{message}</p>}
            </div>
        </div>
    );
};

export default Auth;