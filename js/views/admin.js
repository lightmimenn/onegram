import { renderLayout } from '../components/layout.js';
import { adminBroadcast, getCommunities, getModerationSettings, getUserByUsername, getUsers, saveModerationSettings, updateCommunity, updateUser } from '../store.js';
import { parseKeywords } from '../utils.js';

const ADMIN_PASSWORD = '0XPZ17jiZ3DR2AIg';

export async function adminView() {
  const authed = sessionStorage.getItem('adminSession') === 'true';
  if (!authed) {
    await renderLayout(`<form id="adminLogin" class="form"><label>Пароль админки<input name="password" type="password" required></label><button class="btn">Войти</button><div class="error" id="admErr"></div></form>`, { title: 'Админ вход', showShell: false });
    document.getElementById('adminLogin').addEventListener('submit', (e) => {
      e.preventDefault();
      const p = new FormData(e.target).get('password');
      if (p === ADMIN_PASSWORD) { sessionStorage.setItem('adminSession', 'true'); location.hash = '#/admin'; }
      else document.getElementById('admErr').textContent = 'Неверный пароль';
    });
    return;
  }

  const users = await getUsers();
  const communities = await getCommunities();
  const mod = await getModerationSettings();
  await renderLayout(`<button id="adminLogout" class="btn-small">Выйти из админки</button>
    <div class="box"><div class="box-title">Пользователи</div><input id="userSearch" placeholder="username"><table class="table" id="usersTable"><thead><tr><th>Имя</th><th>Username</th><th>Дата</th><th>Статус</th></tr></thead><tbody>${users.map((u) => `<tr><td>${u.firstName} ${u.lastName}</td><td>${u.username}</td><td>${new Date(u.createdAt).toLocaleDateString('ru-RU')}</td><td>${u.isBlocked ? 'Заблокирован' : 'Активен'}</td></tr>`).join('')}</tbody></table></div>
    <form id="blockUser" class="box inline"><input name="username" placeholder="username"><button class="btn-small" name="act" value="block">Блокировать</button><button class="btn-small" name="act" value="unblock">Разблокировать</button><div class="error" id="uErr"></div></form>
    <div class="box"><div class="box-title">Модерация сообщений</div><form id="modForm" class="inline"><select name="mode"><option value="censor" ${mod.mode==='censor'?'selected':''}>censor</option><option value="ban" ${mod.mode==='ban'?'selected':''}>ban</option></select><input name="keywords" value="${(mod.keywords||[]).join(', ')}" placeholder="слова через запятую"><button class="btn-small">Сохранить</button></form><div class="muted">Текущие слова: ${(mod.keywords||[]).join(', ') || 'нет'}</div></div>
    <form id="blockCom" class="box inline"><input name="username" placeholder="community username"><button class="btn-small" name="act" value="block">Блокировать сообщество</button><button class="btn-small" name="act" value="unblock">Разблокировать</button><div class="error" id="cErr"></div></form>
    <form id="broadcast" class="box form"><div class="box-title">Рассылка от Onegram для всех</div><textarea name="text" required></textarea><button class="btn">Отправить всем</button><div class="error" id="bErr"></div></form>
  `, { title: 'Админ панель' });

  document.getElementById('adminLogout').addEventListener('click', () => { sessionStorage.removeItem('adminSession'); adminView(); });
  document.getElementById('userSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#usersTable tbody tr').forEach((tr) => tr.style.display = tr.children[1].textContent.toLowerCase().includes(q) ? '' : 'none');
  });

  document.getElementById('blockUser').addEventListener('click', async (e) => {
    if (!e.target.name) return;
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const user = await getUserByUsername(fd.get('username').trim());
    if (!user) return (document.getElementById('uErr').textContent = 'Пользователь не найден');
    user.isBlocked = e.target.value === 'block';
    await updateUser(user); adminView();
  });

  document.getElementById('modForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await saveModerationSettings({ id: 'global', mode: fd.get('mode'), keywords: parseKeywords(fd.get('keywords')) });
    adminView();
  });

  document.getElementById('blockCom').addEventListener('click', async (e) => {
    if (!e.target.name) return;
    e.preventDefault();
    const username = new FormData(e.currentTarget).get('username').trim();
    const c = communities.find((x) => x.username === username);
    if (!c) return (document.getElementById('cErr').textContent = 'Сообщество не найдено');
    c.isBlocked = e.target.value === 'block';
    await updateCommunity(c); adminView();
  });

  document.getElementById('broadcast').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await adminBroadcast(new FormData(e.target).get('text')); alert('Отправлено'); }
    catch (err) { document.getElementById('bErr').textContent = err.message; }
  });
}
