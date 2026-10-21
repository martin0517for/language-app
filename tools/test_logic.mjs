// 學習邏輯測試：node tools/test_logic.mjs
// 用真實的 content/*.json，模擬多天的學習，驗證排程規則（SPEC 4.1–4.3）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 模擬瀏覽器環境 ----------
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.fetch = async (url) => {
  const text = readFileSync(join(ROOT, url.replace('./', '')), 'utf8');
  return { ok: true, json: async () => JSON.parse(text) };
};
const RealDate = Date;
let fakeNow = new RealDate(2026, 9, 22, 8, 0).getTime();
globalThis.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(fakeNow); }
  static now() { return fakeNow; }
};
const setNow = (y, m, d, h = 8) => { fakeNow = new RealDate(y, m - 1, d, h, 0).getTime(); };

const { nextState, newCardState, dueLabel, INTERVALS } = await import('../src/services/scheduler.js');
const { todayKey } = await import('../src/core/date.js');
const svc = await import('../src/services/studyService.js');
const { buildPlan, REVIEW_LIMIT } = await import('../src/services/plan.js');

// ---------- 小工具 ----------
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) pass++; else { fail++; console.log('  ✗', msg); }
}
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}：預期 ${JSON.stringify(b)}，實際 ${JSON.stringify(a)}`);
const section = (t) => console.log(`\n■ ${t}`);
const progress = () => JSON.parse(localStorage.getItem('langapp_progress') || '{}');

async function studyAll(lang, pick) {
  const s = await svc.startSession(lang);
  if (!s) return [];
  const log = [];
  for (;;) {
    const c = await svc.currentCard(lang);
    if (!c) break;
    const r = pick(c);
    log.push({ id: c.item.id, kind: c.kind, rating: r, labels: c.labels });
    if (svc.rateCurrent(lang, r)) break;
  }
  return log;
}

// ---------- 1. 評分規則 ----------
section('1. 評分規則（今天 2026-10-22）');
const T = '2026-10-22';
const lv = (level) => ({ ...newCardState(), level, due: T });
const days = (st, r) => Math.round((new RealDate(nextState(st, r, T).due) - new RealDate(T)) / 864e5);
for (let level = 0; level <= 5; level++) {
  const row = ['again', 'hard', 'good'].map((r) => `${nextState(lv(level), r, T).level}/${days(lv(level), r)}天`);
  console.log(`  等級 ${level}：沒印象 ${row[0]}｜有點卡 ${row[1]}｜記住了 ${row[2]}`);
}
eq(dueLabel(newCardState(), 'again', T), '今天', '新卡 沒印象');
eq(dueLabel(newCardState(), 'hard', T), '明天', '新卡 有點卡');
eq(dueLabel(newCardState(), 'good', T), '3 天後', '新卡 記住了');
eq(dueLabel(lv(2), 'hard', T), '3 天後', '等級 2 有點卡');
eq(dueLabel(lv(2), 'good', T), '7 天後', '等級 2 記住了');
eq(nextState(lv(5), 'good', T).level, 5, '等級 5 不再升級');
eq(dueLabel(lv(5), 'good', T), '30 天後', '等級 5 記住了');

// ---------- 2. 英文第一天 ----------
section('2. 英文第 1 天：新內容 6 個，全部按「有點卡」');
setNow(2026, 10, 22);
let sum = await svc.getTodaySummary('en');
eq([sum.status, sum.review, sum.fresh], ['todo', 0, 6], '今日任務');
let log = await studyAll('en', () => 'hard');
eq(log.map((x) => x.id), ['en_l1_001', 'en_l1_021', 'en_l1_041', 'en_l1_066', 'en_l1_086', 'en_l1_106'], '新內容順序');
sum = await svc.getTodaySummary('en');
eq([sum.status, sum.review, sum.fresh], ['done', 0, 0], '學完後當天：完成、不再出新內容');

// ---------- 3. 中斷續學 ----------
section('3. 日文第 1 天：學 3 張後離開，再進入從第 4 張繼續');
let s = await svc.startSession('ja');
eq(s.queue.length, 7, '第 1 課 = あいうえお + 2 句會話');
for (let i = 0; i < 3; i++) { await svc.currentCard('ja'); svc.rateCurrent('ja', 'good'); }
sum = await svc.getTodaySummary('ja');
eq([sum.status, sum.done, sum.total, sum.fresh], ['continue', 3, 7, 4], '今日頁顯示可續學');
let c = await svc.currentCard('ja');
eq(c.item.kana, 'え', '續學從第 4 張（え）開始');

// ---------- 4. 沒印象：本次最後再出現一次 ----------
section('4. 按「沒印象」的卡片在最後再出現一次');
log = await studyAll('ja', (card) => (card.item.kana === 'え' && card.kind === 'new' ? 'again' : 'good'));
eq(log.map((x) => x.kind), ['new', 'new', 'new', 'new', 'repeat'], '順序：剩下 4 張新內容 + 1 張重複');
eq(log.at(-1).item ?? log.at(-1).id, 'ja_kana_h_e', '最後重複的是 え');
eq(progress().ja_kana_h_e.level, 2, 'え 重複時按記住了 → 等級 2');
const st = JSON.parse(localStorage.getItem('langapp_stats')).days[T].ja;
eq(st, { new: 7, review: 0 }, '統計：重複的那次不重複計算');

// ---------- 5. 第二天 ----------
section('5. 第 2 天：英文複習 6 + 新內容 6；日文進入第 2 課');
setNow(2026, 10, 23);
sum = await svc.getTodaySummary('en');
eq([sum.review, sum.fresh], [6, 6], '英文：昨天按有點卡的 6 個今天複習');
sum = await svc.getTodaySummary('ja');
eq([sum.review, sum.fresh], [0, 7], '日文：昨天都記住了 → 沒有複習；第 2 課 か行 7 個');
log = await studyAll('en', (card) => 'good');
eq(log.filter((x) => x.kind === 'review').map((x) => x.labels.good), Array(6).fill('3 天後'), '複習卡（等級 0）按記住了 → 3 天後');

// ---------- 6. 沒學習的日子 ----------
section('6. 中間 3 天沒學：新內容不累積');
setNow(2026, 10, 27);
sum = await svc.getTodaySummary('en');
eq(sum.fresh, 6, '英文新內容仍是 6 個');
sum = await svc.getTodaySummary('ja');
eq(sum.fresh, 7, '日文仍只有 1 課（第 2 課）');

// ---------- 7. 複習上限 ----------
section('7. 複習上限 15 個');
const { items } = JSON.parse(readFileSync(join(ROOT, 'content/english.json'), 'utf8'));
const many = Object.fromEntries(items.slice(0, 40).map((it, i) => [it.id, { ...newCardState(), level: 1, due: i < 20 ? '2026-10-20' : '2026-10-25' }]));
const plan = buildPlan({ lang: 'en', items, progress: many, stats: { days: {} }, today: '2026-10-27' });
eq(plan.review.length, REVIEW_LIMIT, '到期 40 個，只取 15 個');
ok(plan.review.every((id) => many[id].due === '2026-10-20'), '最早到期的優先');

// ---------- 8. 日文每課數量 ----------
section('8. 日文 21 課的每日數量');
const ja = JSON.parse(readFileSync(join(ROOT, 'content/japanese.json'), 'utf8')).items;
const counts = {};
ja.forEach((it) => { counts[it.lesson] = (counts[it.lesson] || 0) + 1; });
console.log('  ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join('  '));
ok(Object.values(counts).every((n) => n >= 5 && n <= 8), '每課 5–8 個');

// ---------- 9. 凌晨 4 點前算前一天 ----------
section('9. 一天的分界（凌晨 4 點）');
setNow(2026, 10, 28, 0); eq(todayKey(), '2026-10-27', '10/28 00:30 仍算 10/27');
setNow(2026, 10, 28, 3); eq(todayKey(), '2026-10-27', '10/28 03:00 仍算 10/27');
setNow(2026, 10, 28, 4); eq(todayKey(), '2026-10-28', '10/28 04:00 算 10/28');

// ---------- 10. 連續天數 ----------
section('10. 連續天數');
setNow(2026, 10, 23, 22); eq(svc.getStreak(), 2, '10/22、10/23 都有學 → 2 天');
setNow(2026, 10, 24, 9); eq(svc.getStreak(), 2, '10/24 早上還沒學 → 仍顯示 2 天');
setNow(2026, 10, 27, 9); eq(svc.getStreak(), 0, '中斷超過一天 → 0 天');

// ---------- 11. 儲存前綴 ----------
section('11. 本機儲存只使用 langapp_ 前綴');
ok([...store.keys()].every((k) => k.startsWith('langapp_')), `所有 key：${[...store.keys()].join(', ')}`);

console.log(`\n通過 ${pass}、失敗 ${fail}`);
process.exit(fail ? 1 : 0);
