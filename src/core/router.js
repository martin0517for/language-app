// 簡易 hash 路由：#/today、#/library …
// 使用 hash 是因為 GitHub Pages 不支援單頁應用的路徑改寫。

const routes = new Map();
let fallback = null;
const listeners = new Set();

export function addRoute(name, render) {
  routes.set(name, render);
  if (!fallback) fallback = name;
}

function parts() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

export function currentRoute() {
  const name = parts()[0];
  return routes.has(name) ? name : fallback;
}

/** 網址中路由名稱之後的部分：#/study/en → ['en'] */
export function routeParams() {
  return routes.has(parts()[0]) ? parts().slice(1) : [];
}

export function navigate(path) {
  if (location.hash !== `#/${path}`) location.hash = `#/${path}`;
}

/** 換頁但不留下返回紀錄（離開學習畫面時用） */
export function replace(path) {
  location.replace(`#/${path}`);
}

export function onRouteChange(fn) {
  listeners.add(fn);
}

export function startRouter(container) {
  const run = () => {
    const name = currentRoute();
    container.innerHTML = '';
    listeners.forEach((fn) => fn(name));
    routes.get(name)(container, routeParams());
    window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', run);
  run();
}
