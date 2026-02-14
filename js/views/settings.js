import { renderLayout } from '../components/layout.js';
import { currentUser } from '../store.js';

export async function settingsView() {
  const me = await currentUser();
  if (!me) return (location.hash = '#/login');
  await renderLayout('<div class="box"><div class="box-title">Настройки</div><div class="box-body">Минимальные настройки сессии доступны через выход из профиля.</div></div>', { title: 'Настройки' });
}
