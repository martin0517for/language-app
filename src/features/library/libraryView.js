// 📚 詞庫（Phase 4）
import { renderPlaceholder } from '../shared/placeholder.js';

export function renderLibrary(container) {
  renderPlaceholder(container, {
    eyebrow: 'LIBRARY',
    title: '詞庫',
    phase: 'PHASE 4',
    items: ['英文依 L1／L2／L3 分類瀏覽', '五十音表（已學假名標色）', '7 個旅遊情境會話', '搜尋、熟練等級與發音'],
  });
}
