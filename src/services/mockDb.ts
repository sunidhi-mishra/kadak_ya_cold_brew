import { db } from '../firebaseConfig';
import { 
  ref, 
  onValue, 
  push, 
  set, 
  runTransaction, 
  limitToLast, 
  query, 
  onDisconnect, 
  serverTimestamp 
} from 'firebase/database';

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
    "Chai dominates the pitch completely today!",
    "A clean innings defeat looms for Coffee if they don't step up 🏏"
  ]
};

function getCommentary(chaiPercent: number, coffeePercent: number): string {
  const margin = Math.abs(chaiPercent - coffeePercent);
  const leadingSide = chaiPercent > coffeePercent ? 'Chai' : 'Coffee';
  const templates =
    margin < 10
      ? commentaryTemplates.nailBiter
      : margin <= 30
      ? commentaryTemplates.comfortableLead
      : commentaryTemplates.blowout;

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/Chai/g, leadingSide).replace(/Coffee/g, leadingSide === 'Chai' ? 'Coffee' : 'Chai');
}

// Caches for synchronous getters
let cachedMessages: Message[] = [];
let cachedStats: Stats = {
  chaiCount: 15,
  coffeeCount: 12,
  lastUpdated: Date.now(),
  displayedChaiPercent: 55,
  displayedCoffeePercent: 45,
  commentaryLine: "The match is underway! Chai takes an early lead ☕"
};
let cachedPresence: UserPresence[] = [];

// Database callbacks subscriptions
const dbListeners = new Set<() => void>();
const presenceListeners = new Set<(users: UserPresence[]) => void>();

// Subscribe to Live Stats
onValue(ref(db, 'stats'), (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    // Automatically seed initial stats if node is empty
    set(ref(db, 'stats'), {
      chaiCount: 15,
      coffeeCount: 12,
      lastUpdated: Date.now(),
      displayedChaiPercent: 55,
      displayedCoffeePercent: 45,
      commentaryLine: "The match is underway! Chai takes an early lead ☕"
    });
    return;
  }
  cachedStats = data;
  // Check client-side if we need to trigger an hourly update on Firebase
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;
  if (now - cachedStats.lastUpdated >= ONE_HOUR) {
    mockDb.forceHourlyUpdate();
  } else {
    dbListeners.forEach((cb) => cb());
  }
});

// Subscribe to Live Chat (last 15 messages)
const chatQuery = query(ref(db, 'chat/messages'), limitToLast(15));
onValue(chatQuery, (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    // Automatically seed default messages if node is empty
    const messagesRef = ref(db, 'chat/messages');
    const welcome1 = push(messagesRef);
    set(welcome1, {
      side: 'chai',
      username: 'Adrak-42',
      text: 'Welcome to Kadak Ya Cold Brew! Tap the cup to sip ☕',
      timestamp: Date.now() - 300000, // 5 min ago
      reactions: { '🔥': 2 }
    });
    const welcome2 = push(messagesRef);
    set(welcome2, {
      side: 'coffee',
      username: 'Cold-Brew-7',
      text: 'Cold Brew wins by default. Coffee lovers rise up! 🍵',
      timestamp: Date.now() - 180000, // 3 min ago
      reactions: { '😂': 1 }
    });
    return;
  }
  const list: Message[] = [];
  Object.keys(data).forEach((key) => {
    const val = data[key];
    list.push({
      id: key,
      side: val.side,
      username: val.username,
      text: val.text,
      timestamp: val.timestamp || Date.now(),
      reactions: val.reactions || {}
    });
  });
  cachedMessages = list.sort((a, b) => a.timestamp - b.timestamp);
  dbListeners.forEach((cb) => cb());
});

// Subscribe to Global Presence
onValue(ref(db, 'presence'), (snapshot) => {
  const data = snapshot.val();
  const list: UserPresence[] = [];
  if (data) {
    Object.keys(data).forEach((key) => {
      list.push(data[key]);
    });
  }
  cachedPresence = list;
  presenceListeners.forEach((cb) => cb(list));
});

export const mockDb = {
  // Subscribe to DB changes
  subscribe(callback: () => void): () => void {
    dbListeners.add(callback);
    // Trigger instantly with cached records
    callback();
    return () => {
      dbListeners.delete(callback);
    };
  },

  getStats(): Stats {
    return cachedStats;
  },

  vote(side: 'chai' | 'coffee'): void {
    const statsRef = ref(db, 'stats');
    runTransaction(statsRef, (currentStats) => {
      if (!currentStats) {
        return {
          chaiCount: side === 'chai' ? 1 : 0,
          coffeeCount: side === 'coffee' ? 1 : 0,
          lastUpdated: Date.now(),
          displayedChaiPercent: 50,
          displayedCoffeePercent: 50,
          commentaryLine: "The match is underway!"
        };
      }
      if (side === 'chai') {
        currentStats.chaiCount = (currentStats.chaiCount || 0) + 1;
      } else {
        currentStats.coffeeCount = (currentStats.coffeeCount || 0) + 1;
      }
      return currentStats;
    });
  },

  getMessages(): Message[] {
    return cachedMessages;
  },

  postMessage(side: 'chai' | 'coffee', username: string, text: string): void {
    const messagesRef = ref(db, 'chat/messages');
    const newMsgRef = push(messagesRef);
    set(newMsgRef, {
      side,
      username,
      text,
      timestamp: serverTimestamp(),
      reactions: {}
    });
  },

  reactToMessage(msgId: string, emoji: string): void {
    const reactionRef = ref(db, `chat/messages/${msgId}/reactions/${emoji}`);
    runTransaction(reactionRef, (currentCount) => {
      return (currentCount || 0) + 1;
    });
  },

  forceHourlyUpdate(): void {
    const statsRef = ref(db, 'stats');
    runTransaction(statsRef, (currentStats) => {
      if (!currentStats) return currentStats;
      const total = currentStats.chaiCount + currentStats.coffeeCount;
      let chaiP = 50;
      let coffeeP = 50;
      if (total > 0) {
        chaiP = Math.round((currentStats.chaiCount / total) * 100);
        coffeeP = 100 - chaiP;
      }
      currentStats.displayedChaiPercent = chaiP;
      currentStats.displayedCoffeePercent = coffeeP;
      currentStats.commentaryLine = getCommentary(chaiP, coffeeP);
      currentStats.lastUpdated = Date.now();
      return currentStats;
    });
  }
};

export const presenceService = {
  subscribe(callback: (users: UserPresence[]) => void): () => void {
    presenceListeners.add(callback);
    // Instant callback
    callback(cachedPresence);
    return () => {
      presenceListeners.delete(callback);
    };
  },

  join(sessionId: string, username: string, side: 'chai' | 'coffee'): void {
    const presenceRef = ref(db, `presence/${sessionId}`);
    set(presenceRef, {
      sessionId,
      username,
      side,
      lastSeen: serverTimestamp()
    });
    // Remove session node from Firebase automatically upon tab close / exit / system sleeps
    onDisconnect(presenceRef).remove();
  },

  leave(): void {
    // Explicit exit trigger
    dbListeners.forEach((cb) => cb());
  }
};
