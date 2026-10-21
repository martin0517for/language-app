// ⚙️ 設定（Phase 3）
import { renderPlaceholder } from '../shared/placeholder.js';
import { APP_VERSION, APP_PHASE } from '../../core/config.js';

export function renderSettings(container) {
  renderPlaceholder(container, {
    eyebrow: 'SETTINGS',
    title: '設定',
    phase: 'PHASE 3',
    items: ['每次新內容數量、複習上限', '發音速度', '深色／淺色模式', '進度匯出／匯入、重置進度', '內容版本、檢查更新'],
  });
  container.insertAdjacentHTML('beforeend', `<p class="muted">App 版本 ${APP_VERSION}（${APP_PHASE}）</p>`);
}
