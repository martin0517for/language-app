// 翻卡學習畫面（SPEC 4.1、4.2）
// #/study/en         學習：先複習、再新內容，翻面後評分
// #/study/en/browse  再看一次：瀏覽今天學過的卡片，不評分、不影響排程
// 全螢幕、隱藏底部導覽；離開時進度已自動保存。

import { icons } from '../shell/icons.js';
import { replace, navigate, currentRoute } from '../../core/router.js';
import {
  currentCard, rateCurrent, getTodayCards, getTodayStats, getStreak, rowKana,
} from '../../services/studyService.js';
import { speak, stop } from '../../services/speech.js';
import { RATING_LABELS } from '../../services/scheduler.js';

const KIND_LABEL = { new: '新內容', review: '複習', repeat: '再一次' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 卡片內容 ----------

/** 標頭：左側語言與類型、右側分類 */
function bandText(item) {
  if (item.word !== undefined) return [`EN · L${item.level}`, item.topic];
  if (item.type === 'kana') return ['JA · ひらがな', `${item.group} · ${item.row === 'n' ? 'ん' : item.kana[0] + '行'}`];
  return ['JA · 會話', item.scene === 'basic' ? '基本' : item.scene];
}

/** 朗讀的文字 */
function speechText(item) {
  return item.word ?? item.ja ?? item.kana;
}

const speakBtn = (key, extra = '') => `<button class="speak${extra}" type="button" data-speak="${key}" aria-label="播放發音">${icons.speaker}</button>`;

function frontHtml(item, flipped) {
  if (item.word !== undefined) {
    return `
      <div class="word">${esc(item.word)}</div>
      <div class="front-zh">${esc(item.zh)}</div>
      ${speakBtn('main')}
      ${flipped ? '' : '<div class="hint">點擊卡片翻面</div>'}`;
  }
  if (item.type === 'kana') {
    return `
      <div class="word kana" lang="ja">${esc(item.kana)}</div>
      ${speakBtn('main')}
      ${flipped ? '' : '<div class="hint">點擊卡片翻面</div>'}`;
  }
  return `
    <div class="word phrase" lang="ja">${esc(item.ja)}</div>
    ${speakBtn('main')}
    ${flipped ? '' : '<div class="hint">點擊卡片翻面</div>'}`;
}

function backHtml(item, row) {
  if (item.word !== undefined) {
    return `
      <div class="kk">${item.kk ? `[${esc(item.kk)}]` : ''}<span class="pos">${esc(item.pos)}</span></div>
      <div class="example">
        <div class="example-head"><b>EXAMPLE</b>${speakBtn('example', ' small')}</div>
        <div>${esc(item.example)}</div>
        <div class="example-zh">${esc(item.exampleZh)}</div>
      </div>`;
  }
  if (item.type === 'kana') {
    return `
      <div class="romaji">${esc(item.romaji)}</div>
      <div class="row-kana" lang="ja">${row.map((k) => (k === item.kana ? `<b>${k}</b>` : `<span>${k}</span>`)).join('')}</div>`;
  }
  return `
    <div class="back-zh">${esc(item.zh)}</div>
    <div class="back-kana" lang="ja">${esc(item.kana)}</div>
    <div class="back-romaji">${esc(item.romaji)}</div>`;
}

function cardHtml({ lang, item, flipped, row }) {
  const [left, right] = bandText(item);
  return `
    <div class="study-card${flipped ? ' flipped' : ''}" role="button" tabindex="0" aria-label="${flipped ? '卡片背面' : '點擊翻面'}">
      <div class="ticket-band ${lang}"><span>${esc(left)}</span><span>${esc(right)}</span></div>
      <div class="card-front">${frontHtml(item, flipped)}</div>
      ${flipped ? `<div class="ticket-perf"></div><div class="card-back">${backHtml(item, row)}</div>` : ''}
    </div>`;
}

function topBar(pos, total) {
  const pct = total ? Math.round((pos / total) * 100) : 0;
  return `
    <div class="study-top">
      <button class="icon-btn" type="button" data-close aria-label="離開">${icons.close}</button>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <span class="count">${Math.min(pos + 1, total)} / ${total}</span>
    </div>`;
}

// ---------- 學習模式 ----------

async function runStudy(container, lang) {
  let flipped = false;
  let card = null;
  let row = [];
  let busy = false;

  async function load() {
    card = await currentCard(lang);
    if (!card) return finish();
    flipped = false;
    row = card.item.type === 'kana' ? await rowKana(card.item) : [];
    draw();
  }

  function draw() {
    if (!container.isConnected || currentRoute() !== 'study') return;
    const { item, kind, labels, pos, total } = card;
    container.innerHTML = `
      <div class="study">
        ${topBar(pos, total)}
        <span class="kind-tag${kind === 'new' ? ' new' : ''}">${KIND_LABEL[kind]}</span>
        ${cardHtml({ lang, item, flipped, row })}
        <div class="study-actions">
          ${flipped
            ? `<div class="rate">${['again', 'hard', 'good'].map((r) => `
                <button class="rate-${r}" type="button" data-rate="${r}">
                  <span>${RATING_LABELS[r]}</span><small>${labels[r]}</small>
                </button>`).join('')}</div>`
            : `<button class="btn ${lang} wide" type="button" data-flip>翻面</button>`}
        </div>
      </div>`;
    bind(item);
  }

  function bind(item) {
    container.querySelector('[data-close]').addEventListener('click', leave);
    container.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(b.dataset.speak === 'example' ? item.example : speechText(item), lang);
    }));
    const flip = () => { if (!flipped) { flipped = true; draw(); } };
    container.querySelector('.study-card').addEventListener('click', flip);
    container.querySelector('[data-flip]')?.addEventListener('click', flip);
    container.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      stop();
      const done = rateCurrent(lang, b.dataset.rate);
      busy = false;
      if (done) finish(); else await load();
    }));
  }

  function finish() {
    if (!container.isConnected || currentRoute() !== 'study') return;
    const s = getTodayStats(lang);
    if (s.new + s.review === 0) return leave(); // 今天沒有學習紀錄（例：直接開啟網址）
    container.innerHTML = `
      <div class="study study-done">
        <section class="ticket">
          <div class="ticket-band ${lang}"><span>${lang === 'en' ? 'EN · 工作英文' : 'JA · 五十音'}</span><span>COMPLETE</span></div>
          <div class="ticket-body done-body">
            <div class="done-icon ${lang}">${icons.check}</div>
            <h2>今日完成</h2>
            <div class="stats">
              <div class="stat"><span class="stat-label">複習</span><span class="stat-value">${s.review}</span></div>
              <div class="stat"><span class="stat-label">新內容</span><span class="stat-value">${s.new}</span></div>
              <div class="stat"><span class="stat-label">連續</span><span class="stat-value">${getStreak()}<small> 天</small></span></div>
            </div>
          </div>
          <div class="ticket-perf"></div>
          <div class="ticket-foot">
            <button class="btn ghost" type="button" data-browse>再看一次</button>
            <button class="btn ${lang}" type="button" data-close>回今日</button>
          </div>
        </section>
      </div>`;
    container.querySelector('[data-close]').addEventListener('click', leave);
    container.querySelector('[data-browse]').addEventListener('click', () => replace(`study/${lang}/browse`));
  }

  await load();
}

// ---------- 再看一次（瀏覽模式） ----------

async function runBrowse(container, lang) {
  const cards = await getTodayCards(lang);
  let i = 0;
  let flipped = false;
  let row = [];

  if (!cards.length) {
    container.innerHTML = `<div class="study"><p class="page-sub">今天還沒有學過的卡片。</p>
      <button class="btn ${lang}" type="button" data-close>回今日</button></div>`;
    container.querySelector('[data-close]').addEventListener('click', leave);
    return;
  }

  async function show(n) {
    i = n;
    flipped = false;
    row = cards[i].type === 'kana' ? await rowKana(cards[i]) : [];
    draw();
  }

  function draw() {
    if (!container.isConnected || currentRoute() !== 'study') return;
    const item = cards[i];
    const last = i === cards.length - 1;
    container.innerHTML = `
      <div class="study">
        ${topBar(i, cards.length)}
        <span class="kind-tag">再看一次 · 不影響排程</span>
        ${cardHtml({ lang, item, flipped, row })}
        <div class="study-actions browse-nav">
          <button class="btn ghost" type="button" data-prev ${i === 0 ? 'disabled' : ''}>上一張</button>
          <button class="btn ${lang}" type="button" data-next>${last ? '完成' : '下一張'}</button>
        </div>
      </div>`;
    container.querySelector('[data-close]').addEventListener('click', leave);
    container.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(b.dataset.speak === 'example' ? item.example : speechText(item), lang);
    }));
    container.querySelector('.study-card').addEventListener('click', () => { flipped = !flipped; draw(); });
    container.querySelector('[data-prev]').addEventListener('click', () => { stop(); if (i > 0) show(i - 1); });
    container.querySelector('[data-next]').addEventListener('click', () => { stop(); if (last) leave(); else show(i + 1); });
  }

  await show(0);
}

// ---------- 進入點 ----------

function leave() {
  stop();
  replace('today');
}

export async function renderStudy(container, [lang, mode] = []) {
  if (lang !== 'en' && lang !== 'ja') return replace('today');
  container.innerHTML = '<div class="study"><p class="muted">載入中…</p></div>';
  try {
    if (mode === 'browse') await runBrowse(container, lang);
    else await runStudy(container, lang);
  } catch (e) {
    container.innerHTML = `<div class="study"><p class="page-sub">載入失敗：${esc(e.message)}</p>
      <button class="btn ${lang}" type="button">回今日</button></div>`;
    container.querySelector('button').addEventListener('click', () => navigate('today'));
  }
}
