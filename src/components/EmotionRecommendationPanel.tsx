import React, { useState } from 'react';
import { Sparkles, FileText, UserX, Users, BatteryCharging, Heart, BookOpen, Coffee, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { EmotionAnalysisResult } from '../types/chat';

interface EmotionRecommendationPanelProps {
  onApplyPrompt: (messageText: string, moodTag: string) => void;
  latestUserInput?: string;
}

const PRESET_SITUATIONS = [
  {
    id: 'document',
    title: '서류 탈락 (서탈)',
    icon: FileText,
    badge: '희망 중심 위로',
    desc: '이번 결과가 당신의 가치를 증명하는 것은 아닙니다',
    coreMessage: '이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 다음 기회는 반드시 올 거예요!',
    promptText: '방금 또 서류 탈락 메일을 받았어요. 열심히 준비했는데 한 줄로 거절당하니까 너무 비참하고 자책하게 돼요. 마음을 어떻게 추슬러야 할까요?',
    moodTag: '😢 서류 탈락 상처',
  },
  {
    id: 'interview',
    title: '면접 실패 (면탈)',
    icon: UserX,
    badge: '성장 중심 위로',
    desc: '면접에서 배운 점을 발판 삼아 더 나은 기회를',
    coreMessage: '면접 과정에서 배운 점을 발판 삼아 더 나은 기회를 잡을 수 있을 거예요.',
    promptText: '오늘 면접에서 질문에 제대로 대답을 못 하고 버벅거렸어요. 너무 후회되고 자책하느라 눈물이 멈추지 않아요. 면접 실패를 딛고 일어설 용기를 얻고 싶어요.',
    moodTag: '😰 면접 실패 자책',
  },
  {
    id: 'comparison',
    title: '친구들 취업 & 조급함',
    icon: Users,
    badge: '고유한 속도 존중',
    desc: '꽃마다 피어나는 계절이 다릅니다',
    coreMessage: '꽃마다 피어나는 계절이 다릅니다. 당신의 계절도 차근차근 다가오고 있어요.',
    promptText: '주변 동기들과 친구들은 취업해서 출근하는데, 저만 제자리걸음인 것 같아 조급하고 초라해 보여요. 온전히 나만의 속도를 지키고 싶어요.',
    moodTag: '🥺 주변 비교와 조급함',
  },
  {
    id: 'burnout',
    title: '무기력 & 번아웃',
    icon: BatteryCharging,
    badge: '온전한 쉼과 회복',
    desc: '쉬어가는 것도 훌륭한 전략입니다',
    coreMessage: '쉬어가는 것도 훌륭한 전략입니다. 아무것도 하지 않아도 당신은 충분히 가치 있는 사람이에요.',
    promptText: '취준 기간이 길어지면서 온몸에 힘이 빠지고 아무것도 하기 싫은 번아웃이 왔어요. 그냥 다 포기하고 싶은데 어떻게 해야 할까요?',
    moodTag: '🌧️ 무기력과 번아웃',
  },
];

export const EmotionRecommendationPanel: React.FC<EmotionRecommendationPanelProps> = ({
  onApplyPrompt,
  latestUserInput,
}) => {
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<EmotionAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectSituation = async (sit: typeof PRESET_SITUATIONS[0]) => {
    setSelectedSituation(sit.id);
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-and-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: sit.title,
          userInput: sit.promptText,
          moodTag: sit.moodTag,
        }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch {
      // Fallback
      setAnalysisResult({
        detectedEmotion: `${sit.title}로 인한 불안과 상처`,
        cheeringMessage: sit.coreMessage,
        experienceStory: {
          title: '수많은 탈락을 딛고 첫 합격을 거머쥔 선배의 이야기',
          story: '저 역시 수십 통의 불합격 통보를 받았습니다. 그러나 불합격은 제 능력이 모자라서가 아니라 단지 회사의 지금 빈자리와 타이밍이 안 맞았던 것뿐이었습니다. 당신을 온전히 알아봐 주는 회사는 반드시 나타납니다.',
        },
        stressRelief: {
          title: '취준 스트레스 릴리즈 미션',
          action: '오늘은 자책하는 생각을 멈추고, 따뜻한 온수 샤워 후 좋아하는 음악을 들으며 온전히 나를 쉬게 해주세요.',
        },
        positiveMindset: {
          title: '단단한 자존감 지키기',
          tip: '결과는 회사의 선택이지만, 여기까지 포기하지 않고 노력해온 과정은 그 누구도 빼앗을 수 없는 당신만의 위대한 자산입니다.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeLatestInput = async () => {
    if (!latestUserInput?.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-and-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: '사용자 작성 고민',
          userInput: latestUserInput,
        }),
      });
      const data = await res.json();
      setAnalysisResult(data);
      setSelectedSituation('custom');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-amber-200/80 p-3.5 sm:p-4 mb-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs sm:text-sm font-bold text-stone-900">
            상황별 맞춤 위로 & 감정 분석 추천
          </h3>
        </div>
        {latestUserInput && (
          <button
            onClick={handleAnalyzeLatestInput}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium transition-colors flex items-center gap-1"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            내 입력 분석하기
          </button>
        )}
      </div>

      {/* Preset situation buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {PRESET_SITUATIONS.map((sit) => {
          const Icon = sit.icon;
          const isSelected = selectedSituation === sit.id;
          return (
            <button
              key={sit.id}
              onClick={() => handleSelectSituation(sit)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white hover:bg-stone-50 border-stone-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-stone-500'}`} />
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-stone-100 text-stone-600">
                  {sit.badge}
                </span>
              </div>
              <h4 className="text-xs font-bold text-stone-800">{sit.title}</h4>
              <p className="text-[10px] text-stone-500 truncate mt-0.5">{sit.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-4 text-center text-xs text-stone-500 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>마음동반자가 상황에 맞춘 따뜻한 위로와 경험담을 준비하고 있어요...</span>
        </div>
      )}

      {/* Structured Recommendation Result Card */}
      {analysisResult && !isLoading && (
        <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-stone-50 rounded-xl p-3.5 sm:p-4 border border-amber-200/90 shadow-2xs space-y-3 animate-in fade-in duration-200">
          {/* Header & Core Message */}
          <div className="border-b border-amber-200/60 pb-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 mb-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>진단된 감정: {analysisResult.detectedEmotion}</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-stone-900 leading-snug">
              “{analysisResult.cheeringMessage}”
            </p>
          </div>

          {/* 3 Pillars: 경험담 / 스트레스 해소 / 긍정 팁 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Experience Story */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>선배 취준 경험담</span>
              </div>
              <h5 className="font-semibold text-stone-800 text-[11px]">
                {analysisResult.experienceStory.title}
              </h5>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {analysisResult.experienceStory.story}
              </p>
            </div>

            {/* Stress Relief */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                <span>스트레스 해소 방법</span>
              </div>
              <h5 className="font-semibold text-stone-800 text-[11px]">
                {analysisResult.stressRelief.title}
              </h5>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {analysisResult.stressRelief.action}
              </p>
            </div>

            {/* Positive Mindset */}
            <div className="bg-white p-3 rounded-lg border border-stone-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-sky-800">
                <Lightbulb className="w-3.5 h-3.5 text-sky-600" />
                <span>긍정 마음 유지 팁</span>
              </div>
              <h5 className="font-semibold text-stone-800 text-[11px]">
                {analysisResult.positiveMindset.title}
              </h5>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {analysisResult.positiveMindset.tip}
              </p>
            </div>
          </div>

          {/* Action Button: Chat with 마음동반자 */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                const prompt = selectedSituation
                  ? PRESET_SITUATIONS.find((s) => s.id === selectedSituation)?.promptText || analysisResult.cheeringMessage
                  : analysisResult.cheeringMessage;
                const mood = selectedSituation
                  ? PRESET_SITUATIONS.find((s) => s.id === selectedSituation)?.moodTag || '마음동반자 위로'
                  : '마음동반자 위로';
                onApplyPrompt(prompt, mood);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <span>이 내용으로 마음동반자와 깊이 대화하기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
