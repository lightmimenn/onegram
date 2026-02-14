import { renderLayout } from '../components/layout.js';
import { loginUser } from '../store.js';

export async function loginView() {
  await renderLayout(`<form id="loginForm" class="form"><label>Username<input name="username" required></label><label>Пароль<input name="password" type="password" required></label><button class="btn">Войти</button><div class="error" id="loginErr"></div></form>`, { title: 'Вход', showShell: false });
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await loginUser({ username: f.get('username'), password: f.get('password') });
      location.hash = '#/feed';
    } catch (err) { document.getElementById('loginErr').textContent = err.message; }
  });
}
