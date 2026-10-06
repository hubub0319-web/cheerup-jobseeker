import React from 'react';
import { Heart, Sparkles, SlidersHorizontal, RotateCcw, ShieldAlert, Cloud } from 'lucide-react';

interface HeaderProps {
  onOpenMentalAid: () => void;
  onOpenContextModal: () => void;
  onResetChat: () => void;
  activePersonaName: string;
  isServerSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMentalAid,
  onOpenContextModal,
  onResetChat,
  activePersonaName,
  isServerSynced = true,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-amber-50/80 backdrop-blur-md border-b border-amber-200/60 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-sm shadow-amber-300/50">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-stone-900 text-lg tracking-tight">
                마음동반자
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {activePersonaName}
              </span>
              {isServerSynced && (
                <span
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                  title="모든 대화 및 성취 기록이 백엔드 서버에 안전하게 자동 저장됩니다"
                >
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  서버 저장 연동됨
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              취업 준비생의 멘탈을 위로하고 격려하는 따뜻한 AI 친구
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mental Aid Modal trigger */}
          <button
            onClick={onOpenMentalAid}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 shadow-sm shadow-rose-200 transition-all active:scale-95"
            title="멘탈 응급 키트 (호흡 가이드, 오늘의 처방전, 작은 성취 일기, 서버 보관함)"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>멘탈 응급실</span>
          </button>

          {/* Context Modal trigger */}
          <button
            onClick={onOpenContextModal}
            className="p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-xl bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 shadow-2xs transition-all active:scale-95 flex items-center gap-1.5"
            title="취준 프로필 및 고민 설정 (서버에 자동 동기화)"
          >
            <SlidersHorizontal className="w-4 h-4 text-stone-500" />
            <span className="hidden md:inline">내 상황 설정</span>
          </button>

          {/* Reset Chat */}
          <button
            onClick={onResetChat}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-white rounded-xl border border-transparent hover:border-stone-200 transition-all active:scale-95"
            title="대화 새로 시작하기"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
