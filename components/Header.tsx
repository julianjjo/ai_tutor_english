import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center p-4 md:p-6 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-lg"></div>
            <p className="text-slate-300 max-w-2xl mx-auto">
                Mejora tu inglés conversando en tiempo real. Selecciona tu nivel, elige un escenario y presiona el micrófono para comenzar.
            </p>
        </header>
    );
};

export default Header;