import { escapeHtml, formatDate } from '../utils.js';

export function dialogItemHtml(dialog, peer, lastMessage) {
  return `<a class="dialog-item" href="#/messages/${escapeHtml(peer.username)}"><div><b>${escapeHtml(peer.firstName)} ${escapeHtml(peer.lastName)}</b><div class="muted">@${escapeHtml(peer.username)}</div></div><div class="muted">${lastMessage ? formatDate(lastMessage.createdAt) : ''}</div></a>`;
}
