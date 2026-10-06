import React from 'react';
import { PERSONAS } from '../utils/personas';
import { PersonaId } from '../types/chat';

interface PersonaSelectorProps {
  currentPersona: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  disabled?: boolean;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  currentPersona,
  onSelectPersona,
  disabled = false,
}) => {
  const personaList = Object.values(PERSONAS);

  return (
    <div className="bg-stone-50/70 border-b border-stone-200/60 px-4 py-2.5">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            마음동반자 대화 스타일 모드
          </span>
          <span className="text-[11px] text-stone-400 hidden sm:inline">
            언제든 대화 중에도 편하게 바꿀 수 있어요
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {personaList.map((p) => {
            const isSelected = currentPersona === p.id;
            const displayName = p.id === 'companion' ? '마음동반자' : p.name.replace('마음동반자', '').replace(/[()]/g, '').trim();
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
                disabled={disabled}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-white shadow-sm border-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-white/60 hover:bg-white border-stone-200/80 text-stone-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-98'}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 transition-transform ${
                    isSelected ? 'scale-105 bg-amber-50' : 'bg-stone-100'
                  }`}
                >
                  {p.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-stone-900' : 'text-stone-700'
                      }`}
                    >
                      {displayName}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                        isSelected
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    {p.role}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
