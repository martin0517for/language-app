// ✏️ 測驗（Phase 5）
import { renderPlaceholder } from '../shared/placeholder.js';

export function renderQuiz(container) {
  renderPlaceholder(container, {
    eyebrow: 'QUIZ',
    title: '測驗',
    phase: 'PHASE 5',
    items: ['選擇範圍：英文層級／五十音／日文會話情境', '題數：10 或 20 題', '結果：答對率與答錯清單', '答錯的卡片等級降回 0'],
  });
}
