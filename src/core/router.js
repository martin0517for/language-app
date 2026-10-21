// 簡易 hash 路由：#/today、#/library …
// 使用 hash 是因為 GitHub Pages 不支援單頁應用的路徑改寫。

const routes = new Map();
let fallback = null;
const listeners = new Set();

export function addRoute(name, render) {
  routes.set(name, render);
  if (!fallback) fallback = name;
}

export function currentRoute() {
  const name = location.hash.replace(/^#\/?/, '').split('/')[0];
  return routes.has(name) ? name : fallback;
}

export function navigate(name) {
  if (location.hash !== `#/${name}`) location.hash = `#/${name}`;
}

export function onRouteChange(fn) {
  listeners.add(fn);
}

export function startRouter(container) {
  const run = () => {
    const name = currentRoute();
    container.innerHTML = '';
    routes.get(name)(container);
    window.scrollTo(0, 0);
    listeners.forEach((fn) => fn(name));
  };
  window.addEventListener('hashchange', run);
  run();
}
