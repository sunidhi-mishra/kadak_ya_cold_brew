import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { CupInteraction } from './components/CupInteraction';
import { TugOfWar } from './components/TugOfWar';
import { ChatRoom } from './components/ChatRoom';
import { presenceService, UserPresence, mockDb, Message } from './services/mockDb';
import { audioSynth } from './services/audioSynth';
import { Share2, Volume2, VolumeX } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<{
    side: 'chai' | 'coffee';
    username: string;
    sessionId: string;
    loginTime: number;
  } | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    presenceService.join(user.sessionId, user.username, user.side);

    const unsubscribePresence = presenceService.subscribe((users) => {
      setOnlineUsers(users);
    });

    const unsubscribeDb = mockDb.subscribe(() => {
      const allMsgs = mockDb.getMessages();
      // Only keep welcome messages or messages sent after the user logged in
      const filtered = allMsgs.filter(
        (msg) => msg.id.startsWith('welcome-') || msg.timestamp >= user.loginTime
      );
      setMessages(filtered);
    });

    const handleBeforeUnload = () => {
      presenceService.leave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      presenceService.leave();
      unsubscribePresence();
      unsubscribeDb();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const handleJoin = (side: 'chai' | 'coffee', username: string, sessionId: string) => {
    setUser({ side, username, sessionId, loginTime: Date.now() });
    audioSynth.ensureContextStarted();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputText.trim()) return;
    mockDb.postMessage(user.side, user.username, inputText.trim());
    setInputText('');
  };

  const handleToggleMute = () => {
    const nextMuted = audioSynth.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleReact = (msgId: string, emoji: string) => {
    mockDb.reactToMessage(msgId, emoji);
  };

  const handleShare = async () => {
    const stats = mockDb.getStats();
    const shareText = `${stats.displayedChaiPercent}% Chai · ${stats.displayedCoffeePercent}% Coffee — Which side are you on? Join Kadak ya Cold Brew!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kadak ya Cold Brew',
          text: shareText,
          url: shareUrl,
        });
      } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { }
    }
  };

  const handleLeave = () => {
    presenceService.leave();
    setUser(null);
  };

  if (!user) {
    return <Onboarding onJoin={handleJoin} />;
  }

  const userThemeColor = user.side === 'chai' ? 'text-chaiOrange' : 'text-creamText';

  const bgStyle = user.side === 'chai'
    ? { backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0.007) 1px, transparent 1px), radial-gradient(circle at 50% 50%, #20110c 0%, #0e0705 100%)' }
    : { backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0.007) 1px, transparent 1px), radial-gradient(circle at 50% 50%, #110e0d 0%, #060505 100%)' };

  return (
    <div
      style={bgStyle}
      className="h-screen w-screen overflow-hidden flex flex-col justify-between font-mono text-creamText relative"
    >

      {/* Header bar (responsive design with collapsible labels) */}
      <header className="h-14 border-b border-neutral-900 bg-black/40 px-4 sm:px-6 flex justify-between items-center select-none shrink-0 z-40">
        <div className="flex flex-col">
          <h1 className="text-xs sm:text-sm font-bold tracking-widest text-creamText">
            KADAK VS COLD BREW
          </h1>
          <span className="text-[8px] sm:text-[9px] text-softGray/50 uppercase tracking-widest mt-0.5 hidden xs:block">
            Sip &amp; Banter · Free · Anonymous
          </span>
        </div>

        <div className="flex items-center space-x-0 h-full border-l border-neutral-900">
          {/* Active Online Banner */}
          <div className="px-2.5 sm:px-4 h-full flex items-center border-r border-neutral-900 text-[10px] sm:text-xs font-bold bg-chaiOrange/10 text-chaiOrange">
            ● {onlineUsers.length} <span className="hidden sm:inline ml-1">ONLINE</span>
          </div>

          {/* Sound Control */}
          <button
            onClick={handleToggleMute}
            className="px-2.5 sm:px-4 h-full flex items-center text-[10px] sm:text-xs hover:bg-neutral-950 text-softGray transition-colors border-r border-neutral-900"
            title="Toggle Ambient Audio"
          >
            {isMuted ? (
              <span className="flex items-center space-x-1 sm:space-x-1.5"><VolumeX className="w-3.5 h-3.5" /> <span className="hidden sm:inline">MUTED</span></span>
            ) : (
              <span className="flex items-center space-x-1 sm:space-x-1.5"><Volume2 className="w-3.5 h-3.5 text-chaiOrange" /> <span className="text-creamText hidden sm:inline">LIVE</span></span>
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="px-2.5 sm:px-4 h-full flex items-center text-[10px] sm:text-xs hover:bg-neutral-950 text-softGray transition-colors border-r border-neutral-900"
          >
            {copied ? (
              <span className="text-green-400 font-bold text-[9px] sm:text-[10px]">COPIED</span>
            ) : (
              <span className="flex items-center space-x-1 sm:space-x-1.5"><Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">SHARE</span></span>
            )}
          </button>

          {/* Exit */}
          <button
            onClick={handleLeave}
            className="px-2.5 sm:px-4 h-full flex items-center text-[10px] sm:text-xs hover:bg-neutral-950 text-red-500/80 hover:text-red-500 transition-colors"
          >
            <span>EXIT</span>
          </button>
        </div>
      </header>

      {/* Main Sandbox Canvas (Responsive Stacked Grid) */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-12 pt-3 sm:pt-6 pb-3 sm:pb-6 grid grid-cols-12 gap-4 md:gap-8 items-stretch md:items-end overflow-y-auto md:overflow-hidden min-h-0 relative">

        {/* Left Section: Chat room (placed at bottom on mobile, right above footer input) */}
        <section className="col-span-12 md:col-span-4 h-[35vh] md:h-[90%] flex flex-col justify-end overflow-hidden order-3 md:order-1 border-t md:border-t-0 border-neutral-900/40 pt-3 md:pt-0">
          <ChatRoom
            messages={messages}
            currentUser={user.username}
            onReact={handleReact}
          />
        </section>

        {/* Center Section: Float Mug Interaction */}
        <section className="col-span-12 md:col-span-4 h-[30vh] md:h-full flex flex-col items-center justify-center relative order-2 md:order-2">
          <div className="flex-1 flex flex-col items-center justify-center">
            <CupInteraction side={user.side} />
          </div>
        </section>

        {/* Right Section: Floating Tug-Of-War stats */}
        <section className="col-span-12 md:col-span-4 h-auto md:h-full flex flex-col justify-start pt-2 order-1 md:order-3">
          <TugOfWar />
        </section>

      </main>

      {/* Full-width Bottom input console bar */}
      <footer className="h-12 border-t border-neutral-900/60 bg-black/20 flex items-center shrink-0 z-30">
        <form onSubmit={handleSendMessage} className="w-full h-full flex items-center justify-between">

          {/* User Name Tag */}
          <div className={`px-4 sm:px-6 h-full flex items-center font-bold text-[10px] sm:text-xs select-none uppercase ${userThemeColor}`}>
            {user.username}
          </div>

          <div className="text-softGray/30 h-full flex items-center select-none border-l border-neutral-900/60 px-2 sm:px-4">
            |
          </div>

          {/* Message Input Box */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type here..."
            maxLength={100}
            className="flex-1 h-full bg-transparent px-3 sm:px-4 text-[11px] sm:text-xs text-creamText placeholder-softGray/20 focus:outline-none font-mono"
          />

          {/* Custom Solid SEND button block */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`h-full px-5 sm:px-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${inputText.trim()
                ? 'bg-chaiOrange text-white hover:brightness-110 active:scale-95'
                : 'bg-neutral-900/40 text-softGray/30 cursor-not-allowed'
              }`}
          >
            SEND
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
