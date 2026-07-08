import React from 'react';
import { mockDb } from '../services/mockDb';

interface OnboardingProps {
  onJoin: (side: 'chai' | 'coffee', username: string, sessionId: string) => void;
}

const chaiNames = [
  'Adrak', 'Kadak', 'Elaichi', 'Masala', 'Cutting', 
  'Tulsi', 'Kesar', 'Tandoori', 'Kulhad', 'Ginger-Tea'
];

const coffeeNames = [
  'Cold-Brew', 'Espresso', 'Latte', 'Mocha', 'Cappuccino', 
  'Americano', 'Macchiato', 'Cortado', 'Flat-White', 'Affogato'
];

export const Onboarding: React.FC<OnboardingProps> = ({ onJoin }) => {
  const handleSelectSide = (side: 'chai' | 'coffee') => {
    // Generate themed random username
    const namePool = side === 'chai' ? chaiNames : coffeeNames;
    const randomName = namePool[Math.floor(Math.random() * namePool.length)];
    const randomNum = Math.floor(10 + Math.random() * 90); // 2-digit suffix
    const username = `${randomName}-${randomNum}`;
    
    // Create random UUID-like string
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Register vote
    mockDb.vote(side);
    
    // Call parent handler
    onJoin(side, username, sessionId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-warmBg px-6 select-none animate-fade-in">
      <div className="text-center mb-16 max-w-md">
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-creamText mb-4">
          Kadak ya Cold Brew
        </h1>
        <p className="text-softGray text-sm sm:text-base tracking-wide uppercase">
          Pick your side · Enter the match
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Chai Side Card */}
        <button
          onClick={() => handleSelectSide('chai')}
          className="group relative flex flex-col items-center justify-center p-12 rounded-3xl bg-neutral-900/40 border border-chaiOrange/20 hover:border-chaiOrange/60 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(200,114,44,0.15)] active:scale-95"
        >
          <div className="text-7xl mb-6 transition-transform duration-300 group-hover:scale-110">
            ☕
          </div>
          <span className="text-2xl font-bold font-display text-chaiOrange mb-2">
            Chai
          </span>
          <span className="text-xs text-softGray/80 text-center max-w-[200px]">
            Strong, aromatic, steeped in tradition.
          </span>
        </button>

        {/* Coffee Side Card */}
        <button
          onClick={() => handleSelectSide('coffee')}
          className="group relative flex flex-col items-center justify-center p-12 rounded-3xl bg-neutral-900/40 border border-creamText/10 hover:border-creamText/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(240,228,208,0.08)] active:scale-95"
        >
          <div className="text-7xl mb-6 transition-transform duration-300 group-hover:scale-110">
            🍵
          </div>
          <span className="text-2xl font-bold font-display text-creamText mb-2">
            Coffee
          </span>
          <span className="text-xs text-softGray/80 text-center max-w-[200px]">
            Bold, chilled, smooth energy.
          </span>
        </button>
      </div>

      <div className="mt-16 text-xs text-softGray/40 text-center">
        No sign-up required. Completely anonymous session.
      </div>
    </div>
  );
};
