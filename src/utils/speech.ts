// Web Speech API text-to-speech utility for Korean voice support

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakKoreanText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  // Strip markdown formatting symbols for smooth natural speech
  const cleanedText = text
    .replace(/[#*_~`>-]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\n+/g, '. ')
    .trim();

  if (!cleanedText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.95; // slightly calm and warm pacing
  utterance.pitch = 1.0;

  // Attempt to select a natural Korean voice if available
  const voices = window.speechSynthesis.getVoices();
  const koVoice = voices.find((v) => v.lang.startsWith('ko') || v.lang.includes('KR'));
  if (koVoice) {
    utterance.voice = koVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    activeUtterance = null;
    onEnd?.();
  };

  utterance.onerror = () => {
    activeUtterance = null;
    onError?.();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
