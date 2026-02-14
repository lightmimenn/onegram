const routes = [];

export function addRoute(pattern, handler) {
  const keys = [];
  const regex = new RegExp(`^${pattern.replace(/\//g, '\\/').replace(/\{([^}]+)\}/g, (_, k) => { keys.push(k); return '([^\\/]+)'; })}$`);
  routes.push({ regex, keys, handler });
}

export function startRouter() {
  const run = async () => {
    const hash = location.hash.replace(/^#/, '') || '/';
    for (const r of routes) {
      const m = hash.match(r.regex);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1]));
        await r.handler({ path: hash, params });
        return;
      }
    }
    location.hash = '#/';
  };
  window.addEventListener('hashchange', run);
  run();
}
