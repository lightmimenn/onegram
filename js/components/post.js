import { formatDate, nl2br } from '../utils.js';

export function postHtml(post, authorName, images = []) {
  return `<div class="post" data-id="${post.id}"><div class="post-author">${authorName}</div><div class="post-text">${nl2br(post.text || '')}</div>${images.map((s) => `<img class="post-img" src="${s}"/>`).join('')}<div class="post-meta">${formatDate(post.createdAt)} · <button class="link-btn like-post">❤ ${post.likes?.length || 0}</button></div><div class="comments"></div></div>`;
}
