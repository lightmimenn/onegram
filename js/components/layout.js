import { clearSession, currentUser, getCommunities, getCommunityMembers } from '../store.js';
import { escapeHtml } from '../utils.js';

export async function renderLayout(contentHtml, { title = 'Onegram', showShell = true } = {}) {
  const app = document.getElementById('app');
  const user = await currentUser();
  if (!showShell) {
    app.innerHTML = `<div class="page-wrap"><div class="landing-box">${contentHtml}</div></div>`;
    bindGlobal();
    return;
  }

  const communities = user ? await sideCommunities(user.id) : '';
  app.innerHTML = `
    <div class="topbar"><div class="center"><a class="logo" href="#/feed">Onegram</a><div class="top-links">${user ? `<a href="#/id/${escapeHtml(user.username)}">${escapeHtml(user.firstName)}</a><a id="logoutBtn" href="#/">Выйти</a>` : '<a href="#/login">Войти</a>'}</div></div></div>
    <div class="page-wrap center">
      <div class="left-menu">
        <a href="#/feed">Моя Страница</a>
        <a href="#/messages">Сообщения</a>
        <a href="#/communities">Сообщества</a>
        <a href="#/admin">Админ</a>
        ${communities}
      </div>
      <div class="main-col"><h1>${title}</h1>${contentHtml}</div>
      <div class="right-col"><div class="box"><div class="box-title">Onegram</div><div class="box-body">Классический интерфейс в стиле VK 2010</div></div></div>
    </div>`;
  bindGlobal();
}

async function sideCommunities(userId) {
  const comms = await getCommunities();
  const members = await getCommunityMembers();
  const own = new Set(members.filter((m) => m.userId === userId).map((m) => m.communityId));
  const list = comms.filter((c) => !c.isBlocked && own.has(c.id)).slice(0, 8);
  return `<div class="left-block"><div class="lb-title">Сообщества</div><div class="lb-search"><a href="#/communities">Управление</a></div>${list.map((c) => `<a href="#/c/${escapeHtml(c.username)}">${escapeHtml(c.name)}</a>`).join('') || '<span class="muted">Нет сообществ</span>'}</div>`;
}

function bindGlobal() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => { clearSession(); });
}
