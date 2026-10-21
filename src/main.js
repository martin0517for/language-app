// App 進入點
import { addRoute, startRouter } from './core/router.js';
import { createShell } from './features/shell/shell.js';
import { renderToday } from './features/today/todayView.js';
import { renderLibrary } from './features/library/libraryView.js';
import { renderQuiz } from './features/quiz/quizView.js';
import { renderProgress } from './features/progress/progressView.js';
import { renderSettings } from './features/settings/settingsView.js';

addRoute('today', renderToday);
addRoute('library', renderLibrary);
addRoute('quiz', renderQuiz);
addRoute('progress', renderProgress);
addRoute('settings', renderSettings);

const page = createShell(document.getElementById('app'));
startRouter(page);
