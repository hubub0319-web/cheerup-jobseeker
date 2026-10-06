export type PersonaId = 'companion' | 'story' | 'coach' | 'healing';

export interface PersonaInfo {
  id: PersonaId;
  name: string;
  role: string;
  tagline: string;
  avatar: string;
  badge: string;
  welcomeMessage: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  personaId?: PersonaId;
  mood?: string;
  recommendation?: EmotionAnalysisResult;
}

export interface UserContext {
  targetJob: string;
  prepDuration: string;
  currentMood: string;
}

export interface FortuneCardData {
  title: string;
  message: string;
  smallAction: string;
  cheeringWord: string;
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

export interface EmotionAnalysisResult {
  detectedEmotion: string;
  cheeringMessage: string;
  experienceStory: {
    title: string;
    story: string;
  };
  stressRelief: {
    title: string;
    action: string;
  };
  positiveMindset: {
    title: string;
    tip: string;
  };
}
