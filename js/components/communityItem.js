import { escapeHtml } from '../utils.js';

export function communityItemHtml(c) {
  return `<div class="community-item"><a href="#/c/${escapeHtml(c.username)}"><b>${escapeHtml(c.name)}</b></a><div class="muted">@${escapeHtml(c.username)}</div>${c.isBlocked ? '<div class="blocked">Заблокировано</div>' : ''}</div>`;
}
