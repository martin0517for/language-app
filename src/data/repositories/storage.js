// 本機儲存的唯一入口（Repository 層最底部）
// 規則（SPEC 6.7）：
// - 所有 key 自動加上 langapp_ 前綴
// - 不提供、也不得使用 localStorage.clear()
// - 刪除全部時，只逐一刪除 langapp_ 開頭的 key

import { STORAGE_PREFIX } from '../../core/config.js';

const fullKey = (key) => STORAGE_PREFIX + key;

export function read(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(fullKey(key));
    return raw === null ? defaultValue : JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(fullKey(key));
  } catch {
    /* 忽略 */
  }
}

/** 列出本 App 的所有 key（不含前綴） */
export function listKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k.slice(STORAGE_PREFIX.length));
    }
  } catch {
    /* 忽略 */
  }
  return keys;
}

/** 只刪除本 App 的資料，不影響同網域的其他 App */
export function removeAllOwn() {
  listKeys().forEach(remove);
}
