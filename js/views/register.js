import { renderLayout } from '../components/layout.js';
import { registerUser } from '../store.js';

export async function registerView() {
  await renderLayout(`<form id="regForm" class="form"><label>Имя<input name="firstName" required></label><label>Фамилия<input name="lastName" required></label><label>Username<input name="username" required></label><label>Пароль<input name="password" type="password" required></label><button class="btn">Зарегистрироваться</button><div class="error" id="regErr"></div></form>`, { title: 'Регистрация', showShell: false });
  document.getElementById('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await registerUser(Object.fromEntries(f.entries()));
      location.hash = '#/feed';
    } catch (err) { document.getElementById('regErr').textContent = err.message; }
  });
}
