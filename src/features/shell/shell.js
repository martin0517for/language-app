// 外框：頁面容器 + 底部導覽
import { icons } from './icons.js';
import { onRouteChange } from '../../core/router.js';

export const TABS = [
  { name: 'today', label: '今日' },
  { name: 'library', label: '詞庫' },
  { name: 'quiz', label: '測驗' },
  { name: 'progress', label: '進度' },
  { name: 'settings', label: '設定' },
];

/** 建立外框，回傳頁面內容要放入的容器 */
export function createShell(root) {
  root.innerHTML = `
    <div class="app">
      <main class="page" id="page"></main>
      <nav class="tabbar" aria-label="主要分頁">
        ${TABS.map(
          (t) => `<a class="tab" href="#/${t.name}" data-tab="${t.name}">${icons[t.name]}<span>${t.label}</span></a>`
        ).join('')}
      </nav>
    </div>`;

  const tabs = root.querySelectorAll('.tab');
  // 全螢幕的頁面（學習畫面）隱藏底部導覽
  const FULLSCREEN = ['study'];
  onRouteChange((name) => {
    root.querySelector('.app').classList.toggle('fullscreen', FULLSCREEN.includes(name));
    tabs.forEach((el) => {
      if (el.dataset.tab === name) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  });

  return root.querySelector('#page');
}
