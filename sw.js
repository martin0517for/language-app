// Service Worker（離線快取）
// Phase 3 才會實作並註冊，目前不啟用，避免開發期間快取舊版本。
//
// 實作時必須遵守 SPEC 6.7：
// - 快取名稱前綴：langapp-（例：langapp-v1）
// - 更新時只刪除以 langapp- 開頭、且不是目前版本的快取
// - 禁止刪除所有快取
// - 範圍限定在 /language-app/ 底下
