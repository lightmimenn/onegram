import { renderLayout } from '../components/layout.js';
import { createCommunity, currentUser, getCommunities, getCommunityMembers, saveImage } from '../store.js';
import { communityItemHtml } from '../components/communityItem.js';

export async function communitiesView() {
  const me = await currentUser();
  if (!me) return (location.hash = '#/login');
  let communities = (await getCommunities()).filter((c) => !c.isBlocked);
  await renderLayout(`<div class="box"><div class="box-title">Поиск сообществ</div><input id="commSearch" placeholder="название или username"></div><div id="commList"></div><form id="createComm" class="form box"><div class="box-title">Создать сообщество</div><label>Название<input name="name" required></label><label>Username<input name="username" required></label><label>Аватар<input type="file" name="avatar" accept="image/*"></label><button class="btn">Создать</button><div class="error" id="commErr"></div></form>`, { title: 'Сообщества' });

  const renderList = (q = '') => {
    document.getElementById('commList').innerHTML = communities.filter((c) => (c.name + c.username).toLowerCase().includes(q.toLowerCase())).map(communityItemHtml).join('') || '<div class="muted">Ничего не найдено</div>';
  };
  renderList();
  document.getElementById('commSearch').addEventListener('input', (e) => renderList(e.target.value));

  document.getElementById('createComm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      let avatarImageId = null;
      const file = fd.get('avatar');
      if (file?.size) {
        const { fileToResizedBase64 } = await import('../utils.js');
        const data = await fileToResizedBase64(file, { maxW: 256, maxH: 256 });
        const img = await saveImage({ ownerId: me.id, ...data }); avatarImageId = img.id;
      }
      const c = await createCommunity({ name: fd.get('name'), username: fd.get('username'), ownerId: me.id, avatarImageId });
      location.hash = `#/c/${c.username}`;
    } catch (err) { document.getElementById('commErr').textContent = err.message; }
  });
}
