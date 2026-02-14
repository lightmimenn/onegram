import { renderLayout } from '../components/layout.js';
import { currentUser, getDialogsForUser, getImage, getMessagesByDialog, getOrCreateDialog, getUserByUsername, getUsers, markRead, saveImage, sendMessage, toggleReaction } from '../store.js';
import { imageSrc } from '../utils.js';
import { dialogItemHtml } from '../components/dialog.js';
import { messageHtml } from '../components/message.js';

export async function messagesView({ params }) {
  const me = await currentUser();
  if (!me) return (location.hash = '#/login');
  const dialogs = await getDialogsForUser(me.id);
  const users = await getUsers();
  const peerUsername = params.username;
  let activeDialog = null;
  let peer = null;

  if (peerUsername) {
    peer = await getUserByUsername(peerUsername);
    if (peer && !peer.isBlocked && peer.id !== me.id) activeDialog = await getOrCreateDialog(me.id, peer.id);
  }
  if (!activeDialog && dialogs[0]) {
    activeDialog = dialogs[0];
    peer = users.find((u) => u.id === (activeDialog.userA === me.id ? activeDialog.userB : activeDialog.userA));
  }

  await renderLayout(`<div class="messages-layout"><div class="dialogs-col"><form id="findUser" class="inline"><input name="username" placeholder="username"><button class="btn-small">Открыть</button></form><div id="dialogsList"></div></div><div class="chat-col"><div id="chatArea"></div></div></div>`, { title: 'Сообщения' });

  const list = document.getElementById('dialogsList');
  for (const d of dialogs) {
    const p = users.find((u) => u.id === (d.userA === me.id ? d.userB : d.userA));
    const lm = (await getMessagesByDialog(d.id)).at(-1);
    list.insertAdjacentHTML('beforeend', dialogItemHtml(d, p, lm));
  }

  const chat = document.getElementById('chatArea');
  if (!activeDialog || !peer) {
    chat.innerHTML = '<div class="muted">Выберите диалог</div>';
  } else {
    const msgs = await getMessagesByDialog(activeDialog.id);
    await markRead(activeDialog.id, me.id);
    chat.innerHTML = `<h3>Диалог с @${peer.username}</h3><div id="msgList">${(await Promise.all(msgs.map(async (m) => messageHtml(m, m.fromId === me.id, await Promise.all((m.imageIds || []).map(async (id) => imageSrc(await getImage(id))))))).then((arr) => arr.join(''))}</div>
      <form id="sendMsg" class="form"><textarea name="text" placeholder="Сообщение"></textarea><label>Изображения<input type="file" name="imgs" multiple accept="image/*"></label><button class="btn">Отправить</button><div class="error" id="msgErr"></div></form>`;

    chat.querySelectorAll('.emoji-toggle').forEach((b) => b.addEventListener('click', (e) => {
      const p = document.getElementById(`emoji-${e.target.dataset.mid}`); p.hidden = !p.hidden;
    }));
    chat.querySelectorAll('.emoji-choice,.reaction-btn').forEach((b) => b.addEventListener('click', async (e) => {
      await toggleReaction(e.target.dataset.mid, e.target.dataset.emoji, me.id);
      messagesView({ params: { username: peer.username } });
    }));

    document.getElementById('sendMsg').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const files = fd.getAll('imgs').filter((f) => f?.size);
        const ids = [];
        for (const f of files) {
          const { fileToResizedBase64 } = await import('../utils.js');
          const r = await fileToResizedBase64(f, { maxW: 1024, maxH: 1024 });
          const img = await saveImage({ ownerId: me.id, ...r }); ids.push(img.id);
        }
        await sendMessage({ fromId: me.id, toUser: peer, text: fd.get('text') || '', imageIds: ids });
        messagesView({ params: { username: peer.username } });
      } catch (err) {
        document.getElementById('msgErr').textContent = err.message;
      }
    });
  }

  document.getElementById('findUser').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = new FormData(e.target).get('username').trim();
    const user = await getUserByUsername(username);
    if (!user || user.isBlocked || user.id === me.id) return alert('Пользователь недоступен');
    location.hash = `#/messages/${user.username}`;
  });
}
