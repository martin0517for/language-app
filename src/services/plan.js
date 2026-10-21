// 今日任務的計算（SPEC 4.1、3.3）
// 純函式：輸入內容、進度、紀錄，輸出今天要複習與學習的卡片。

import { isDue } from './scheduler.js';
import { addDays } from '../core/date.js';

export const REVIEW_LIMIT = 15;   // 每次複習上限
export const NEW_PER_DAY_EN = 6;  // 英文每天新內容
// 日文每天學一課（lesson）

/**
 * @returns {{ review: string[], fresh: string[], learnedToday: boolean, allLearned: boolean }}
 *   review：到期的複習（最多 15 個，最早到期的優先）
 *   fresh：今天的新內容
 *   learnedToday：今天已經學過新內容（新內容不累積，一天一次）
 *   allLearned：內容檔中的新內容已全部學完
 */
export function buildPlan({ lang, items, progress, stats, today }) {
  const order = new Map(items.map((it, i) => [it.id, i]));

  const review = items
    .filter((it) => isDue(progress[it.id], today))
    .sort((a, b) => {
      const da = progress[a.id].due, db = progress[b.id].due;
      return da < db ? -1 : da > db ? 1 : order.get(a.id) - order.get(b.id);
    })
    .slice(0, REVIEW_LIMIT)
    .map((it) => it.id);

  const unseen = items.filter((it) => !progress[it.id]);
  const learnedToday = (stats.days[today]?.[lang]?.new || 0) > 0;

  let fresh = [];
  if (!learnedToday && unseen.length) {
    if (lang === 'ja') {
      const lesson = unseen[0].lesson;
      fresh = unseen.filter((it) => it.lesson === lesson).map((it) => it.id);
    } else {
      fresh = unseen.slice(0, NEW_PER_DAY_EN).map((it) => it.id);
    }
  }

  return { review, fresh, learnedToday, allLearned: unseen.length === 0 };
}

/** 有學習紀錄的連續天數；今天還沒學時，從昨天往回算 */
export function streakDays(stats, today) {
  const active = (d) => {
    const day = stats.days[d];
    if (!day) return false;
    return Object.values(day).some((r) => (r.new || 0) + (r.review || 0) > 0);
  };
  let d = active(today) ? today : addDays(today, -1);
  let n = 0;
  while (active(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}
