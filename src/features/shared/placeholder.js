// 尚未製作的分頁：顯示標題與預計加入的功能
export function renderPlaceholder(container, { eyebrow, title, phase, items }) {
  container.innerHTML = `
    <header class="page-header">
      <div>
        <div class="eyebrow">${eyebrow}</div>
        <h1>${title}</h1>
      </div>
    </header>
    <section class="ticket">
      <div class="ticket-band plain"><span>製作中</span><span>${phase}</span></div>
      <div class="ticket-body">
        <ul class="wip-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>
      </div>
    </section>`;
}
