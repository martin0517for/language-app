// 日期工具
// 所有日期都用本機時間的 'YYYY-MM-DD' 字串表示。
// 一天從凌晨 4 點開始算：睡前學到 0 點之後，仍算同一天。

export const DAY_START_HOUR = 4;

const pad = (n) => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD'（不做 4 點調整） */
export function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → 當天中午的 Date（避免時區與日光節約誤差） */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** 今天的學習日（凌晨 4 點前算前一天） */
export function todayKey(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1);
  return toKey(d);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** b 比 a 晚幾天 */
export function diffDays(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}
