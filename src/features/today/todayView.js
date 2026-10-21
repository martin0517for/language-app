// 🏠 今日：連續天數、英文與日文的任務卡
import { icons } from '../shell/icons.js';
import { navigate, currentRoute } from '../../core/router.js';
import { todayKey, fromKey } from '../../core/date.js';
import { getTodaySummary, getStreak, startSession } from '../../services/studyService.js';

const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const LANGS = [
  { lang: 'en', band: 'EN · 工作英文' },
  { lang: 'ja', band: 'JA · 五十音', bandClass: 'ja' },
];

/** 顯示學習日（凌晨 4 點前顯示前一天，與學習進度一致） */
function dateLabel(d = fromKey(todayKey())) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${WEEK[d.getDay()]} · ${mm}.${dd}`;
}

const small = (icon) => icon.replace('<svg', '<svg width="16" height="16"');

/** 任務卡左下角的說明文字 */
function footText(s) {
  if (s.status === 'continue') return `已完成 ${s.done} / ${s.total}，可從中斷處繼續`;
  if (s.status === 'done') return s.allLearned ? '新內容已學完，該更新囉' : '今天的進度完成了';
  if (s.status === 'idle') return s.allLearned ? '新內容已學完，該更新囉' : '今天沒有任務';
  const total = s.review + s.fresh;
  if (s.lang === 'ja' && s.lesson) return `第 ${s.lesson.no} 課 · ${s.lesson.label} · 共 ${total} 張`;
  return `共 ${total} 張`;
}

function taskCard(meta, s) {
  const done = s.status === 'done';
  const action =
    s.status === 'todo' ? `<button class="btn ${meta.lang}" type="button" data-start="${meta.lang}">開始</button>` :
    s.status === 'continue' ? `<button class="btn ${meta.lang}" type="button" data-start="${meta.lang}">繼續</button>` :
    done ? `<span class="done-mark ${meta.lang}">${small(icons.check)}完成</span>` : '';
  const num = (n) => `<span class="stat-value${n === 0 ? ' dim' : ''}">${n}</span>`;

  return `
    <section class="ticket${done ? ' is-done' : ''}">
      <div class="ticket-band ${meta.lang}"><span>${meta.band}</span><span>已學 ${s.learned} / ${s.count}</span></div>
      <div class="ticket-body stats">
        <div class="stat"><span class="stat-label">複習</span>${num(s.review)}</div>
        <div class="stat"><span class="stat-label">新內容</span>${num(s.fresh)}</div>
      </div>
      <div class="ticket-perf"></div>
      <div class="ticket-foot">
        <span class="muted">${footText(s)}</span>
        ${action}
      </div>
    </section>`;
}

export async function renderToday(container) {
  container.innerHTML = `
    <header class="page-header">
      <div>
        <div class="eyebrow">${dateLabel()}</div>
        <h1>今日</h1>
      </div>
      <span class="pill">${small(icons.calendar)}連續 ${getStreak()} 天</span>
    </header>
    <div class="today-cards"><p class="muted">載入中…</p></div>`;

  const box = container.querySelector('.today-cards');
  let summaries;
  try {
    summaries = await Promise.all(LANGS.map((m) => getTodaySummary(m.lang)));
  } catch (e) {
    box.innerHTML = `<p class="page-sub">學習內容載入失敗，請確認網路後重新開啟。（${e.message}）</p>`;
    return;
  }
  if (currentRoute() !== 'today' || !box.isConnected) return; // 載入期間已切換頁面

  box.innerHTML = LANGS.map((m, i) => taskCard(m, summaries[i])).join('');
  box.querySelectorAll('[data-start]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const lang = btn.dataset.start;
      btn.disabled = true;
      const session = await startSession(lang);
      if (session) navigate(`study/${lang}`);
      else btn.disabled = false;
    });
  });
}
