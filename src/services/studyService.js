// 學習流程：今日摘要、開始／續學、評分
// 串接內容、進度與排程，供今日頁與學習畫面使用。

import { todayKey, addDays } from '../core/date.js';
import { loadContent } from '../data/repositories/contentRepo.js';
import {
  getProgress, saveCardState, getStats, addStat,
  getSession, saveSession, clearSession,
} from '../data/repositories/progressRepo.js';
import { buildPlan, streakDays } from './plan.js';
import { nextState, newCardState, dueLabel, RATINGS } from './scheduler.js';

/** 今天仍有效、尚未完成的學習階段 */
function activeSession(lang, today) {
  const s = getSession(lang);
  if (!s) return null;
  if (s.date !== today || s.pos >= s.queue.length) {
    clearSession(lang); // 隔天或已完成的舊階段：已評分的卡片都已存好，直接捨棄
    return null;
  }
  return s;
}

/**
 * 今日頁用的摘要
 * status：'todo' 可開始／'continue' 可續學／'done' 今日完成／'idle' 今天沒有任務
 */
export async function getTodaySummary(lang) {
  const today = todayKey();
  const { items } = await loadContent(lang);
  const stats = getStats();
  const plan = buildPlan({ lang, items, progress: getProgress(), stats, today });
  const session = activeSession(lang, today);
  const studied = !!stats.days[today]?.[lang];

  let review = plan.review.length;
  let fresh = plan.fresh.length;
  let status;
  let done = 0;
  let total = 0;

  if (session) {
    const rest = session.queue.slice(session.pos);
    review = rest.filter((q) => q.kind !== 'new').length;
    fresh = rest.filter((q) => q.kind === 'new').length;
    done = session.pos;
    total = session.queue.length;
    status = 'continue';
  } else if (review + fresh > 0) {
    status = 'todo';
  } else {
    status = studied ? 'done' : 'idle';
  }

  const progress = getProgress();
  const learned = items.filter((it) => progress[it.id]).length;
  const lesson = lang === 'ja' ? lessonInfo(items, session, plan.fresh) : null;

  return {
    lang, status, review, fresh, done, total,
    learned, count: items.length, lesson, allLearned: plan.allLearned,
  };
}

/** 日文今天這一課：{ no, label }，例：{ no: 3, label: 'さ行' } */
export function lessonInfo(items, session, fresh) {
  const ids = session ? session.queue.filter((q) => q.kind === 'new').map((q) => q.id) : fresh;
  const lessonItems = items.filter((it) => ids.includes(it.id));
  if (!lessonItems.length) return null;
  // 每一行用第一個假名命名：さ行、きゃ行；ん 單獨顯示
  const rows = new Map();
  lessonItems.forEach((it) => {
    if (it.type === 'kana' && !rows.has(it.row)) rows.set(it.row, it.row === 'n' ? 'ん' : `${it.kana}行`);
  });
  return { no: lessonItems[0].lesson, label: [...rows.values()].join('・') || '會話' };
}

export function getStreak() {
  return streakDays(getStats(), todayKey());
}

/** 開始或繼續學習，回傳學習階段；沒有任務時回傳 null */
export async function startSession(lang) {
  const today = todayKey();
  const existing = activeSession(lang, today);
  if (existing) return existing;

  const { items } = await loadContent(lang);
  const plan = buildPlan({ lang, items, progress: getProgress(), stats: getStats(), today });
  const queue = [
    ...plan.review.map((id) => ({ id, kind: 'review' })),
    ...plan.fresh.map((id) => ({ id, kind: 'new' })),
  ];
  if (!queue.length) return null;

  const session = { date: today, queue, pos: 0 };
  saveSession(lang, session);
  return session;
}

/** 目前這張卡片：內容、類型、三個按鈕的下次時間 */
export async function currentCard(lang) {
  const today = todayKey();
  const session = activeSession(lang, today);
  if (!session) return null;
  const { byId } = await loadContent(lang);
  const entry = session.queue[session.pos];
  const item = byId.get(entry.id);
  if (!item) {
    // 內容已被刪除：跳過這張
    session.pos += 1;
    saveSession(lang, session);
    return currentCard(lang);
  }
  const state = getProgress()[entry.id] || newCardState();
  const labels = Object.fromEntries(RATINGS.map((r) => [r, dueLabel(state, r, today)]));
  if (entry.kind === 'repeat') labels.again = '明天';
  return { item, kind: entry.kind, labels, pos: session.pos, total: session.queue.length };
}

/** 評分並前進到下一張；回傳 true 表示本次學習完成 */
export function rateCurrent(lang, rating) {
  const today = todayKey();
  const session = activeSession(lang, today);
  if (!session) return true;

  const entry = session.queue[session.pos];
  const state = getProgress()[entry.id] || newCardState();
  const next = nextState(state, rating, today);
  // 重複出現時又按「沒印象」：改為明天，今天的任務直接算完成
  if (entry.kind === 'repeat' && rating === 'again') next.due = addDays(today, 1);
  saveCardState(entry.id, next);

  // 「沒印象」的卡片在本次最後再出現一次（重複出現的那次不再追加）
  if (entry.kind !== 'repeat') {
    addStat(today, lang, entry.kind === 'new' ? 'new' : 'review');
    if (rating === 'again') session.queue.push({ id: entry.id, kind: 'repeat' });
  }

  session.pos += 1;
  if (session.pos >= session.queue.length) {
    clearSession(lang);
    return true;
  }
  saveSession(lang, session);
  return false;
}
