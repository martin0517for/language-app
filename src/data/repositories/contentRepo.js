// 學習內容（content/*.json）的讀取
// 內容只讀不寫；同一次開啟 App 只下載一次。

const FILES = { en: './content/english.json', ja: './content/japanese.json' };
const cache = new Map();

/** 取得某語言的內容：{ version, items, byId } */
export function loadContent(lang) {
  if (!cache.has(lang)) {
    const p = fetch(FILES[lang], { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`內容載入失敗（${res.status}）`);
        return res.json();
      })
      .then((data) => ({
        version: data.version,
        items: data.items,
        byId: new Map(data.items.map((it) => [it.id, it])),
      }))
      .catch((e) => {
        cache.delete(lang); // 失敗時下次可重試
        throw e;
      });
    cache.set(lang, p);
  }
  return cache.get(lang);
}
