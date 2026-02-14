import { formatDate, nl2br } from '../utils.js';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function messageHtml(m, own, images = []) {
  const reactions = Object.entries(m.reactions || {}).map(([e, ids]) => `<button class="reaction-btn" data-emoji="${e}" data-mid="${m.id}">${e} ${ids.length}</button>`).join('');
  return `<div class="msg ${own ? 'own' : ''}"><div class="msg-body">${nl2br(m.text || '')}${images.map((s) => `<img class="msg-img" src="${s}"/>`).join('')}</div><div class="msg-meta">${formatDate(m.createdAt)} <button class="link-btn emoji-toggle" data-mid="${m.id}">😊</button><span>${reactions}</span></div><div class="emoji-panel" id="emoji-${m.id}" hidden>${EMOJIS.map((e) => `<button class="emoji-choice" data-emoji="${e}" data-mid="${m.id}">${e}</button>`).join('')}</div></div>`;
}
