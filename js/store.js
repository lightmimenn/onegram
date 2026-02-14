import { del, get, getAll, getByIndex, put } from './db.js';
import { USERNAME_RE, applyModeration, sha256, uid } from './utils.js';

export const OFFICIAL_USERNAME = 'onegram';

export function getSession() {
  return { userId: localStorage.getItem('currentUserId') || null };
}

export function setSession(user) {
  localStorage.setItem('currentUserId', user.id);
  localStorage.setItem('currentUsername', user.username);
}

export function clearSession() {
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('currentUsername');
}

export async function currentUser() {
  const { userId } = getSession();
  if (!userId) return null;
  return get('users', userId);
}

export async function saveImage({ ownerId, mime, width, height, base64 }) {
  const img = { id: uid('img'), ownerId, mime, width, height, base64, createdAt: Date.now() };
  await put('images', img);
  return img;
}

export async function getImage(id) {
  if (!id) return null;
  return get('images', id);
}

export async function registerUser({ firstName, lastName, username, password }) {
  if (!USERNAME_RE.test(username)) throw new Error('Username: 3-20, латиница/цифры/_');
  if (await getByIndex('users', 'username', username)) throw new Error('Username уже занят');
  const user = {
    id: uid('usr'), firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim(),
    passwordHash: await sha256(password), avatarImageId: null, role: 'user', isBlocked: false, createdAt: Date.now(),
  };
  await put('users', user);
  setSession(user);
  return user;
}

export async function loginUser({ username, password }) {
  const user = await getByIndex('users', 'username', username.trim());
  if (!user) throw new Error('Пользователь не найден');
  if (user.isBlocked) throw new Error('Пользователь заблокирован администратором');
  const hash = await sha256(password);
  if (hash !== user.passwordHash) throw new Error('Неверный пароль');
  setSession(user);
  return user;
}

export async function updateUser(user) { await put('users', user); return user; }
export async function getUserByUsername(username) { return getByIndex('users', 'username', username); }
export async function getUsers() { return getAll('users'); }

export async function createCommunity({ name, username, ownerId, avatarImageId = null }) {
  if (!USERNAME_RE.test(username)) throw new Error('Community username: 3-20, латиница/цифры/_');
  if (await getByIndex('communities', 'username', username)) throw new Error('Username сообщества занят');
  const c = { id: uid('com'), name: name.trim(), username: username.trim(), avatarImageId, ownerId, isBlocked: false, createdAt: Date.now() };
  await put('communities', c);
  await put('communityMembers', { id: uid('cm'), communityId: c.id, userId: ownerId, role: 'owner', createdAt: Date.now() });
  return c;
}

export async function getCommunityByUsername(username) { return getByIndex('communities', 'username', username); }
export async function updateCommunity(community) { await put('communities', community); return community; }
export async function getCommunities() { return getAll('communities'); }
export async function getCommunityMembers() { return getAll('communityMembers'); }

export async function createPost({ authorType, authorId, ownerType, ownerId, text, imageIds = [] }) {
  const p = { id: uid('post'), authorType, authorId, ownerType, ownerId, text: text.trim(), imageIds, likes: [], createdAt: Date.now() };
  await put('posts', p);
  return p;
}

export async function getPosts() { return getAll('posts'); }
export async function updatePost(post) { await put('posts', post); return post; }

export async function createComment({ postId, authorId, text }) {
  const c = { id: uid('cmt'), postId, authorId, text: text.trim(), createdAt: Date.now() };
  await put('comments', c); return c;
}
export async function getComments() { return getAll('comments'); }

function keyFor(a, b) { return [a, b].sort().join('::'); }

export async function getOrCreateDialog(userA, userB) {
  const all = await getAll('dialogs');
  let d = all.find((x) => x.type === 'dm' && keyFor(x.userA, x.userB) === keyFor(userA, userB));
  if (!d) {
    d = { id: uid('dlg'), type: 'dm', userA, userB, lastMessageAt: 0 };
    await put('dialogs', d);
  }
  return d;
}

export async function getDialogsForUser(userId) {
  const all = await getAll('dialogs');
  return all.filter((d) => d.userA === userId || d.userB === userId).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export async function getMessagesByDialog(dialogId) {
  const all = await getAll('messages');
  return all.filter((m) => m.dialogId === dialogId).sort((a, b) => a.createdAt - b.createdAt);
}

export async function getModerationSettings() {
  return get('moderationSettings', 'global');
}

export async function saveModerationSettings(v) { await put('moderationSettings', v); }

export async function sendMessage({ fromId, toUser, text, imageIds = [] }) {
  const mod = await getModerationSettings();
  const moderated = applyModeration(text || '', mod);
  if (!moderated.allowed) throw new Error(moderated.reason);
  const dialog = await getOrCreateDialog(fromId, toUser.id);
  const now = Date.now();
  const msg = {
    id: uid('msg'), dialogId: dialog.id, fromId, toId: toUser.id, text: moderated.text.trim(), imageIds,
    createdAt: now, readAtBy: { [fromId]: now, [toUser.id]: null }, reactions: {},
  };
  await put('messages', msg);
  dialog.lastMessageAt = now;
  await put('dialogs', dialog);
  return msg;
}

export async function markRead(dialogId, userId) {
  const msgs = await getMessagesByDialog(dialogId);
  const now = Date.now();
  await Promise.all(msgs.map(async (m) => {
    if (!m.readAtBy?.[userId]) { m.readAtBy[userId] = now; await put('messages', m); }
  }));
}

export async function toggleReaction(messageId, emoji, userId) {
  const m = await get('messages', messageId);
  m.reactions ||= {};
  for (const k of Object.keys(m.reactions)) m.reactions[k] = m.reactions[k].filter((id) => id !== userId);
  m.reactions[emoji] ||= [];
  m.reactions[emoji].push(userId);
  for (const k of Object.keys(m.reactions)) if (!m.reactions[k].length) delete m.reactions[k];
  await put('messages', m);
  return m;
}

export async function adminBroadcast(text) {
  const users = (await getUsers()).filter((u) => u.role !== 'system');
  const official = await getUserByUsername(OFFICIAL_USERNAME);
  const mod = await getModerationSettings();
  const moderated = applyModeration(text || '', mod);
  if (!moderated.allowed) throw new Error(moderated.reason);
  for (const user of users) await sendMessage({ fromId: official.id, toUser: user, text: moderated.text, imageIds: [] });
  return users.length;
}

export async function deleteImage(id) { return del('images', id); }
