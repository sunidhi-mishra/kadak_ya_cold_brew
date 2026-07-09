import React, { useState, useEffect } from 'react';
import { mockDb, Stats } from '../services/mockDb';

export const TugOfWar: React.FC = () => {
  const [stats, setStats] = useState<Stats>(mockDb.getStats());
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    const unsubscribe = mockDb.subscribe(() => {
      setStats(mockDb.getStats());
    });

    const timer = setInterval(() => {
      const currentStats = mockDb.getStats();
      const now = Date.now();
      const ONE_HOUR = 3600 * 1000;
      const elapsed = now - currentStats.lastUpdated;
      const remaining = Math.max(0, ONE_HOUR - elapsed);

      if (remaining <= 0) {
        mockDb.forceHourlyUpdate();
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeftStr(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const chaiP = stats.displayedChaiPercent;
  const coffeeP = stats.displayedCoffeePercent;

  return (
    <div className="w-full bg-black/40 border border-neutral-900 rounded p-4 flex flex-col font-mono">
      {/* Percentage Bar Header */}
      <div className="flex justify-between items-center text-xs mb-2">
        <span className="font-bold text-chaiOrange">
          ☕ CHAI {chaiP}%
        </span>
        <span className="text-softGray/50">MATCH STATUS</span>
        <span className="font-bold text-creamText">
          {coffeeP}% COFFEE 🍵
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-3 bg-neutral-950 rounded overflow-hidden flex border border-neutral-900">
        <div
          style={{ width: `${chaiP}%` }}
          className="h-full bg-chaiOrange/80 transition-all duration-1000 ease-out"
        />
        <div
          style={{ width: `${coffeeP}%` }}
          className="h-full bg-coffeeBrown transition-all duration-1000 ease-out"
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black/80 -translate-x-1/2" />
      </div>

      {/* Stats Footer Details */}
      <div className="flex justify-between items-center mt-2 text-[10px] text-softGray/40">
        <span>ENTRIES: {stats.chaiCount + stats.coffeeCount}</span>
        <span>NEXT TICK: <strong className="text-creamText">{timeLeftStr || '--'}</strong></span>
      </div>

      {/* Live Banter line */}
      <div className="mt-3 pt-3 border-t border-neutral-900/60 text-center">
        <p className="text-xs text-creamText/85 italic leading-relaxed">
          "{stats.commentaryLine}"
        </p>
      </div>
    </div>
  );
};
