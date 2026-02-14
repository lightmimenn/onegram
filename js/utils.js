export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function escapeHtml(v = '') {
  return v.replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

export function nl2br(v = '') {
  return escapeHtml(v).replace(/\n/g, '<br>');
}

export async function sha256(input) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function fileToResizedBase64(file, { maxW = 1280, maxH = 1280, mime = 'image/jpeg', quality = 0.82 } = {}) {
  const img = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = r.result;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL(mime, quality);
  return { mime, width, height, base64: dataUrl.split(',')[1] };
}

export function imageSrc(img) {
  if (!img) return '';
  return `data:${img.mime};base64,${img.base64}`;
}

export function parseKeywords(text) {
  return text.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
}

export function applyModeration(text, settings) {
  if (!settings?.keywords?.length) return { allowed: true, text };
  const hit = settings.keywords.find((k) => text.toLowerCase().includes(k.toLowerCase()));
  if (!hit) return { allowed: true, text };
  if (settings.mode === 'ban') return { allowed: false, reason: `Сообщение содержит запрещённое слово: ${hit}` };
  let out = text;
  for (const k of settings.keywords) {
    const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, '***');
  }
  return { allowed: true, text: out };
}

export function scorePost(post, currentUserId, isMember = false) {
  const ageH = (Date.now() - post.createdAt) / 3600000;
  const freshness = Math.exp(-ageH / 36) * 100;
  const likeBoost = Math.log10((post.likes?.length || 0) + 1) * 18;
  const ownPenalty = post.authorId === currentUserId ? -15 : 0;
  const memberBoost = isMember ? 10 : 0;
  return freshness + likeBoost + ownPenalty + memberBoost;
}
