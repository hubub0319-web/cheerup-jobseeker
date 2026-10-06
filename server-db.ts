import fs from 'fs';
import path from 'path';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  personaId?: string;
  mood?: string;
}

export interface UserContext {
  targetJob: string;
  prepDuration: string;
  currentMood: string;
}

export interface AchievementItem {
  id: string;
  text: string;
  date: string;
  tag: string;
}

export interface SavedCardItem {
  id: string;
  title: string;
  message: string;
  smallAction?: string;
  cheeringWord?: string;
  savedAt: string;
}

export interface UserDataRecord {
  userId: string;
  profile: UserContext;
  messages: ChatMessageItem[];
  achievements: AchievementItem[];
  savedCards: SavedCardItem[];
  updatedAt: number;
}

interface DatabaseSchema {
  users: Record<string, UserDataRecord>;
  meta: {
    version: number;
    lastSaved: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'cheerup_db.json');

// In-memory cache
let dbCache: DatabaseSchema = {
  users: {},
  meta: {
    version: 1,
    lastSaved: Date.now(),
  },
};

// Initialize DB file
export function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
    } else {
      flushToDisk();
    }
  } catch (err) {
    console.error('Failed to initialize database file:', err);
  }
}

function flushToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbCache.meta.lastSaved = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to flush database to disk:', err);
  }
}

function getOrCreateUser(userId: string): UserDataRecord {
  if (!dbCache.users[userId]) {
    dbCache.users[userId] = {
      userId,
      profile: {
        targetJob: '',
        prepDuration: '',
        currentMood: '',
      },
      messages: [],
      achievements: [
        { id: 'init-1', text: '취업 사이트 공고 2개 꼼꼼히 확인하고 스크랩함', date: '오늘', tag: '정보탐색' },
        { id: 'init-2', text: '햇볕 쬐며 동네 산책 15분 하고 맑은 공기 마심', date: '오늘', tag: '리프레시' },
        { id: 'init-3', text: '힘든 와중에도 따뜻한 물 챙겨 마시고 나 자신 돌봄', date: '오늘', tag: '자기돌봄' },
      ],
      savedCards: [
        {
          id: 'card-init-1',
          title: '서류 탈락 극복 처방전',
          message: '이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 다음 기회는 반드시 찾아올 거예요!',
          smallAction: '따뜻한 차 한 잔 마시며 창밖 하늘 2분 바라보기',
          cheeringWord: '너의 계절은 반드시 온다',
          savedAt: '기본 보관',
        },
      ],
      updatedAt: Date.now(),
    };
    flushToDisk();
  }
  return dbCache.users[userId];
}

export function getUserData(userId: string): UserDataRecord {
  return getOrCreateUser(userId);
}

export function saveMessages(userId: string, messages: ChatMessageItem[]): UserDataRecord {
  const user = getOrCreateUser(userId);
  user.messages = messages;
  user.updatedAt = Date.now();
  flushToDisk();
  return user;
}

export function appendMessage(userId: string, message: ChatMessageItem): UserDataRecord {
  const user = getOrCreateUser(userId);
  user.messages.push(message);
  user.updatedAt = Date.now();
  flushToDisk();
  return user;
}

export function clearMessages(userId: string): UserDataRecord {
  const user = getOrCreateUser(userId);
  user.messages = [];
  user.updatedAt = Date.now();
  flushToDisk();
  return user;
}

export function saveProfile(userId: string, profile: UserContext): UserDataRecord {
  const user = getOrCreateUser(userId);
  user.profile = profile;
  user.updatedAt = Date.now();
  flushToDisk();
  return user;
}

export function addAchievement(userId: string, achievement: AchievementItem): AchievementItem[] {
  const user = getOrCreateUser(userId);
  user.achievements.unshift(achievement);
  user.updatedAt = Date.now();
  flushToDisk();
  return user.achievements;
}

export function deleteAchievement(userId: string, id: string): AchievementItem[] {
  const user = getOrCreateUser(userId);
  user.achievements = user.achievements.filter((a) => a.id !== id);
  user.updatedAt = Date.now();
  flushToDisk();
  return user.achievements;
}

export function addSavedCard(userId: string, card: SavedCardItem): SavedCardItem[] {
  const user = getOrCreateUser(userId);
  // Avoid duplicates
  if (!user.savedCards.some((c) => c.title === card.title && c.message === card.message)) {
    user.savedCards.unshift(card);
    user.updatedAt = Date.now();
    flushToDisk();
  }
  return user.savedCards;
}

export function deleteSavedCard(userId: string, id: string): SavedCardItem[] {
  const user = getOrCreateUser(userId);
  user.savedCards = user.savedCards.filter((c) => c.id !== id);
  user.updatedAt = Date.now();
  flushToDisk();
  return user.savedCards;
}

export function getStorageStats() {
  const userCount = Object.keys(dbCache.users).length;
  let totalMessages = 0;
  let totalAchievements = 0;
  let totalSavedCards = 0;

  for (const u of Object.values(dbCache.users)) {
    totalMessages += u.messages.length;
    totalAchievements += u.achievements.length;
    totalSavedCards += u.savedCards.length;
  }

  return {
    userCount,
    totalMessages,
    totalAchievements,
    totalSavedCards,
    lastSaved: dbCache.meta.lastSaved,
  };
}
