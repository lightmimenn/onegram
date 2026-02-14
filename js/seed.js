import { openDB, put } from './db.js';
import { OFFICIAL_USERNAME } from './store.js';
import { getByIndex, get } from './db.js';
import { sha256, uid } from './utils.js';

export async function seed() {
  await openDB();
  const official = await getByIndex('users', 'username', OFFICIAL_USERNAME);
  if (!official) {
    await put('users', {
      id: uid('usr'),
      firstName: 'Onegram',
      lastName: 'Official',
      username: OFFICIAL_USERNAME,
      passwordHash: await sha256('onegram_system_account'),
      avatarImageId: null,
      role: 'system',
      isBlocked: false,
      createdAt: Date.now(),
    });
  }

  const mod = await get('moderationSettings', 'global');
  if (!mod) {
    await put('moderationSettings', { id: 'global', mode: 'censor', keywords: [] });
  }
}
