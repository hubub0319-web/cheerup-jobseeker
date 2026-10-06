import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  initDatabase,
  getUserData,
  saveMessages,
  clearMessages,
  saveProfile,
  addAchievement,
  deleteAchievement,
  addSavedCard,
  deleteSavedCard,
  getStorageStats,
} from './server-db.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Initialize file-based backend DB
initDatabase();

const app = express();
app.use(express.json({ limit: '5mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Middleware to extract or default userId
function getUserId(req: express.Request): string {
  const headerId = req.headers['x-user-id'];
  if (typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  const bodyId = req.body?.userId;
  if (typeof bodyId === 'string' && bodyId.trim()) {
    return bodyId.trim();
  }
  return 'default_jobseeker';
}

// Master System Instruction for '마음동반자'
const MAEUM_DONGBANJA_SYSTEM_PROMPT = `당신은 취업 준비생의 지친 마음을 따뜻하게 위로하고 진심으로 격려하는 전담 AI 챗봇 '마음동반자'입니다.

[정체성 및 말투]
- 이름: 마음동반자
- 어조: 친근하고 다정하며, 마음의 온도를 높여주는 따뜻한 말투 ("~해요", "~했군요", "~토닥토닥", "~진심으로 응원해요").
- 차가운 훈계나 성의 없는 원론적 조언은 절대 하지 않으며, 늘 사용자의 편에서 경청합니다.

[핵심 역할 및 제공 콘텐츠]
1. 취업 관련 경험담:
   - 수많은 서류 탈락, 면접 실패, 공백기의 불안을 겪었지만 결국 자신만의 자리를 찾아간 선배 취준생들과 실무자들의 진솔한 극복 스토리를 들려줍니다.
2. 스트레스 해소 방법:
   - 신체적 긴장 완화법(호흡, 스트레칭), 감정 환기법(산책, 나만의 소확행), 취준생 전용 디톡스 팁을 구체적으로 알려줍니다.
3. 긍정적인 마음 유지 팁:
   - 인지 재구성(실패가 아닌 피드백), 나만의 고유한 속도 존중, 자존감을 지키는 일상 루틴을 제시합니다.

[상황별 맞춤 위로 원칙 (매우 중요)]
- **서류 탈락 시**: "이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 다음 기회는 반드시 올 거예요!"와 같이 실패를 개인의 무능으로 돌리지 않고 희망과 자존감을 북돋워 줍니다.
- **면접 실패 시**: "면접 과정에서 배운 점을 발판 삼아 더 나은 기회를 잡을 수 있을 거예요."와 같이 자책 대신 성장과 귀중한 경험의 관점으로 전환해 줍니다.
- **주변과의 비교/조급함 시**: "꽃마다 피어나는 계절이 다릅니다. 당신의 계절도 차근차근 다가오고 있어요."라며 나만의 호흡을 되찾아 줍니다.
- **무기력/번아웃 시**: "쉬어가는 것도 훌륭한 전략입니다. 오늘 하루는 아무것도 하지 않아도 당신은 충분히 소중해요."라며 온전한 쉼을 허락해 줍니다.`;

const PERSONA_STYLES: Record<string, string> = {
  companion: `[스타일 모드: 마음동반자 기본 모드]
공감, 따뜻한 위로, 취업 경험담, 스트레스 해소법, 긍정 마인드셋 팁을 균형 있게 전달합니다.`,

  story: `[스타일 모드: 마음동반자 - 경험담 멘토]
취준 선배들의 실제 극복 일화와 좌절을 딛고 일어선 생생한 경험담을 중심으로 깊은 위로와 현실적 용기를 줍니다.`,

  coach: `[스타일 모드: 마음동반자 - 성장 코치]
"면접 과정에서 배운 점을 발판 삼아 더 나은 기회를 잡을 수 있을 거예요"처럼 성장에 초점을 맞추며, 마인드셋 전환과 실천 가능한 다음 스텝을 부드럽게 짚어줍니다.`,

  healing: `[스타일 모드: 마음동반자 - 포근한 쉼터]
지친 몸과 마음을 온전히 쉴 수 있도록 귀엽고 포근한 애정 가득한 말투로 감정을 어루만져 줍니다.`,
};

// ==================== Backend Storage API Endpoints ====================

// Get all user data from backend storage
app.get('/api/user-data', (req, res) => {
  const userId = getUserId(req);
  const data = getUserData(userId);
  res.json(data);
});

// Sync/Save full messages to backend storage
app.post('/api/user-data/messages', (req, res) => {
  const userId = getUserId(req);
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 배열이 필요합니다.' });
  }
  const record = saveMessages(userId, messages);
  res.json({ success: true, count: record.messages.length });
});

// Clear messages on backend storage
app.delete('/api/user-data/messages', (req, res) => {
  const userId = getUserId(req);
  clearMessages(userId);
  res.json({ success: true });
});

// Save user context profile on backend storage
app.post('/api/user-data/profile', (req, res) => {
  const userId = getUserId(req);
  const { profile } = req.body;
  if (!profile) {
    return res.status(400).json({ error: 'profile 정보가 필요합니다.' });
  }
  const record = saveProfile(userId, profile);
  res.json({ success: true, profile: record.profile });
});

// Achievements endpoints
app.get('/api/user-data/achievements', (req, res) => {
  const userId = getUserId(req);
  const data = getUserData(userId);
  res.json(data.achievements);
});

app.post('/api/user-data/achievements', (req, res) => {
  const userId = getUserId(req);
  const { achievement } = req.body;
  if (!achievement || !achievement.text) {
    return res.status(400).json({ error: '성취 내용이 필요합니다.' });
  }
  const list = addAchievement(userId, achievement);
  res.json({ success: true, achievements: list });
});

app.delete('/api/user-data/achievements/:id', (req, res) => {
  const userId = getUserId(req);
  const id = req.params.id;
  const list = deleteAchievement(userId, id);
  res.json({ success: true, achievements: list });
});

// Saved prescription cards endpoints
app.get('/api/user-data/saved-cards', (req, res) => {
  const userId = getUserId(req);
  const data = getUserData(userId);
  res.json(data.savedCards);
});

app.post('/api/user-data/saved-cards', (req, res) => {
  const userId = getUserId(req);
  const { card } = req.body;
  if (!card || !card.title) {
    return res.status(400).json({ error: '카드 내용이 필요합니다.' });
  }
  const list = addSavedCard(userId, card);
  res.json({ success: true, savedCards: list });
});

app.delete('/api/user-data/saved-cards/:id', (req, res) => {
  const userId = getUserId(req);
  const id = req.params.id;
  const list = deleteSavedCard(userId, id);
  res.json({ success: true, savedCards: list });
});

// Backend storage status check
app.get('/api/storage-status', (_req, res) => {
  const stats = getStorageStats();
  res.json({
    status: 'connected',
    storageType: 'Server Persistent File DB',
    ...stats,
  });
});

// ==================== Chat & AI Endpoints ====================

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { messages, style = 'companion', userContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 내용이 제공되지 않았습니다.' });
    }

    const stylePrompt = PERSONA_STYLES[style] || PERSONA_STYLES.companion;
    let contextNote = '';
    if (userContext) {
      const parts = [];
      if (userContext.targetJob) parts.push(`희망 직무: ${userContext.targetJob}`);
      if (userContext.prepDuration) parts.push(`준비 기간: ${userContext.prepDuration}`);
      if (userContext.currentMood) parts.push(`현재 심정/상태: ${userContext.currentMood}`);
      if (parts.length > 0) {
        contextNote = `\n\n[사용자 취준 상황]: ${parts.join(', ')}. 이 맥락을 바탕으로 진심 어린 맞춤형 위로와 팁을 건네주세요.`;
      }
    }

    const fullInstruction = `${MAEUM_DONGBANJA_SYSTEM_PROMPT}\n\n${stylePrompt}${contextNote}`;

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction: fullInstruction,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const replyText = response.text || '마음이 많이 복잡하고 힘드셨겠어요. 마음동반자가 늘 곁에서 온 마음으로 함께할게요.';

    // Automatically persist updated conversation history to backend storage
    const allMsgs = [...messages, { id: `asst-${Date.now()}`, role: 'assistant', content: replyText, timestamp: Date.now() }];
    saveMessages(userId, allMsgs);

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: '위로의 말을 준비하는 중 잠시 문제가 생겼어요. 잠시 후 다시 말씀해 주세요.',
      details: error?.message,
    });
  }
});

// SSE Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { messages, style = 'companion', userContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 내용이 제공되지 않았습니다.' });
    }

    const stylePrompt = PERSONA_STYLES[style] || PERSONA_STYLES.companion;
    let contextNote = '';
    if (userContext) {
      const parts = [];
      if (userContext.targetJob) parts.push(`희망 직무: ${userContext.targetJob}`);
      if (userContext.prepDuration) parts.push(`준비 기간: ${userContext.prepDuration}`);
      if (userContext.currentMood) parts.push(`현재 심정/상태: ${userContext.currentMood}`);
      if (parts.length > 0) {
        contextNote = `\n\n[사용자 취준 상황]: ${parts.join(', ')}. 이 맥락을 바탕으로 진심 어린 맞춤형 위로와 팁을 건네주세요.`;
      }
    }

    const fullInstruction = `${MAEUM_DONGBANJA_SYSTEM_PROMPT}\n\n${stylePrompt}${contextNote}`;

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamResponse = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction: fullInstruction,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    let completeReply = '';
    for await (const chunk of streamResponse) {
      const text = chunk.text;
      if (text) {
        completeReply += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Persist full stream conversation to backend server
    if (completeReply.trim()) {
      const allMsgs = [...messages, { id: `asst-${Date.now()}`, role: 'assistant', content: completeReply, timestamp: Date.now() }];
      saveMessages(userId, allMsgs);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat Stream API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || '스트리밍 중 오류 발생' });
    } else {
      res.write(`data: ${JSON.stringify({ error: '답변을 불러오는 중 오류가 발생했습니다.' })}\n\n`);
      res.end();
    }
  }
});

// Situation & Emotion Analysis and Recommendation API
app.post('/api/analyze-and-recommend', async (req, res) => {
  try {
    const { situation, userInput, moodTag } = req.body || {};

    const prompt = `당신은 취준생 멘탈 케어 챗봇 '마음동반자'입니다.
사용자의 현재 상황과 입력 내용을 깊이 분석하고, 따뜻하고 구체적인 맞춤 솔루션을 추천해주세요.

[입력 정보]:
- 선택된 상황 카테고리: ${situation || '일반 고민'}
- 사용자 메시지/감정: ${userInput || moodTag || '서류 탈락 또는 취업 준비 중 오는 불안감'}

다음 원칙을 반드시 반영하세요:
1. 서류 탈락 관련일 경우: "이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 다음 기회는 반드시 올 거예요!"와 같이 개인의 가치와 결과를 명확히 분리하고 희망을 주는 메시지 작성
2. 면접 실패 관련일 경우: "면접 과정에서 배운 점을 발판 삼아 더 나은 기회를 잡을 수 있을 거예요."와 같이 자책 대신 경험과 성장에 초점을 맞춘 메시지 작성
3. 취업 관련 경험담: 선배 취준생의 실제 극복 사례를 2~3문장으로 소개
4. 스트레스 해소 방법: 오늘 바로 해볼 수 있는 구체적이고 사소한 해소법 1~2개 제시
5. 긍정적인 마음 유지 팁: 생각을 전환할 수 있는 마인드셋 팁 1개 제시

다음 JSON 형식으로만 응답하세요:
{
  "detectedEmotion": "감정 분석 요약 (예: 서류 탈락의 깊은 허탈감과 자책감)",
  "cheeringMessage": "개인화된 따뜻한 위로와 격려 메시지",
  "experienceStory": {
    "title": "선배의 경험담 제목",
    "story": "실제 취업 준비를 거친 선배의 극복 일화"
  },
  "stressRelief": {
    "title": "오늘의 스트레스 해소법",
    "action": "구체적인 실천 행동 (예: 5분 산책, 따뜻한 차, 생각 비우기 노트 등)"
  },
  "positiveMindset": {
    "title": "긍정 마음 유지 팁",
    "tip": "마인드셋 전환 한마디"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Analyze & Recommend API Error:', err);
    res.json({
      detectedEmotion: "취업 준비 과정의 불안과 자책감",
      cheeringMessage: "이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 다음 기회는 반드시 찾아올 거예요!",
      experienceStory: {
        title: "서류 48곳 탈락 후 첫 면접에서 합격한 선배의 이야기",
        story: "저도 수많은 '귀하의 우수함에도 불구하고...' 메일을 받으며 무너졌었어요. 하지만 탈락은 부족함이 아니라 단지 회사의 지금 빈자리와 타이밍이 안 맞았던 것뿐이었습니다. 지치지 않고 문을 두드렸을 때 저를 알아봐 주는 곳을 만났습니다."
      },
      stressRelief: {
        title: "취준 디톡스 30분",
        action: "오늘만큼은 채용 사이트와 스마트폰을 서랍에 넣고, 따뜻한 물로 샤워한 뒤 가장 좋아하는 음식을 나에게 선물해 주세요."
      },
      positiveMindset: {
        title: "나만의 고유한 계절",
        tip: "봄에 피는 벚꽃이 아름답듯, 가을에 피는 국화도 그 자체로 눈부십니다. 남의 속도에 조급해하지 마세요. 당신의 계절은 반드시 옵니다."
      }
    });
  }
});

// Daily fortune / comforting prescription generator
app.post('/api/fortune', async (req, res) => {
  try {
    const { targetJob, mood } = req.body || {};
    const prompt = `취업 준비로 지친 청년을 위한 '마음동반자의 오늘의 위로 처방전 카드'를 1개 작성해주세요.
${targetJob ? `희망 직무: ${targetJob}` : ''}
${mood ? `현재 상태: ${mood}` : ''}

다음 4가지를 포함하여 간결하고 따뜻하게 작성하세요:
1. title: 마음을 울리는 따뜻한 제목 (예: "이번 결과가 당신의 가치를 증명하는 것은 아닙니다")
2. message: 깊은 공감과 자존감을 북돋우는 2~3문장의 따뜻한 한마디
3. smallAction: 오늘 당장 할 수 있는 사소하지만 기분 전환되는 스트레스 해소 행동 1가지
4. cheeringWord: 짧은 한마디 응원구 (예: "면접에서 배운 점은 더 큰 기회의 발판이 될 거예요")

JSON 형식으로 응답해주세요:
{
  "title": "...",
  "message": "...",
  "smallAction": "...",
  "cheeringWord": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    res.json({
      title: "오늘 하루도 버텨낸 당신에게",
      message: "이번 결과가 당신의 가치를 증명하는 것은 아닙니다. 다음 기회는 반드시 올 거예요! 스스로를 믿어주세요.",
      smallAction: "따뜻한 물 한 잔 마시고 어깨와 목을 가볍게 스트레칭하기",
      cheeringWord: "정말 고생 많았어요, 당신은 이미 충분히 빛나는 사람입니다."
    });
  }
});

// Setup Vite or Static
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`마음동반자 (Mind Companion) server running on port ${PORT} (prod=${isProd}) with persistent DB`);
  });
}

startServer();
