// 複習排程（SPEC 4.2、4.3）
// 純函式：只計算，不讀寫儲存，方便測試。

import { addDays, diffDays } from '../core/date.js';

/** 各等級的複習間隔（天） */
export const INTERVALS = [0, 1, 3, 7, 14, 30];
export const MAX_LEVEL = INTERVALS.length - 1;

export const RATINGS = ['again', 'hard', 'good'];
export const RATING_LABELS = { again: '沒印象', hard: '有點卡', good: '記住了' };

/** 卡片的初始狀態（第一次學習前） */
export function newCardState() {
  return { level: 0, due: null, seen: 0, again: 0, hard: 0, good: 0, last: null };
}

/**
 * 評分後的下一個狀態
 * - 沒印象：回到等級 0，今天到期
 * - 有點卡：等級維持；等級 0 時改為明天
 * - 記住了：升一級；等級 0 直接升到 2（3 天後）
 */
export function nextState(state, rating, today) {
  const s = { ...newCardState(), ...state };
  let level = s.level;
  let days;

  if (rating === 'again') {
    level = 0;
    days = 0;
  } else if (rating === 'hard') {
    days = level === 0 ? 1 : INTERVALS[level];
  } else if (rating === 'good') {
    level = level === 0 ? 2 : Math.min(level + 1, MAX_LEVEL);
    days = INTERVALS[level];
  } else {
    throw new Error(`未知的評分：${rating}`);
  }

  return {
    ...s,
    level,
    due: addDays(today, days),
    seen: s.seen + 1,
    [rating]: s[rating] + 1,
    last: today,
  };
}

/** 按鈕下方的小字：今天／明天／N 天後 */
export function dueLabel(state, rating, today) {
  const days = diffDays(today, nextState(state, rating, today).due);
  if (days <= 0) return '今天';
  if (days === 1) return '明天';
  return `${days} 天後`;
}

/** 是否到期需要複習 */
export function isDue(state, today) {
  return !!state && !!state.due && state.due <= today;
}
