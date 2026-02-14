import { renderLayout } from '../components/layout.js';
import { currentUser } from '../store.js';

export async function homeView() {
  const user = await currentUser();
  await renderLayout(`
    <div class="home-title">Onegram</div>
    <div class="box"><div class="box-title">Преимущества</div><ul>
      <li>Классический интерфейс в стиле VK 2010</li><li>Полностью локальная работа без backend</li><li>Личные сообщения и реакции</li><li>Профили и стены пользователей</li><li>Сообщества с поиском и управлением</li><li>Админка и модерация слов</li><li>Готово к GitHub Pages</li>
    </ul></div>
    <div class="actions"><a class="btn" href="#/login">Войти</a> <a class="btn" href="#/register">Зарегистрироваться</a> ${user ? '<a class="btn" href="#/feed">Перейти в ленту</a>' : ''}</div>
  `, { showShell: false });
}
