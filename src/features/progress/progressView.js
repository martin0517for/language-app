// 📊 進度（Phase 6）
import { renderPlaceholder } from '../shared/placeholder.js';

export function renderProgress(container) {
  renderPlaceholder(container, {
    eyebrow: 'PROGRESS',
    title: '進度',
    phase: 'PHASE 6',
    items: ['連續天數、累計學習天數', '近 7／30 天每日學習量', '各熟練等級數量分布'],
  });
}
