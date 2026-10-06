import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, HeartHandshake, ArrowDown } from 'lucide-react';
import { Header } from './components/Header';
import { PersonaSelector } from './components/PersonaSelector';
import { ChatMessage } from './components/ChatMessage';
import { EmotionRecommendationPanel } from './components/EmotionRecommendationPanel';
import { QuickPrompts } from './components/QuickPrompts';
import { MentalAidModal } from './components/MentalAidModal';
import { UserContextModal } from './components/UserContextModal';
import { PERSONAS } from './utils/personas';
import { ChatMessageItem, PersonaId, UserContext, AchievementItem, SavedCardItem } from './types/chat';
import {
  fetchUserData,
  syncMessagesToBackend,
  clearMessagesOnBackend,
  syncProfileToBackend,
} from './utils/api';

const STORAGE_KEY_PERSONA = 'cheerup_active_persona_v2';

const MOOD_EMOJIS = [
  { label: '서류 탈락으로 우울해요', emoji: '😢' },
  { label: '면접 실패로 자책돼요', emoji: '😰' },
  { label: '지치고 무기력해요', emoji: '😵‍💫' },
  { label: '친구들과 비교돼요', emoji: '🥺' },
  { label: '조금 힘내보려 해요', emoji: '🌱' },
];

export default function App() {
  const [personaId, setPersonaId] = useState<PersonaId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERSONA);
      if (saved && PERSONAS[saved as PersonaId]) return saved as PersonaId;
    } catch {}
    return 'companion';
  });

  const [userContext, setUserContext] = useState<UserContext>({
    targetJob: '',
    prepDuration: '',
    currentMood: '',
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: PERSONAS.companion.welcomeMessage,
      timestamp: Date.now(),
      personaId: 'companion',
    },
  ]);

  const [achievements, setAchievements] = useState<AchievementItem[]>([
    { id: 'init-1', text: '취업 사이트 공고 2개 꼼꼼히 확인하고 스크랩함', date: '오늘', tag: '정보탐색' },
    { id: 'init-2', text: '햇볕 쬐며 동네 산책 15분 하고 맑은 공기 마심', date: '오늘', tag: '리프레시' },
    { id: 'init-3', text: '힘든 와중에도 따뜻한 물 챙겨 마시고 나 자신 돌봄', date: '오늘', tag: '자기돌봄' },
  ]);

  const [savedCards, setSavedCards] = useState<SavedCardItem[]>([
    {
      id: 'card-init-1',
      title: '서류 탈락 극복 처방전',
      message: '이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 다음 기회는 반드시 찾아올 거예요!',
      smallAction: '따뜻한 차 한 잔 마시며 창밖 하늘 2분 바라보기',
      cheeringWord: '너의 계절은 반드시 온다',
      savedAt: '기본 보관',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerSynced, setIsServerSynced] = useState(false);
  const [isMentalAidOpen, setIsMentalAidOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial data from backend server
  useEffect(() => {
    async function loadBackendData() {
      try {
        const data = await fetchUserData();
        if (data) {
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
          }
          if (data.profile) {
            setUserContext(data.profile);
          }
          if (Array.isArray(data.achievements)) {
            setAchievements(data.achievements);
          }
          if (Array.isArray(data.savedCards)) {
            setSavedCards(data.savedCards);
          }
          setIsServerSynced(true);
        }
      } catch (err) {
        console.warn('Backend initial fetch fallback:', err);
      }
    }
    loadBackendData();
  }, []);

  // Sync persona to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERSONA, personaId);
  }, [personaId]);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 160);
  };

  // Switch persona mode
  const handleSelectPersona = (newId: PersonaId) => {
    if (newId === personaId) return;
    setPersonaId(newId);

    const targetPersona = PERSONAS[newId];
    const greetingMsg: ChatMessageItem = {
      id: `switch-${Date.now()}`,
      role: 'assistant',
      content: targetPersona.welcomeMessage,
      timestamp: Date.now(),
      personaId: newId,
    };
    const updated = [...messages, greetingMsg];
    setMessages(updated);
    syncMessagesToBackend(updated).catch(console.error);
  };

  // Reset chat on both frontend and backend
  const handleResetChat = async () => {
    if (confirm('대화 내용을 처음으로 되돌릴까요? 백엔드 서버의 대화 기록도 함께 초기화됩니다.')) {
      const currentPersonaObj = PERSONAS[personaId];
      const initial: ChatMessageItem[] = [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: currentPersonaObj.welcomeMessage,
          timestamp: Date.now(),
          personaId: personaId,
        },
      ];
      setMessages(initial);
      try {
        await clearMessagesOnBackend();
        await syncMessagesToBackend(initial);
      } catch (e) {
        console.error('Reset error:', e);
      }
    }
  };

  // Update profile on backend
  const handleSaveProfile = async (newContext: UserContext) => {
    setUserContext(newContext);
    try {
      await syncProfileToBackend(newContext);
      setIsServerSynced(true);
    } catch (e) {
      console.error('Profile sync error:', e);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string, moodTag?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isLoading) return;

    const currentMood = moodTag || selectedMood;

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mood: currentMood,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setSelectedMood('');
    setIsLoading(true);

    const assistantMessageId = `asst-${Date.now()}`;
    const assistantPlaceholder: ChatMessageItem = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      personaId: personaId,
    };

    setMessages((prev) => [...prev, assistantPlaceholder]);

    const apiMessages = newMessages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          style: personaId,
          userContext,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('스트리밍 연결에 실패했습니다.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulatedText += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId ? { ...m, content: accumulatedText } : m
                )
              );
            }
          } catch {}
        }
      }

      if (!accumulatedText.trim()) {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            style: personaId,
            userContext,
          }),
        });
        const fallbackData = await fallbackRes.json();
        const fallbackText = fallbackData.reply || '마음동반자가 늘 곁에서 온 마음으로 함께할게요.';
        accumulatedText = fallbackText;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: fallbackText }
              : m
          )
        );
      }

      // Sync completed thread with backend
      const finalThread = [
        ...newMessages,
        {
          id: assistantMessageId,
          role: 'assistant' as const,
          content: accumulatedText,
          timestamp: Date.now(),
          personaId,
        },
      ];
      syncMessagesToBackend(finalThread).catch(console.error);
      setIsServerSynced(true);
    } catch (err: any) {
      console.error('Chat generation error:', err);
      const errorNotice =
        '죄송해요, 잠시 응답을 전해드리는 데 지연이 발생했어요. 당신이 나눠주신 귀한 마음은 잘 간직하고 있으니, 잠시 후 다시 말씀해 주시면 더 귀 기울여 들을게요. 토닥토닥 🌿';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: errorNotice }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentPersona = PERSONAS[personaId];
  const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content;

  return (
    <div className="flex flex-col h-screen bg-[#FAF7F2] text-stone-800 font-sans antialiased">
      {/* Top Header */}
      <Header
        onOpenMentalAid={() => setIsMentalAidOpen(true)}
        onOpenContextModal={() => setIsContextModalOpen(true)}
        onResetChat={handleResetChat}
        activePersonaName={currentPersona.name}
        isServerSynced={isServerSynced}
      />

      {/* Style Mode Selector */}
      <PersonaSelector
        currentPersona={personaId}
        onSelectPersona={handleSelectPersona}
        disabled={isLoading}
      />

      {/* Main Chat Scroll Area */}
      <main
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 max-w-4xl w-full mx-auto"
      >
        {/* 마음동반자 Greeting Banner */}
        <div className="bg-gradient-to-r from-amber-100/70 via-orange-50/70 to-rose-100/50 rounded-2xl p-4 sm:p-5 mb-4 border border-amber-200/70 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-2xl shrink-0">
              {currentPersona.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-sm sm:text-base">
                  {currentPersona.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-amber-800 border border-amber-200 font-semibold">
                  {currentPersona.role}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 italic truncate">
                {currentPersona.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Emotion Analysis & Situation-Specific Recommendations */}
        <EmotionRecommendationPanel
          onApplyPrompt={(text, mood) => handleSendMessage(text, mood)}
          latestUserInput={latestUserMessage}
        />

        {/* Quick Conversation Prompts */}
        <QuickPrompts
          onSelectPrompt={(text, mood) => handleSendMessage(text, mood)}
          disabled={isLoading}
        />

        {/* Message Thread */}
        <div className="space-y-1 mt-3">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onOpenMentalAid={() => setIsMentalAidOpen(true)}
            />
          ))}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 my-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-lg shadow-2xs shrink-0">
                {currentPersona.avatar}
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-2xs flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">
                  마음동반자가 정성스레 따뜻한 답글을 적고 있어요
                </span>
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-28 right-6 z-20 p-2.5 rounded-full bg-white text-stone-700 shadow-md border border-stone-200 hover:bg-stone-50 transition-all active:scale-95"
          title="최신 메시지로 스크롤"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Bottom Input Area */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-stone-200/80 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Mood Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] text-stone-400 shrink-0 font-medium flex items-center gap-1">
              <Smile className="w-3 h-3" /> 내 감정 상태:
            </span>
            {MOOD_EMOJIS.map((mood) => {
              const isSelected = selectedMood === `${mood.emoji} ${mood.label}`;
              return (
                <button
                  key={mood.label}
                  onClick={() =>
                    setSelectedMood(isSelected ? '' : `${mood.emoji} ${mood.label}`)
                  }
                  className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  <span className="mr-1">{mood.emoji}</span>
                  {mood.label}
                </button>
              );
            })}
          </div>

          {/* Text Input Row */}
          <div className="flex items-end gap-2 bg-stone-50 focus-within:bg-white rounded-2xl border border-stone-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 p-2 transition-all">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="마음동반자에게 오늘 겪은 일이나 지친 마음을 편하게 털어놓아 보세요... (Shift+Enter로 줄바꿈)"
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none p-1.5 max-h-32"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-sm transition-all active:scale-95 shrink-0 flex items-center justify-center"
              title="메시지 전송"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-3 h-3 text-rose-400" />
              이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 마음동반자가 늘 응원해요.
            </span>
            <span className="hidden sm:inline">
              백엔드 서버 실시간 영구 저장 연동
            </span>
          </div>
        </div>
      </footer>

      {/* Mental First Aid Kit Modal */}
      <MentalAidModal
        isOpen={isMentalAidOpen}
        onClose={() => setIsMentalAidOpen(false)}
        userContext={userContext}
        achievements={achievements}
        savedCards={savedCards}
        onUpdateAchievements={(items) => setAchievements(items)}
        onUpdateSavedCards={(cards) => setSavedCards(cards)}
      />

      {/* User Context & Target Modal */}
      <UserContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        context={userContext}
        onSaveContext={handleSaveProfile}
      />
    </div>
  );
}
