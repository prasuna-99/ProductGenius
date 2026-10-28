// Backend API helper. Base = Express server (:5000).
// JWT lives in localStorage (pg_jwt). All auth-aware calls go through apiFetch.
// Login/register try the backend first and fall back to local demo accounts
// when the server (or Neon) is unreachable, so the shop never dead-ends.

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'pg_jwt';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export async function apiFetch(path: string, options: RequestInit = {}, timeoutMs = 45000) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body as any).error || `Request failed (${res.status})`);
    return body as any;
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new Error('Backend timed out (database waking up?) — saved locally.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  storeName?: string | null;
  avatar?: string | null;
}

export function isBackendError(e: unknown): boolean {
  // Network failure / DB asleep / server down -> local fallback mode
  return e instanceof TypeError || /fetch|network|Failed to fetch|Load failed/i.test((e as Error)?.message || '');
}

// Upload a photo through the backend -> permanent Cloudinary URL.
// Throws when signed out or backend unreachable (caller falls back to dataURL).
export async function uploadPhoto(
  blob: Blob,
  folder: 'products' | 'campaigns' | 'reviews',
  filename = 'photo.jpg'
): Promise<string> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');
  const form = new FormData();
  form.append('photo', blob, filename);
  form.append('folder', folder);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000); // uploads carry image bytes
  try {
    const res = await fetch(`${API_BASE}/uploads/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body as any).error || `Upload failed (${res.status})`);
    return (body as any).url as string;
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new Error('Upload timed out — kept local photo.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(',');
  const mime = (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
