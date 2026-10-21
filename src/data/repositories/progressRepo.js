// 學習進度、每日紀錄、續學狀態（SPEC 6.4）
// 所有讀寫都經過 storage.js，自動加上 langapp_ 前綴。

import { read, write, remove } from './storage.js';

// ---------- langapp_progress：每張卡片的狀態 ----------
// { [id]: { level, due, seen, again, hard, good, last } }

export function getProgress() {
  return read('progress', {});
}

export function saveCardState(id, state) {
  const all = getProgress();
  all[id] = state;
  write('progress', all);
}

// ---------- langapp_stats：每日學習紀錄 ----------
// { days: { 'YYYY-MM-DD': { en: { new, review }, ja: { new, review } } } }

export function getStats() {
  const s = read('stats', null);
  return s && s.days ? s : { days: {} };
}

export function addStat(date, lang, kind) {
  const s = getStats();
  const day = (s.days[date] ||= {});
  const rec = (day[lang] ||= { new: 0, review: 0 });
  rec[kind] = (rec[kind] || 0) + 1;
  write('stats', s);
}

// ---------- langapp_session：學習中斷時的狀態 ----------
// { en: { date, queue: [{ id, kind }], pos }, ja: {...} }

export function getSession(lang) {
  return read('session', {})[lang] || null;
}

export function saveSession(lang, session) {
  const all = read('session', {});
  all[lang] = session;
  write('session', all);
}

export function clearSession(lang) {
  const all = read('session', {});
  delete all[lang];
  if (Object.keys(all).length) write('session', all);
  else remove('session');
}
