import { ChatMessageItem, UserContext, AchievementItem, SavedCardItem } from '../types/chat';

const USER_ID_KEY = 'cheerup_server_user_id';

export function getClientUserId(): string {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'default_jobseeker';
  }
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getClientUserId(),
  };
}

export async function fetchUserData() {
  const res = await fetch('/api/user-data', {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('백엔드 데이터 조회 실패');
  return res.json();
}

export async function syncMessagesToBackend(messages: ChatMessageItem[]) {
  const res = await fetch('/api/user-data/messages', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ messages }),
  });
  return res.json();
}

export async function clearMessagesOnBackend() {
  const res = await fetch('/api/user-data/messages', {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export async function syncProfileToBackend(profile: UserContext) {
  const res = await fetch('/api/user-data/profile', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ profile }),
  });
  return res.json();
}

export async function addAchievementToBackend(achievement: AchievementItem) {
  const res = await fetch('/api/user-data/achievements', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ achievement }),
  });
  return res.json();
}

export async function deleteAchievementFromBackend(id: string) {
  const res = await fetch(`/api/user-data/achievements/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export async function addSavedCardToBackend(card: SavedCardItem) {
  const res = await fetch('/api/user-data/saved-cards', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ card }),
  });
  return res.json();
}

export async function deleteSavedCardFromBackend(id: string) {
  const res = await fetch(`/api/user-data/saved-cards/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export async function fetchStorageStatus() {
  const res = await fetch('/api/storage-status', {
    headers: getHeaders(),
  });
  return res.json();
}
