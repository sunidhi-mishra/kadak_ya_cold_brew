import React, { useEffect, useRef } from 'react';
import { Message } from '../services/mockDb';

interface ChatRoomProps {
  messages: Message[];
  currentUser: string;
  onReact: (msgId: string, emoji: string) => void;
}

const AVAILABLE_EMOJIS = ['☕', '🍵', '🔥', '😂'];

export const ChatRoom: React.FC<ChatRoomProps> = ({ messages, onReact }) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar max-h-full">
      <div className="min-h-full flex flex-col justify-end space-y-5 pr-2">
        {messages.map((msg) => {
          const themeColorClass = msg.side === 'chai' 
            ? 'border-chaiOrange/60 text-chaiOrange' 
            : 'border-creamText/30 text-creamText/80';

          return (
            <div key={msg.id} className="flex flex-col space-y-1 font-mono text-left animate-fade-in select-none">
              {/* Username - All caps */}
              <span className="text-[9px] uppercase tracking-widest text-softGray/60 font-bold pl-1">
                {msg.username}
              </span>

              {/* Retro Border Box */}
              <div className={`bg-transparent border ${themeColorClass} px-2.5 py-1 rounded max-w-[220px] self-start`}>
                <span className="text-softGray/50 mr-1.5 font-bold">&gt;</span>
                <span className="text-[11px] tracking-wide text-creamText/95 leading-relaxed">{msg.text}</span>
              </div>

              {/* Minimal Emoji Reactions under the box */}
              <div className="flex items-center space-x-1 pl-1">
                {AVAILABLE_EMOJIS.map((emoji) => {
                  const count = msg.reactions[emoji] || 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact(msg.id, emoji)}
                      className={`text-[9px] hover:scale-115 transition ${
                        count > 0 ? 'opacity-100 font-bold text-creamText' : 'opacity-20 hover:opacity-60 text-softGray'
                      }`}
                    >
                      {emoji} {count > 0 ? count : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};
