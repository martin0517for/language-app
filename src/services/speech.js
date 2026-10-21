// 發音（SPEC 6.5）：瀏覽器內建語音朗讀，英文 en-US、日文 ja-JP
// 語速設定於 Phase 3 加入，目前固定 0.9。

const LANG_CODE = { en: 'en-US', ja: 'ja-JP' };
let rate = 0.9;

export function setRate(r) {
  rate = r;
}

export function isSupported() {
  return 'speechSynthesis' in window;
}

/** 選擇該語言的語音（iPhone 上語音清單可能稍後才載入） */
function pickVoice(code) {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === code && v.localService)
    || voices.find((v) => v.lang === code)
    || voices.find((v) => v.lang.startsWith(code.slice(0, 2)))
    || null;
}

export function speak(text, lang) {
  if (!isSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // 連續點擊時，停止上一個再播放
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_CODE[lang] || lang;
  const voice = pickVoice(u.lang);
  if (voice) u.voice = voice;
  u.rate = rate;
  synth.speak(u);
}

export function stop() {
  if (isSupported()) window.speechSynthesis.cancel();
}
