import React, { useState, useEffect } from 'react';
import { X, Wind, Sparkles, Shield, BookmarkCheck, Play, Pause, RotateCcw, Plus, Trash2, Heart, Bookmark, CloudCheck, Check } from 'lucide-react';
import { FortuneCardData, AchievementItem, UserContext, SavedCardItem } from '../types/chat';
import { addAchievementToBackend, deleteAchievementFromBackend, addSavedCardToBackend, deleteSavedCardFromBackend } from '../utils/api';

interface MentalAidModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: UserContext;
  achievements: AchievementItem[];
  savedCards: SavedCardItem[];
  onUpdateAchievements: (items: AchievementItem[]) => void;
  onUpdateSavedCards: (cards: SavedCardItem[]) => void;
}

export const MentalAidModal: React.FC<MentalAidModalProps> = ({
  isOpen,
  onClose,
  userContext,
  achievements,
  savedCards,
  onUpdateAchievements,
  onUpdateSavedCards,
}) => {
  const [activeTab, setActiveTab] = useState<'breathe' | 'fortune' | 'shield' | 'journal' | 'savedCards'>('breathe');

  // Breathing state: 4-7-8 technique
  const [breatheStage, setBreatheStage] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [timerCount, setTimerCount] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  // Fortune state
  const [fortuneData, setFortuneData] = useState<FortuneCardData | null>(null);
  const [isFortuneLoading, setIsFortuneLoading] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);

  // Journal form state
  const [newAchievement, setNewAchievement] = useState('');
  const [selectedTag, setSelectedTag] = useState('자기돌봄');

  // Breathing interval effect
  useEffect(() => {
    if (breatheStage === 'idle') return;

    const interval = setInterval(() => {
      setTimerCount((prev) => {
        if (prev > 1) return prev - 1;

        if (breatheStage === 'inhale') {
          setBreatheStage('hold');
          return 7;
        } else if (breatheStage === 'hold') {
          setBreatheStage('exhale');
          return 8;
        } else if (breatheStage === 'exhale') {
          setCycleCount((c) => c + 1);
          setBreatheStage('inhale');
          return 4;
        }
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breatheStage]);

  const startBreathing = () => {
    setBreatheStage('inhale');
    setTimerCount(4);
  };

  const stopBreathing = () => {
    setBreatheStage('idle');
    setTimerCount(4);
  };

  const fetchFortuneCard = async () => {
    setIsFortuneLoading(true);
    setIsCardSaved(false);
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJob: userContext.targetJob,
          mood: userContext.currentMood,
        }),
      });
      const data = await res.json();
      setFortuneData(data);
    } catch {
      setFortuneData({
        title: '오늘도 충분히 애쓴 당신에게',
        message: '이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 꽃마다 피어나는 계절이 다를 뿐, 당신이라는 꽃도 가장 눈부신 순간에 피어날 거예요.',
        smallAction: '따뜻한 차 한 잔 마시며 창밖 하늘 2분 바라보기',
        cheeringWord: '정말 고생 많았어요. 당신은 그 자체로 소중합니다.',
      });
    } finally {
      setIsFortuneLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'fortune' && !fortuneData) {
      fetchFortuneCard();
    }
  }, [isOpen, activeTab]);

  // Save current fortune card to backend storage
  const handleSaveCardToBackend = async () => {
    if (!fortuneData) return;
    const card: SavedCardItem = {
      id: `card-${Date.now()}`,
      title: fortuneData.title,
      message: fortuneData.message,
      smallAction: fortuneData.smallAction,
      cheeringWord: fortuneData.cheeringWord,
      savedAt: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    };

    try {
      const res = await addSavedCardToBackend(card);
      if (res.savedCards) {
        onUpdateSavedCards(res.savedCards);
      }
      setIsCardSaved(true);
    } catch (err) {
      console.error('Failed to save card:', err);
    }
  };

  // Add achievement to backend
  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchievement.trim()) return;

    const item: AchievementItem = {
      id: Date.now().toString(),
      text: newAchievement.trim(),
      date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      tag: selectedTag,
    };

    try {
      const res = await addAchievementToBackend(item);
      if (res.achievements) {
        onUpdateAchievements(res.achievements);
      }
      setNewAchievement('');
    } catch (err) {
      console.error('Failed to add achievement:', err);
    }
  };

  // Delete achievement on backend
  const handleDeleteAchievement = async (id: string) => {
    try {
      const res = await deleteAchievementFromBackend(id);
      if (res.achievements) {
        onUpdateAchievements(res.achievements);
      }
    } catch (err) {
      console.error('Failed to delete achievement:', err);
    }
  };

  // Delete saved card on backend
  const handleDeleteSavedCard = async (id: string) => {
    try {
      const res = await deleteSavedCardFromBackend(id);
      if (res.savedCards) {
        onUpdateSavedCards(res.savedCards);
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-stone-900 text-base">취준 멘탈 응급실</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium inline-flex items-center gap-0.5 border border-emerald-200">
                  <CloudCheck className="w-3 h-3 text-emerald-600" />
                  서버 저장 연동
                </span>
              </div>
              <p className="text-xs text-stone-500">긴장 완화와 자존감 회복을 위한 백엔드 보관소</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 px-2 bg-stone-50/70 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('breathe')}
            className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'breathe'
                ? 'border-amber-500 text-amber-800 bg-white/60'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Wind className="w-4 h-4 text-sky-500" />
            <span>4-7-8 안도 호흡</span>
          </button>

          <button
            onClick={() => setActiveTab('fortune')}
            className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'fortune'
                ? 'border-amber-500 text-amber-800 bg-white/60'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>위로 처방전</span>
          </button>

          <button
            onClick={() => setActiveTab('shield')}
            className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'shield'
                ? 'border-amber-500 text-amber-800 bg-white/60'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>탈락 극복 수칙</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'journal'
                ? 'border-amber-500 text-amber-800 bg-white/60'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-violet-500" />
            <span>작은 성취 일기 ({achievements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('savedCards')}
            className={`flex items-center gap-1.5 py-3 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'savedCards'
                ? 'border-amber-500 text-amber-800 bg-white/60'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Bookmark className="w-4 h-4 text-rose-500" />
            <span>내 보관함 ({savedCards.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: 4-7-8 Breathing */}
          {activeTab === 'breathe' && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="max-w-xs">
                <h3 className="font-bold text-stone-800 text-sm">
                  면접 전 불안과 긴장을 녹이는 4-7-8 호흡법
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  부교감신경을 자극해 심박수를 낮추고 뇌에 산소를 공급합니다.
                </p>
              </div>

              {/* Visual Breathing Circle */}
              <div className="relative w-44 h-44 my-4 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                    breatheStage === 'inhale'
                      ? 'scale-110 bg-sky-200/60 ring-8 ring-sky-300/30'
                      : breatheStage === 'hold'
                      ? 'scale-105 bg-amber-200/60 ring-8 ring-amber-300/30'
                      : breatheStage === 'exhale'
                      ? 'scale-90 bg-emerald-200/60 ring-4 ring-emerald-300/20'
                      : 'scale-95 bg-stone-100 ring-2 ring-stone-200'
                  }`}
                />

                <div className="relative z-10 w-32 h-32 rounded-full bg-white shadow-md flex flex-col items-center justify-center border border-stone-200">
                  {breatheStage === 'idle' ? (
                    <span className="text-xs font-semibold text-stone-500">
                      준비되셨나요?
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-stone-800">
                        {timerCount}
                      </span>
                      <span className="text-xs font-bold text-stone-600 mt-0.5">
                        {breatheStage === 'inhale' && '들이쉬기 (코로)'}
                        {breatheStage === 'hold' && '숨 멈추기'}
                        {breatheStage === 'exhale' && '내쉬기 (입으로)'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {breatheStage === 'idle' ? (
                  <button
                    onClick={startBreathing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-md shadow-amber-300/40 transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>호흡 시작하기</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopBreathing}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      <span>일시정지</span>
                    </button>
                    <span className="text-xs text-stone-500">
                      완료한 세클: <strong>{cycleCount}회</strong>
                    </span>
                  </>
                )}
              </div>

              <div className="bg-sky-50 text-sky-900 text-xs p-3 rounded-2xl border border-sky-100 text-left max-w-sm mt-2">
                💡 <strong>팁:</strong> 면접 대기실에서 의자에 깊숙이 앉아 3~4번만 반복해도 요동치던 심장이 거짓말처럼 차분해집니다.
              </div>
            </div>
          )}

          {/* TAB 2: Today's Prescription Fortune */}
          {activeTab === 'fortune' && (
            <div className="space-y-4 py-1">
              <div className="text-center">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  💌 마음동반자의 맞춤 위로 처방전
                </span>
              </div>

              {isFortuneLoading ? (
                <div className="p-8 text-center text-stone-500 text-xs flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>오늘의 따뜻한 위로를 정성껏 빚는 중입니다...</span>
                </div>
              ) : fortuneData ? (
                <div className="bg-gradient-to-b from-amber-50/70 to-orange-50/50 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3.5">
                  <h4 className="font-bold text-stone-900 text-base flex items-center gap-1.5">
                    <span>🥠</span> {fortuneData.title}
                  </h4>

                  <p className="text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-stone-200/60">
                    {fortuneData.message}
                  </p>

                  <div className="bg-white p-3 rounded-xl border border-amber-100 space-y-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      🌱 오늘 하루를 위한 소소한 행동 미션
                    </span>
                    <p className="text-xs text-stone-800 font-medium">
                      {fortuneData.smallAction}
                    </p>
                  </div>

                  <div className="text-center pt-1 border-t border-amber-100 flex items-center justify-between">
                    <span className="text-xs text-rose-600 font-bold">
                      “{fortuneData.cheeringWord}”
                    </span>
                    <button
                      onClick={handleSaveCardToBackend}
                      disabled={isCardSaved}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                        isCardSaved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                      }`}
                    >
                      {isCardSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>서버 보관함 저장됨</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                          <span>보관함에 저장</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-center pt-2">
                <button
                  onClick={fetchFortuneCard}
                  disabled={isFortuneLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>새로운 위로 처방 받기</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Rejection Recovery Guide */}
          {activeTab === 'shield' && (
            <div className="space-y-3.5 py-1 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80">
                <h4 className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                  <span>1.</span> 이번 결과가 당신의 가치를 증명하는 것은 아닙니다
                </h4>
                <p className="text-rose-800/90 text-xs leading-relaxed">
                  채용은 100점을 뽑는 시험이 아니라, 팀의 기존 빈자리 퍼즐 조각을 찾는 과정입니다. 당신이 부족해서가 아니라, 그 회사가 찾던 특정한 퍼즐 모양과 지금 타이밍이 달랐을 뿐입니다.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <span>2.</span> 면접 과정에서 배운 점은 더 큰 기회의 발판이 됩니다
                </h4>
                <p className="text-amber-800/90 text-xs leading-relaxed">
                  면접에서 버벅거렸거나 아쉬움이 남았더라도 자책하지 마세요. 그 경험 자체가 면접관의 의도를 파악하고 나만의 화법을 다듬는 가장 귀중한 실전 수업이었습니다.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <span>3.</span> 불합격 당일에는 온전한 회복을 선물하세요
                </h4>
                <p className="text-emerald-800/90 text-xs leading-relaxed">
                  서탈/면탈 소식을 들은 날에는 무리해서 다음 자소서를 쓰지 마세요. 그날은 온전히 나를 위한 '상처 회복일'로 삼고, 맛있는 식사와 좋아하는 음악, 따뜻한 샤워로 몸과 마음을 보호하세요.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Small Wins Journal (Connected to Backend) */}
          {activeTab === 'journal' && (
            <div className="space-y-4 py-1">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-stone-600">
                    사소한 행동도 모두 대단한 성취입니다. 백엔드 서버에 영구 보존돼요!
                  </p>
                </div>
                <form onSubmit={handleAddAchievement} className="space-y-2">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="예: 자소서 1문항 초안 완성함, 산책 15분 함..."
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {['자기돌봄', '정보탐색', '서류작성', '마인드케어'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                            selectedTag === tag
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-white text-stone-500 border-stone-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={!newAchievement.trim()}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>서버에 저장</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Achievements list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {achievements.length === 0 ? (
                  <p className="text-center text-xs text-stone-400 py-4">
                    아직 기록된 성취가 없어요. 사소한 것도 좋으니 적어보세요!
                  </p>
                ) : (
                  achievements.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                            {item.tag}
                          </span>
                          <span className="text-[10px] text-stone-400">{item.date}</span>
                        </div>
                        <p className="text-xs text-stone-800 leading-snug break-words">
                          {item.text}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAchievement(item.id)}
                        className="text-stone-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Saved Cards Collection */}
          {activeTab === 'savedCards' && (
            <div className="space-y-3 py-1">
              <p className="text-xs text-stone-500">
                마음에 들었던 위로 처방전 카드를 백엔드 서버에 영구 보관해 두고 언제든 꺼내볼 수 있습니다.
              </p>

              {savedCards.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                  아직 보관된 위로 카드가 없습니다. '위로 처방전' 탭에서 카드를 보관해 보세요!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {savedCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 shadow-2xs relative group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-xs text-stone-900">{card.title}</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400">{card.savedAt}</span>
                          <button
                            onClick={() => handleDeleteSavedCard(card.id)}
                            className="text-stone-300 hover:text-rose-500 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed mb-2 whitespace-pre-wrap">
                        {card.message}
                      </p>
                      {card.cheeringWord && (
                        <span className="text-[11px] font-bold text-amber-900">
                          “{card.cheeringWord}”
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
