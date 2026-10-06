import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ChatMessageItem } from '../types/chat';
import { PERSONAS } from '../utils/personas';
import { speakKoreanText, stopSpeaking } from '../utils/speech';

interface ChatMessageProps {
  message: ChatMessageItem;
  onOpenMentalAid?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onOpenMentalAid }) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isUser = message.role === 'user';
  const persona = message.personaId && PERSONAS[message.personaId] ? PERSONAS[message.personaId] : PERSONAS.companion;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVoice = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const started = speakKoreanText(
        message.content,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
      if (!started) {
        setIsPlayingAudio(false);
      }
    }
  };

  // Simple and clean formatting for markdown text (paragraphs, bold, quotes, bullet points)
  const renderFormattedContent = (raw: string) => {
    const paragraphs = raw.split(/\n\s*\n/);

    return paragraphs.map((para, pIdx) => {
      // Check if paragraph is a blockquote
      if (para.startsWith('>')) {
        const quoteText = para.replace(/^>\s*/gm, '');
        return (
          <blockquote
            key={pIdx}
            className="border-l-4 border-amber-300 bg-amber-50/70 pl-3 py-1.5 my-2 rounded-r-lg text-stone-700 italic text-[13px] sm:text-sm"
          >
            {quoteText}
          </blockquote>
        );
      }

      // Check if it's a bulleted list
      const lines = para.split('\n');
      const isList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '));

      if (isList) {
        return (
          <ul key={pIdx} className="list-disc list-inside space-y-1 my-2 text-stone-800 text-[13px] sm:text-sm pl-1">
            {lines.map((l, lIdx) => (
              <li key={lIdx} className="leading-relaxed">
                {formatInlineMarkdown(l.replace(/^[-*]\s+/, ''))}
              </li>
            ))}
          </ul>
        );
      }

      return (
        <p key={pIdx} className="leading-relaxed text-[13px] sm:text-sm text-stone-800 mb-2 last:mb-0">
          {lines.map((l, lIdx) => (
            <React.Fragment key={lIdx}>
              {formatInlineMarkdown(l)}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  // Parse inline bold (**bold** or *bold*)
  const formatInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-stone-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="text-amber-900 not-italic font-medium">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 my-3 group">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          {message.mood && (
            <span className="text-[11px] mb-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 border border-amber-200/60 inline-flex items-center gap-1 font-medium">
              <span>{message.mood}</span>
            </span>
          )}
          <div className="bg-stone-800 text-stone-50 px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-2xs">
            <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <span className="text-[10px] text-stone-400 mt-1 px-1">
            {formattedTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 my-4 group">
      {/* Mentor Avatar */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 border border-amber-200/80 flex items-center justify-center text-lg sm:text-xl shadow-2xs shrink-0 select-none">
        {persona.avatar}
      </div>

      <div className="flex flex-col max-w-[88%] sm:max-w-[80%] min-w-0">
        {/* Mentor identity bar */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-xs sm:text-sm text-stone-800">
            {persona.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 font-medium">
            {persona.badge}
          </span>
        </div>

        {/* Message bubble */}
        <div className="bg-white border border-stone-200/90 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow relative">
          <div className="space-y-1">
            {renderFormattedContent(message.content)}
          </div>

          {/* Quick interactive suggestion if appropriate */}
          {onOpenMentalAid && message.content.length > 80 && (
            <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                마음이 답답할 땐 잠시 쉬어가요
              </span>
              <button
                onClick={onOpenMentalAid}
                className="text-[11px] font-medium text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center gap-1"
              >
                호흡/처방전 열기 →
              </button>
            </div>
          )}
        </div>

        {/* Message utility footer */}
        <div className="flex items-center gap-3 mt-1 px-1 text-stone-400">
          <span className="text-[10px]">{formattedTime}</span>

          <div className="flex items-center gap-2 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="text-[11px] hover:text-stone-700 flex items-center gap-1 transition-colors"
              title="메시지 복사"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] text-emerald-600 font-medium">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">복사</span>
                </>
              )}
            </button>

            {/* Voice Read-out button */}
            <button
              onClick={handleToggleVoice}
              className={`text-[11px] flex items-center gap-1 transition-colors ${
                isPlayingAudio ? 'text-amber-600 font-semibold' : 'hover:text-stone-700'
              }`}
              title={isPlayingAudio ? '목소리 멈추기' : '음성으로 듣기'}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3 h-3 animate-pulse" />
                  <span className="text-[10px]">멈추기</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span className="text-[10px]">듣기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
