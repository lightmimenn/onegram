import { openDB } from './db.js';
import { addRoute, startRouter } from './router.js';
import { seed } from './seed.js';
import { homeView } from './views/home.js';
import { loginView } from './views/login.js';
import { registerView } from './views/register.js';
import { feedView } from './views/feed.js';
import { profileView } from './views/profile.js';
import { messagesView } from './views/messages.js';
import { communitiesView } from './views/communities.js';
import { communityPageView } from './views/communityPage.js';
import { adminView } from './views/admin.js';
import { settingsView } from './views/settings.js';

await openDB();
await seed();

addRoute('/', homeView);
addRoute('/login', loginView);
addRoute('/register', registerView);
addRoute('/feed', feedView);
addRoute('/id/{username}', profileView);
addRoute('/messages', messagesView);
addRoute('/messages/{username}', messagesView);
addRoute('/communities', communitiesView);
addRoute('/c/{communityUsername}', communityPageView);
addRoute('/admin', adminView);
addRoute('/settings', settingsView);

startRouter();
