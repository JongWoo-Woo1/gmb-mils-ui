import './styles/main.css';
import logoUrl from './assets/gmb-logo.png';

// HTML
import layoutHtml from './components/layout.html';
import dashboardHtml from './views/dashboard.html';
import autoHtml from './views/auto.html';
import manualHtml from './views/manual.html';
import resultHtml from './views/result.html';
import settingsHtml from './views/settings.html';

// AutoTest views
import editorHtml from './views/autotest/editor.html';
import runHtml from './views/autotest/run.html';

// AutoTest init
import { initAutoEditor } from './autotest/editor';
import { initAutoRun } from './autotest/run';

// Utilities
import { mountSnapshotFab } from './utils/snapshotFab';
import { mountWindowResizer } from './utils/windowResizer';

const toFragment = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content;
};

// Layout
const app = document.getElementById('app');
app.appendChild(toFragment(layoutHtml));
document.getElementById('logo').src = logoUrl;

// Routes
const routes = {
  dashboard: { title: 'Dashboard', frag: toFragment(dashboardHtml) },
  auto: { title: 'Auto Test', frag: toFragment(autoHtml) },
  'auto/editor': {
    title: 'Auto Test — Testcase Editor',
    frag: toFragment(editorHtml),
  },
  'auto/run': { title: 'Auto Test — Run Test', frag: toFragment(runHtml) },
  manual: { title: 'Manual Test', frag: toFragment(manualHtml) },
  result: { title: 'Result Viewer', frag: toFragment(resultHtml) },
  settings: { title: 'Settings', frag: toFragment(settingsHtml) },
};

const titleEl = document.getElementById('view-title');
const contentEl = document.getElementById('content');

function setActiveNav(key) {
  document.querySelectorAll('.nav-btn').forEach((a) => {
    const k = key.startsWith('auto/') ? 'auto' : key;
    a.classList.toggle('is-active', a.dataset.view === k);
  });
}

function renderRoute() {
  let key = location.hash.replace('#/', '') || 'dashboard';
  if (key === 'auto') {
    location.hash = '#/auto/editor';
    return;
  }
  const page = routes[key] || routes.dashboard;
  titleEl.textContent = page.title;
  contentEl.replaceChildren(page.frag.cloneNode(true));
  setActiveNav(key);
  if (key === 'auto/editor') initAutoEditor();
  if (key === 'auto/run') initAutoRun();
}

window.addEventListener('hashchange', renderRoute);
renderRoute();

// Tools
mountSnapshotFab({
  selector: '.lv-frame',
  filename: 'Snapshot',
  size: [1920, 1000],
});
// v2: window-only resizer, VIEW fixed at 1440×1000
mountWindowResizer({
  viewSelector: '.lv-frame',
  viewWidth: 1600,
  viewHeight: 1000,
  windowWidth: 1920,
  minWindow: 1740,
  maxWindow: 2880,
});

// Demo code (unchanged) ...
