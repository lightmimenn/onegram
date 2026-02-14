import { renderLayout } from '../components/layout.js';
import { createComment, createPost, currentUser, getComments, getCommunities, getCommunityMembers, getImage, getPosts, getUserByUsername, getUsers, saveImage, updatePost } from '../store.js';
import { imageSrc, scorePost } from '../utils.js';
import { postHtml } from '../components/post.js';

export async function feedView() {
  const me = await currentUser();
  if (!me) return (location.hash = '#/login');
  const users = await getUsers();
  const communities = await getCommunities();
  const members = await getCommunityMembers();
  const myCom = new Set(members.filter((m) => m.userId === me.id).map((m) => m.communityId));
  const posts = await getPosts();
  const comments = await getComments();

  const scored = posts.map((p) => ({ ...p, s: scorePost(p, me.id, p.authorType === 'community' && myCom.has(p.authorId)) })).sort((a, b) => b.s - a.s);

  await renderLayout(`<form id="newPost" class="box form"><div class="box-title">Новая запись</div><textarea name="text" required></textarea><label>Изображения<input type="file" name="imgs" multiple accept="image/*"></label><button class="btn">Опубликовать</button></form><div id="feedList"></div>`, { title: 'Рекомендованная лента' });

  const feedEl = document.getElementById('feedList');
  for (const p of scored) {
    const author = p.authorType === 'user' ? users.find((u) => u.id === p.authorId) : communities.find((c) => c.id === p.authorId);
    const imgs = await Promise.all((p.imageIds || []).map(async (id) => imageSrc(await getImage(id))));
    const wrap = document.createElement('div');
    wrap.innerHTML = postHtml(p, author?.name || `${author?.firstName || ''} ${author?.lastName || ''}`.trim(), imgs) + `<form class="comment-form" data-pid="${p.id}"><input name="text" placeholder="Комментировать"><button class="btn-small">OK</button></form><div class="comments-list">${comments.filter((c) => c.postId === p.id).map((c) => `<div class="comment">${users.find((u) => u.id === c.authorId)?.username || 'user'}: ${c.text}</div>`).join('')}</div>`;
    feedEl.appendChild(wrap);
  }

  document.getElementById('newPost').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const files = fd.getAll('imgs').filter((f) => f?.size);
    const ids = [];
    for (const f of files) {
      const { fileToResizedBase64 } = await import('../utils.js');
      const r = await fileToResizedBase64(f, { maxW: 1280, maxH: 1280 });
      const img = await saveImage({ ownerId: me.id, ...r }); ids.push(img.id);
    }
    await createPost({ authorType: 'user', authorId: me.id, ownerType: 'user', ownerId: me.id, text: fd.get('text'), imageIds: ids });
    feedView();
  });

  feedEl.querySelectorAll('.like-post').forEach((b) => b.addEventListener('click', async (e) => {
    const p = posts.find((x) => x.id === e.target.closest('.post').dataset.id);
    p.likes ||= [];
    p.likes = p.likes.includes(me.id) ? p.likes.filter((i) => i !== me.id) : [...p.likes, me.id];
    await updatePost(p); feedView();
  }));

  feedEl.querySelectorAll('.comment-form').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!fd.get('text').trim()) return;
    await createComment({ postId: e.target.dataset.pid, authorId: me.id, text: fd.get('text') });
    feedView();
  }));
}
