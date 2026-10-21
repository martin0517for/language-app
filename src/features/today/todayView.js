// 🏠 今日（Phase 2 接上真正的學習資料）
import { icons } from '../shell/icons.js';

const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function dateLabel(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${WEEK[d.getDay()]} · ${mm}.${dd}`;
}

function taskCard({ lang, band, sub, subClass = '' }) {
  return `
    <section class="ticket">
      <div class="ticket-band ${lang}"><span>${band}</span><span class="${subClass}">${sub}</span></div>
      <div class="ticket-body stats">
        <div class="stat"><span class="stat-label">複習</span><span class="stat-value dim">–</span></div>
        <div class="stat"><span class="stat-label">新內容</span><span class="stat-value dim">–</span></div>
      </div>
      <div class="ticket-perf"></div>
      <div class="ticket-foot">
        <span class="muted">Phase 2 開放</span>
        <button class="btn ${lang}" type="button" disabled>開始</button>
      </div>
    </section>`;
}

export function renderToday(container) {
  container.innerHTML = `
    <header class="page-header">
      <div>
        <div class="eyebrow">${dateLabel()}</div>
        <h1>今日</h1>
      </div>
      <span class="pill">${icons.calendar.replace('<svg', '<svg width="16" height="16"')}連續 0 天</span>
    </header>
    <p class="page-sub">學習內容準備中，完成 Phase 2 後就能開始每天學習。</p>
    ${taskCard({ lang: 'en', band: 'EN · 工作英文', sub: 'L1' })}
    ${taskCard({ lang: 'ja', band: 'JA · 五十音', sub: 'ひらがな', subClass: 'ja' })}`;
}
