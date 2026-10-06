import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { UserContext } from '../types/chat';

interface UserContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: UserContext;
  onSaveContext: (newContext: UserContext) => void;
}

const JOB_OPTIONS = [
  'IT / 개발 / 데이터',
  '기획 / PM / 서비스',
  '마케팅 / 홍보 / 콘텐츠',
  '디자인 / UIUX',
  '경영지원 / 인사 / 총무',
  '영업 / 영업관리',
  '공기업 / 공무원 / 공공기관',
  '금융 / 회계 / 재무',
  '연구개발 / 엔지니어',
  '자유 / 아직 탐색 중',
];

const DURATION_OPTIONS = [
  '이제 막 취업 준비 시작',
  '1~3개월 차 (서류 집중기)',
  '3~6개월 차 (면접 경험 중)',
  '6개월~1년 차 (체력 & 멘탈 저하)',
  '1년 이상 (장기 취준 & 번아웃)',
];

const MOOD_OPTIONS = [
  '서류 불합격 소식에 상처받음',
  '면접 결과 기다리며 극도로 불안함',
  '친구들과 비교되어 자책감이 듦',
  '자존감이 바닥이고 무기력함',
  '내일 면접이라 긴장감 최고조',
  '조금씩 마음을 추스르고 있음',
];

export const UserContextModal: React.FC<UserContextModalProps> = ({
  isOpen,
  onClose,
  context,
  onSaveContext,
}) => {
  const [formData, setFormData] = React.useState<UserContext>(context);

  React.useEffect(() => {
    setFormData(context);
  }, [context]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContext(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">내 취준 배경 설정</h2>
              <p className="text-xs text-stone-500">멘토들이 회원님의 상황에 꼭 맞는 위로를 건넵니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Job */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              목표 직무 / 관심 분야
            </label>
            <select
              value={formData.targetJob}
              onChange={(e) => setFormData({ ...formData, targetJob: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">선택 안 함 (자유 대화)</option>
              {JOB_OPTIONS.map((job) => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </select>
          </div>

          {/* Prep Duration */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              취업 준비 기간
            </label>
            <select
              value={formData.prepDuration}
              onChange={(e) => setFormData({ ...formData, prepDuration: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">선택 안 함</option>
              {DURATION_OPTIONS.map((dur) => (
                <option key={dur} value={dur}>
                  {dur}
                </option>
              ))}
            </select>
          </div>

          {/* Current Mood / Concern */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              현재 가장 큰 고민 / 심정
            </label>
            <div className="space-y-1.5">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = formData.currentMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setFormData({ ...formData, currentMood: isSelected ? '' : mood })}
                    className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-medium'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>{mood}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200"
            >
              저장하고 적용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
