import { renderLayout } from '../components/layout.js';
import { createPost, currentUser, getCommunityByUsername, getImage, getPosts, getUserByUsername, saveImage, updateUser } from '../store.js';
import { escapeHtml, imageSrc } from '../utils.js';

export async function profileView({ params }) {
  const me = await currentUser();
  if (!me) return (location.hash = '#/login');
  const user = await getUserByUsername(params.username);
  if (!user) return renderLayout('<div class="error">Пользователь не найден</div>', { title: 'Профиль' });
  const avatar = imageSrc(await getImage(user.avatarImageId));
  const posts = (await getPosts()).filter((p) => p.ownerType === 'user' && p.ownerId === user.id).sort((a,b)=>b.createdAt-a.createdAt);

  await renderLayout(`<div class="profile"><div class="avatar-box">${avatar ? `<img class="avatar100" src="${avatar}">` : '<div class="avatar100 empty"></div>'}${me.id===user.id?'<form id="avatarForm"><input name="avatar" type="file" accept="image/*"><button class="btn-small">Сохранить</button></form>':''}</div><div><h2>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</h2><div>@${escapeHtml(user.username)}</div><div class="box"><div class="box-title">Информация</div><div class="box-body">Дата регистрации: ${new Date(user.createdAt).toLocaleDateString('ru-RU')}</div></div></div></div>
  <form id="wallForm" class="form box"><div class="box-title">Написать на стене</div><textarea name="text" required></textarea><label>Изображения<input type="file" name="imgs" multiple accept="image/*"></label><button class="btn">Опубликовать</button></form>
  <div>${posts.map((p)=>`<div class="post"><div>${p.text}</div><div class="muted">${new Date(p.createdAt).toLocaleString('ru-RU')}</div></div>`).join('')}</div>`, { title: 'Профиль' });

  document.getElementById('avatarForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = new FormData(e.target).get('avatar');
    if (!file?.size) return;
    const { fileToResizedBase64 } = await import('../utils.js');
    const data = await fileToResizedBase64(file, { maxW: 256, maxH: 256 });
    const img = await saveImage({ ownerId: me.id, ...data });
    me.avatarImageId = img.id;
    await updateUser(me);
    profileView({ params });
  });

  document.getElementById('wallForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const files = fd.getAll('imgs').filter((f) => f?.size);
    const ids = [];
    for (const f of files) {
      const { fileToResizedBase64 } = await import('../utils.js');
      const r = await fileToResizedBase64(f, { maxW: 1280, maxH: 1280 });
      const img = await saveImage({ ownerId: me.id, ...r }); ids.push(img.id);
    }
    await createPost({ authorType: 'user', authorId: me.id, ownerType: 'user', ownerId: user.id, text: fd.get('text'), imageIds: ids });
    profileView({ params });
  });
}
