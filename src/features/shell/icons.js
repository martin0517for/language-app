// 線條圖示（SPEC 7.4：不使用 emoji 當介面圖示）
const svg = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  today: svg('<path d="M12 3v2M12 19v2M5 12H3M21 12h-2"/><circle cx="12" cy="12" r="5"/>'),
  library: svg('<rect x="4" y="5" width="13" height="16" rx="2"/><path d="M7 2h11a2 2 0 0 1 2 2v14M8 10h5M8 14h5"/>'),
  quiz: svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l1.5 1.5L12 7M8 15l1.5 1.5L12 14M14 8.5h3M14 15.5h3"/>'),
  progress: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  settings: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>'),
};
