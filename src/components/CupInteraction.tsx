import React, { useState, useEffect, useRef } from 'react';
import { audioSynth } from '../services/audioSynth';

interface CupInteractionProps {
  side: 'chai' | 'coffee';
}

export const CupInteraction: React.FC<CupInteractionProps> = ({ side }) => {
  const [liquidLevel, setLiquidLevel] = useState(100);
  const [isHolding, setIsHolding] = useState(false);
  const [isTilting, setIsTilting] = useState(false);
  const [isRippling, setIsRippling] = useState(false);
  const [showRefillPrompt, setShowRefillPrompt] = useState(false);
  const timerRef = useRef<number | null>(null);
  const levelIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isHolding) {
      triggerSlurpTick(true);

      timerRef.current = window.setInterval(() => {
        triggerSlurpTick(false);
      }, 350);

      levelIntervalRef.current = window.setInterval(() => {
        setLiquidLevel((prev) => {
          const next = prev - 8;
          if (next <= 5) {
            setIsHolding(false);
            return 5;
          }
          return next;
        });
      }, 250);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (levelIntervalRef.current) window.clearInterval(levelIntervalRef.current);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (levelIntervalRef.current) window.clearInterval(levelIntervalRef.current);
    };
  }, [isHolding]);

  const triggerSlurpTick = (isFirst: boolean) => {
    audioSynth.playSlurp(isFirst);
    setIsTilting(true);
    setTimeout(() => setIsTilting(false), 200);
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 250);

    if (navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  const refillLiquid = () => {
    audioSynth.playPour();
    const interval = window.setInterval(() => {
      setLiquidLevel((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 30);
  };

  const startSipping = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (showRefillPrompt) return;
    audioSynth.ensureContextStarted();

    if (liquidLevel <= 5) {
      setShowRefillPrompt(true);
    } else {
      setIsHolding(true);
    }
  };

  const stopSipping = () => {
    setIsHolding(false);
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full h-full">
      <div 
        className="relative w-56 h-56 flex items-center justify-center cursor-pointer"
        onTouchStart={startSipping}
        onTouchEnd={stopSipping}
        onMouseDown={startSipping}
        onMouseUp={stopSipping}
        onMouseLeave={stopSipping}
      >
        {showRefillPrompt && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm rounded-full flex flex-col items-center justify-center p-4 border border-neutral-800/80 text-center z-10 animate-fade-in select-none">
            <p className="text-xs font-bold font-mono text-creamText mb-3">Refill your cup?</p>
            <div className="flex space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refillLiquid();
                  setShowRefillPrompt(false);
                }}
                className="px-3 py-1 bg-chaiOrange/25 hover:bg-chaiOrange/45 border border-chaiOrange/40 rounded text-[9px] font-bold font-mono tracking-wider text-creamText transition"
              >
                YES
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRefillPrompt(false);
                }}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[9px] font-bold font-mono text-softGray transition"
              >
                NO
              </button>
            </div>
          </div>
        )}

        {/* Steam Wisps */}
        <div className="absolute -top-12 left-0 right-0 flex justify-center space-x-6 pointer-events-none">
          <svg className="w-16 h-12 opacity-30" viewBox="0 0 100 80">
            <path
              d="M30,70 Q25,50 35,30 T25,0"
              fill="none"
              stroke="#f0e4d0"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-steam"
              style={{ animationDelay: '0s' }}
            />
            <path
              d="M50,70 Q55,50 45,30 T55,0"
              fill="none"
              stroke="#f0e4d0"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-steam"
              style={{ animationDelay: '0.8s' }}
            />
            <path
              d="M70,70 Q65,50 75,30 T65,0"
              fill="none"
              stroke="#f0e4d0"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-steam"
              style={{ animationDelay: '1.6s' }}
            />
          </svg>
        </div>

        {/* Cup Vector */}
        <div
          className={`w-40 h-40 transition-transform duration-200 ease-out origin-bottom ${
            isTilting ? 'rotate-[-5deg] scale-105' : 'rotate-0'
          }`}
        >
          {side === 'chai' ? (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(200,114,44,0.2)]">
              <defs>
                <clipPath id="kulhad-liquid-clip">
                  <path d="M22 25 L78 25 L68 85 L32 85 Z" />
                </clipPath>
              </defs>
              <path d="M20 20 L80 20 L70 90 L30 90 Z" fill="#b05d24" stroke="#78340d" strokeWidth="2.5" />
              <path d="M22 42 Q50 45 78 42" fill="none" stroke="#8c4314" strokeWidth="2" />
              <path d="M25 66 Q50 69 75 66" fill="none" stroke="#8c4314" strokeWidth="2" />

              <g clipPath="url(#kulhad-liquid-clip)">
                <rect 
                  x="0" 
                  y={100 - liquidLevel * 0.65} 
                  width="100" 
                  height="100" 
                  fill="#df9c5e" 
                />
                <ellipse 
                  cx="50" 
                  cy={100 - liquidLevel * 0.65} 
                  rx="28" 
                  ry={isRippling ? "5" : "2"} 
                  fill="#f1bf8f" 
                  className="transition-all duration-150"
                />
              </g>
              <ellipse cx="50" cy="20" rx="30" ry="6" fill="#c66f34" stroke="#78340d" strokeWidth="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
              <defs>
                <clipPath id="mug-liquid-clip">
                  <path d="M26 25 L74 25 L70 82 L30 82 Z" />
                </clipPath>
              </defs>
              <path d="M72 35 C88 35 88 70 71 70" fill="none" stroke="#251a17" strokeWidth="8" strokeLinecap="round" />
              <path d="M24 20 L76 20 L72 85 L28 85 Z" fill="#251a17" stroke="#120c0a" strokeWidth="2.5" />

              <g clipPath="url(#mug-liquid-clip)">
                <rect 
                  x="0" 
                  y={100 - liquidLevel * 0.62} 
                  width="100" 
                  height="100" 
                  fill="#2b1a13" 
                />
                <ellipse 
                  cx="50" 
                  cy={100 - liquidLevel * 0.62} 
                  rx="24" 
                  ry={isRippling ? "4" : "1.5"} 
                  fill="#785947" 
                  className="transition-all duration-150"
                />
              </g>
              <ellipse cx="50" cy="20" rx="26" ry="5" fill="#382923" stroke="#120c0a" strokeWidth="2" />
            </svg>
          )}
        </div>
      </div>

      <div className="text-center mt-3">
        <p className="text-[10px] text-softGray/50 uppercase tracking-widest font-mono select-none pointer-events-none mb-1">
          {isHolding ? 'GULPING...' : 'PRESS & HOLD MOUSE'}
        </p>
        <button
          onTouchStart={startSipping}
          onTouchEnd={stopSipping}
          onMouseDown={startSipping}
          onMouseUp={stopSipping}
          onMouseLeave={stopSipping}
          className={`px-6 py-2 rounded border font-mono text-xs uppercase tracking-wider transition-all select-none ${
            side === 'chai'
              ? 'border-chaiOrange/40 text-chaiOrange hover:bg-chaiOrange/10'
              : 'border-creamText/40 text-creamText hover:bg-creamText/10'
          } ${isHolding ? 'scale-95 bg-white/5' : ''}`}
        >
          {isHolding ? 'Sipping... 🤤' : 'Hold to Sip'}
        </button>
      </div>
    </div>
  );
};
