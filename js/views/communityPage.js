import { renderLayout } from '../components/layout.js';
import { createPost, currentUser, getCommunityByUsername, getCommunityMembers, getPosts, saveImage } from '../store.js';

export async function communityPageView({ params }) {
  const me = await currentUser();
  if (!me) return (location.hash = '#/login');
  const c = await getCommunityByUsername(params.communityUsername);
  if (!c) return renderLayout('<div class="error">Сообщество не найдено</div>', { title: 'Сообщество' });
  const members = await getCommunityMembers();
  const isMember = members.some((m) => m.communityId === c.id && m.userId === me.id);
  const posts = (await getPosts()).filter((p) => p.ownerType === 'community' && p.ownerId === c.id).sort((a,b)=>b.createdAt-a.createdAt);
  await renderLayout(`<div class="box"><div class="box-title">${c.name} (@${c.username})</div><div class="box-body">Статус: ${c.isBlocked ? '<span class="blocked">Заблокировано</span>' : 'Активно'}</div></div>${isMember ? `<form id="cpPost" class="form box"><textarea name="text" required></textarea><label>Изображения<input type="file" name="imgs" multiple accept="image/*"></label><button class="btn" ${c.isBlocked ? 'disabled' : ''}>Опубликовать</button><div class="error" id="cpErr"></div></form>` : '<div class="muted">Вы не участник сообщества</div>'}<div>${posts.map((p)=>`<div class="post"><div>${p.text}</div><div class="muted">${new Date(p.createdAt).toLocaleString('ru-RU')}</div></div>`).join('')}</div>`, { title: 'Страница сообщества' });

  document.getElementById('cpPost')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (c.isBlocked) return (document.getElementById('cpErr').textContent = 'Сообщество заблокировано');
    const fd = new FormData(e.target);
    const ids = [];
    for (const f of fd.getAll('imgs').filter((x) => x?.size)) {
      const { fileToResizedBase64 } = await import('../utils.js');
      const r = await fileToResizedBase64(f, { maxW: 1280, maxH: 1280 });
      const img = await saveImage({ ownerId: me.id, ...r }); ids.push(img.id);
    }
    await createPost({ authorType: 'community', authorId: c.id, ownerType: 'community', ownerId: c.id, text: fd.get('text'), imageIds: ids });
    communityPageView({ params });
  });
}
