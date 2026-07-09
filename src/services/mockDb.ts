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
  commentaryIndex?: number;
  entriesCount?: number;
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
    "Nail-biter! {winner} edges ahead of {loser} by a whisker ☕",
    "It's a tight single! {winner} and {loser} are running neck and neck 🍵",
    "Super Over territory! {winner} leads, but {loser} is chasing closely!",
    "{winner} is trying to consolidate, but {loser} is bowling a tight spell 🏏",
    "A clean sweep is unlikely here, both {winner} and {loser} locking horns!"
  ],
  comfortableLead: [
    "{winner} is cruising at a healthy run rate against {loser} ☕",
    "{winner} has found its rhythm, pulling off a comfortable lead over {loser} 🍵",
    "A solid middle-overs partnership here. {winner} looking steady against {loser}.",
    "{winner} is finding the gaps nicely, building a solid boundary lead over {loser} 🏏",
    "{winner} is controlling the tempo now, dictating play against {loser}."
  ],
  blowout: [
    "{loser} has been bowled out early, {winner} declares the innings ☕😏",
    "An absolute masterclass! {winner} is hitting sixes out of the park against {loser} 🍵💥",
    "{winner} dominates the pitch completely today against {loser}!",
    "A clean innings defeat looms for {loser} if they don't step up against {winner} 🏏",
    "Total domination! {winner} is completely outclassing {loser} in this match!"
  ]
};

function getCommentary(chaiPercent: number, coffeePercent: number, index: number): string {
  const margin = Math.abs(chaiPercent - coffeePercent);
  const leadingSide = chaiPercent >= coffeePercent ? 'Chai' : 'Coffee';
  const trailingSide = leadingSide === 'Chai' ? 'Coffee' : 'Chai';
  const templates =
    margin < 10
      ? commentaryTemplates.nailBiter
      : margin <= 30
      ? commentaryTemplates.comfortableLead
      : commentaryTemplates.blowout;

  const loopIndex = (index || 0) % 5;
  const template = templates[loopIndex];
  return template.replace(/{winner}/g, leadingSide).replace(/{loser}/g, trailingSide);
}

// Caches for synchronous getters
let cachedMessages: Message[] = [];
let cachedStats: Stats = {
  chaiCount: 15,
  coffeeCount: 12,
  lastUpdated: Date.now(),
  displayedChaiPercent: 55,
  displayedCoffeePercent: 45,
  commentaryLine: "The match is underway! Chai takes an early lead ☕",
  entriesCount: 5
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
      commentaryLine: "The match is underway! Chai takes an early lead ☕",
      entriesCount: 5
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
  const list: Message[] = [];
  const welcomeReactions: Record<string, Record<string, number>> = {
    'welcome-1': { '🔥': 2 },
    'welcome-2': { '😂': 1 }
  };

  if (data) {
    Object.keys(data).forEach((key) => {
      if (key === 'welcome-1' || key === 'welcome-2') {
        if (data[key] && data[key].reactions) {
          welcomeReactions[key] = data[key].reactions;
        }
        return;
      }
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
  }

  // Prepend simulated welcome messages client-side only
  const welcomeMessages: Message[] = [
    {
      id: 'welcome-1',
      side: 'chai',
      username: 'Adrak-42',
      text: 'Welcome to Kadak Ya Cold Brew! Tap the cup to sip ☕',
      timestamp: Date.now() - 300000, // 5 min ago
      reactions: welcomeReactions['welcome-1']
    },
    {
      id: 'welcome-2',
      side: 'coffee',
      username: 'Cold-Brew-7',
      text: 'Cold Brew wins by default. Coffee lovers rise up! 🍵',
      timestamp: Date.now() - 180000, // 3 min ago
      reactions: welcomeReactions['welcome-2']
    }
  ];

  cachedMessages = [...welcomeMessages, ...list.sort((a, b) => a.timestamp - b.timestamp)];
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
          displayedChaiPercent: side === 'chai' ? 100 : 0,
          displayedCoffeePercent: side === 'coffee' ? 100 : 0,
          commentaryLine: "The match is underway! 🏏",
          commentaryIndex: 0,
          entriesCount: 1
        };
      }
      if (side === 'chai') {
        currentStats.chaiCount = (currentStats.chaiCount || 0) + 1;
      } else {
        currentStats.coffeeCount = (currentStats.coffeeCount || 0) + 1;
      }
      
      currentStats.entriesCount = (currentStats.entriesCount || 0) + 1;

      const total = currentStats.chaiCount + currentStats.coffeeCount;
      if (total > 0) {
        currentStats.displayedChaiPercent = Math.round((currentStats.chaiCount / total) * 100);
        currentStats.displayedCoffeePercent = 100 - currentStats.displayedChaiPercent;
      }
      
      return currentStats;
    });
  },

  registerSip(side: 'chai' | 'coffee'): void {
    const statsRef = ref(db, 'stats');
    runTransaction(statsRef, (currentStats) => {
      if (!currentStats) return currentStats;
      if (side === 'chai') {
        currentStats.chaiCount = (currentStats.chaiCount || 0) + 1;
      } else {
        currentStats.coffeeCount = (currentStats.coffeeCount || 0) + 1;
      }
      
      const total = currentStats.chaiCount + currentStats.coffeeCount;
      if (total > 0) {
        const chaiP = Math.round((currentStats.chaiCount / total) * 100);
        const coffeeP = 100 - chaiP;
        currentStats.displayedChaiPercent = chaiP;
        currentStats.displayedCoffeePercent = coffeeP;
        
        // Loop sequential index from 0 to 4
        const nextIndex = ((currentStats.commentaryIndex || 0) + 1) % 5;
        currentStats.commentaryIndex = nextIndex;
        currentStats.commentaryLine = getCommentary(chaiP, coffeeP, nextIndex);
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
      currentStats.commentaryIndex = 0;
      currentStats.commentaryLine = getCommentary(chaiP, coffeeP, 0);
      currentStats.lastUpdated = Date.now();
      // Reset hourly sip entries & session counts back to zero for the next round
      currentStats.chaiCount = 0;
      currentStats.coffeeCount = 0;
      currentStats.entriesCount = 0;
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
