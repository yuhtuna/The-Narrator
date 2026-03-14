import React, { ReactNode } from 'react';
import { GameProvider } from '../../context/GameContext';

interface GameLayoutProps {
  children: ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      {children}
    </div>
  );
}
