import React from 'react';
import { MailX, UserCheck, BookOpen, Coffee, Lightbulb, Users } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string, moodTag: string) => void;
  disabled?: boolean;
}

export const QUICK_PROMPTS = [
  {
    icon: MailX,
    label: '서류 탈락 (서탈)으로 상처받았어요',
    text: '방금 또 서류 탈락 통보를 받았어요. 열심히 쓴 자소서인데 한 줄로 거절당하니 제 가치가 부정당한 기분이에요. 마음동반자님, 위로와 희망이 필요해요...',
    mood: '😢 서류 탈락 상처',
  },
  {
    icon: UserCheck,
    label: '면접 실패 후 자책감이 커요',
    text: '오늘 면접에서 질문에 제대로 대답을 못 하고 완전히 망친 것 같아요. 너무 후회되고 자책하느라 눈물이 나요. 이 실패를 어떻게 성장의 발판으로 삼을 수 있을까요?',
    mood: '😰 면접 실패 자책',
  },
  {
    icon: BookOpen,
    label: '취업 선배들의 극복 경험담 들려줘',
    text: '수많은 불합격과 공백기를 겪었지만 포기하지 않고 결국 합격한 선배 취준생들의 진솔한 극복 경험담을 들려주세요. 다시 일어설 용기를 얻고 싶어요.',
    mood: '📖 선배 경험담 요청',
  },
  {
    icon: Coffee,
    label: '오늘 당장 할 스트레스 해소법 알려줘',
    text: '취준 스트레스와 압박감 때문에 가슴이 답답하고 두통까지 와요. 오늘 방 안에서 당장 실천할 수 있는 효과적인 스트레스 해소 방법을 알려주세요.',
    mood: '🌿 스트레스 해소 필요',
  },
  {
    icon: Lightbulb,
    label: '긍정적인 마음 유지하는 팁 알려줘',
    text: '계속되는 불합격 속에서도 자존감을 잃지 않고 긍정적인 마인드셋을 유지하는 구체적인 실천 팁을 알려주세요.',
    mood: '💡 긍정 마인드셋 팁',
  },
  {
    icon: Users,
    label: '친구들 취업 소식에 나만 뒤처진 기분',
    text: '주변 동기들과 친구들은 취업해서 사회로 나가는데, 저만 제자리걸음인 것 같아 조급하고 초라해 보여요. 나만의 속도를 지킬 수 있도록 도와주세요.',
    mood: '🥺 주변 비교와 조급함',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, disabled }) => {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2 text-stone-500 text-xs">
        <span className="font-medium text-stone-600">마음동반자에게 자주 털어놓는 고민과 요청:</span>
        <span className="text-[11px] text-stone-400 hidden sm:inline">원하는 주제를 누르면 바로 대화가 시작돼요</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {QUICK_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.text, item.mood)}
              disabled={disabled}
              className="flex items-center gap-2.5 p-2.5 rounded-xl text-left bg-white/85 hover:bg-white border border-stone-200/80 hover:border-amber-300 text-stone-700 hover:text-stone-900 transition-all shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-50 group-hover:bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold truncate flex-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
