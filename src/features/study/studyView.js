// 翻卡學習畫面（第 4 步製作）
// 由「今日」進入，全螢幕、隱藏底部導覽。
import { replace } from '../../core/router.js';

export function renderStudy(container, [lang] = []) {
  container.innerHTML = `
    <p class="page-sub">學習畫面製作中（${lang === 'ja' ? '日文' : '英文'}）</p>
    <button class="btn ${lang}" type="button">回今日</button>`;
  container.querySelector('button').addEventListener('click', () => replace('today'));
}
