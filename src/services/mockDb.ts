// Mock Realtime Database Service using BroadcastChannel and localStorage
// Allows instant multi-tab synchronization without Firebase.

export interface Message {
  id: string;
  side: 'chai' | 'coffee';
  username: string;
  text: string;
  timestamp: number;
  reactions: Record<string, number>;
}

export interface Stats {
  chaiCount: number;
  coffeeCount: number;
  lastUpdated: number;
  displayedChaiPercent: number;
  displayedCoffeePercent: number;
  commentaryLine: string;
}

export interface UserPresence {
  sessionId: string;
  username: string;
  side: 'chai' | 'coffee';
  lastSeen: number;
}

const STATS_KEY = 'kadak_stats_v1';
const CHAT_KEY = 'kadak_chat_v1';

// Cricket-commentary-style templates based on margin
const commentaryTemplates = {
  nailBiter: [
    "Nail-biter! Chai edges ahead by a whisker ☕",
    "It's a tight single! Coffee and Chai running neck and neck 🍵 ☕",
    "Super Over territory! Neither side giving an inch!",
    "Chai trying to consolidate, but Coffee is bowling a tight spell 🏏",
    "A clean sweep is unlikely here, both teams locking horns!"
  ],
  comfortableLead: [
    "Chai's cruising at a healthy run rate today ☕",
    "Coffee's found its rhythm, pulling off a comfortable lead 🍵",
    "A solid middle-overs partnership here. Chai looking steady.",
    "Coffee is finding the gaps nicely, building a solid boundary lead 🏏",
    "Chai is controlling the tempo now, dictating play."
  ],
  blowout: [
    "Coffee's been bowled out early, Chai declares the innings ☕😏",
    "An absolute masterclass! Coffee is hitting sixes out of the park 🍵💥",
    "Chai is running away with the match, Coffee needs a miracle!",
    "A clean innings defeat looms for Coffee if they don't step up 🏏",
    "Chai dominates the pitch completely today!"
  ]
};

// Helper to select commentary
function getCommentary(chaiPercent: number, coffeePercent: number): string {
  const margin = Math.abs(chaiPercent - coffeePercent);
  const leadingSide = chaiPercent > coffeePercent ? 'Chai' : 'Coffee';
  const leadingEmoji = leadingSide === 'Chai' ? '☕' : '🍵';
  const templates =
    margin < 10
      ? commentaryTemplates.nailBiter
      : margin <= 30
      ? commentaryTemplates.comfortableLead
      : commentaryTemplates.blowout;

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/Chai/g, leadingSide).replace(/Coffee/g, leadingSide === 'Chai' ? 'Coffee' : 'Chai');
}

// Initial stats if not present
const getInitialStats = (): Stats => {
  const defaultStats: Stats = {
    chaiCount: 15, // start with some fun initial counts
    coffeeCount: 12,
    lastUpdated: Date.now(),
    displayedChaiPercent: 55,
    displayedCoffeePercent: 45,
    commentaryLine: "The match is underway! Chai takes an early lead ☕"
  };

  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Auto-update hourly if needed
      return checkAndRunHourlyUpdate(parsed);
    }
  } catch (e) {
    console.error('Failed to read stats from localStorage', e);
  }
  
  localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
  return defaultStats;
};

// Check if 1 hour has passed and recalculate percentages
function checkAndRunHourlyUpdate(stats: Stats): Stats {
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;
  if (now - stats.lastUpdated >= ONE_HOUR) {
    const total = stats.chaiCount + stats.coffeeCount;
    let chaiP = 50;
    let coffeeP = 50;
    if (total > 0) {
      chaiP = Math.round((stats.chaiCount / total) * 100);
      coffeeP = 100 - chaiP;
    }
    stats.displayedChaiPercent = chaiP;
    stats.displayedCoffeePercent = coffeeP;
    stats.commentaryLine = getCommentary(chaiP, coffeeP);
    stats.lastUpdated = now;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
  return stats;
}

// Initial messages
const getInitialMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(CHAT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to read chat from localStorage', e);
  }
  // Default welcoming comments
  const defaultMessages: Message[] = [
    {
      id: 'welcome-1',
      side: 'chai',
      username: 'Adrak-42',
      text: 'Welcome to Kadak Ya Cold Brew! Tap the cup to sip ☕',
      timestamp: Date.now() - 60000 * 5,
      reactions: { '🔥': 2 }
    },
    {
      id: 'welcome-2',
      side: 'coffee',
      username: 'Cold-Brew-7',
      text: 'Cold Brew wins by default. Coffee lovers rise up! 🍵',
      timestamp: Date.now() - 60000 * 3,
      reactions: { '😂': 1 }
    }
  ];
  localStorage.setItem(CHAT_KEY, JSON.stringify(defaultMessages));
  return defaultMessages;
};

// Setup Broadcast Channel
const channel = new BroadcastChannel('kadak_ya_cold_brew_channel');

type DbCallback = () => void;
const listeners = new Set<DbCallback>();

// Channel listener
channel.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'new_message' || type === 'reaction' || type === 'stats_updated') {
    // Notify all locally registered listeners
    listeners.forEach((cb) => cb());
  }
};

export const mockDb = {
  // Subscribe to DB changes
  subscribe(callback: DbCallback): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  // Get current stats
  getStats(): Stats {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      if (stored) {
        return checkAndRunHourlyUpdate(JSON.parse(stored));
      }
    } catch {}
    return getInitialStats();
  },

  // Record a side selection vote
  vote(side: 'chai' | 'coffee'): void {
    const stats = this.getStats();
    if (side === 'chai') {
      stats.chaiCount += 1;
    } else {
      stats.coffeeCount += 1;
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    channel.postMessage({ type: 'stats_updated' });
    listeners.forEach((cb) => cb());
  },

  // Get messages
  getMessages(): Message[] {
    return getInitialMessages();
  },

  // Post new message
  postMessage(side: 'chai' | 'coffee', username: string, text: string): void {
    const messages = this.getMessages();
    const newMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      side,
      username,
      text,
      timestamp: Date.now(),
      reactions: {}
    };

    messages.push(newMsg);

    // Keep only last 50 for storage, last 20 will be displayed in UI
    const truncated = messages.slice(-50);
    localStorage.setItem(CHAT_KEY, JSON.stringify(truncated));

    // Broadcast to other tabs
    channel.postMessage({ type: 'new_message', payload: newMsg });
    listeners.forEach((cb) => cb());
  },

  // React to message
  reactToMessage(msgId: string, emoji: string): void {
    const messages = this.getMessages();
    const msg = messages.find((m) => m.id === msgId);
    if (msg) {
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
      channel.postMessage({ type: 'reaction', payload: { msgId, emoji } });
      listeners.forEach((cb) => cb());
    }
  },

  // Force hourly stats update manually for instant testing/debugging
  forceHourlyUpdate(): void {
    const stats = this.getStats();
    const total = stats.chaiCount + stats.coffeeCount;
    let chaiP = 50;
    let coffeeP = 50;
    if (total > 0) {
      chaiP = Math.round((stats.chaiCount / total) * 100);
      coffeeP = 100 - chaiP;
    }
    stats.displayedChaiPercent = chaiP;
    stats.displayedCoffeePercent = coffeeP;
    stats.commentaryLine = getCommentary(chaiP, coffeeP);
    stats.lastUpdated = Date.now();
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    channel.postMessage({ type: 'stats_updated' });
    listeners.forEach((cb) => cb());
  }
};

// --- Presence Management ---
// We use a separate BroadcastChannel to track online users across tabs.
const presenceChannel = new BroadcastChannel('kadak_presence');
let onlineUsers: Record<string, UserPresence> = {};
let currentPresence: UserPresence | null = null;
const presenceListeners = new Set<(users: UserPresence[]) => void>();

presenceChannel.onmessage = (event) => {
  const { type, payload } = event.data;
  const now = Date.now();

  if (type === 'join' || type === 'heartbeat') {
    onlineUsers[payload.sessionId] = {
      ...payload,
      lastSeen: now
    };
    notifyPresenceListeners();
  } else if (type === 'leave') {
    delete onlineUsers[payload.sessionId];
    notifyPresenceListeners();
  } else if (type === 'ping' && currentPresence) {
    // Reply with pong/heartbeat so new tab gets current active sessions
    presenceChannel.postMessage({ type: 'heartbeat', payload: currentPresence });
  }
};

// Clean stale sessions (e.g., tabs that closed without 'leave' trigger)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  Object.keys(onlineUsers).forEach((id) => {
    if (now - onlineUsers[id].lastSeen > 8000) {
      delete onlineUsers[id];
      changed = true;
    }
  });
  if (changed) notifyPresenceListeners();

  // Send periodic heartbeat to keep other tabs updated and update our own local timestamp
  if (currentPresence) {
    onlineUsers[currentPresence.sessionId] = {
      ...currentPresence,
      lastSeen: now
    };
    presenceChannel.postMessage({ type: 'heartbeat', payload: currentPresence });
  }
}, 3000);

function notifyPresenceListeners() {
  const list = Object.values(onlineUsers);
  presenceListeners.forEach((cb) => cb(list));
}

export const presenceService = {
  subscribe(callback: (users: UserPresence[]) => void): () => void {
    presenceListeners.add(callback);
    // Immediately notify with current known users
    callback(Object.values(onlineUsers));
    // Request other tabs to announce themselves
    presenceChannel.postMessage({ type: 'ping' });
    return () => {
      presenceListeners.delete(callback);
    };
  },

  join(sessionId: string, username: string, side: 'chai' | 'coffee'): void {
    currentPresence = { sessionId, username, side, lastSeen: Date.now() };
    onlineUsers[sessionId] = currentPresence;
    presenceChannel.postMessage({ type: 'join', payload: currentPresence });
    notifyPresenceListeners();
  },

  leave(): void {
    if (currentPresence) {
      presenceChannel.postMessage({ type: 'leave', payload: currentPresence });
      delete onlineUsers[currentPresence.sessionId];
      currentPresence = null;
      notifyPresenceListeners();
    }
  }
};
