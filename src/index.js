// src/index.js
import './styles/main.css';
import logoUrl from './assets/gmb-logo.png';

// HTML (layout + views)
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

// SNAP(PNG) 버튼 — 이미 프로젝트에 있는 유틸
import { mountSnapshotFab } from './utils/snapshotFab';

// ─────────────────────────────────────────────────────────────
// 내부 레일 CSS를 index.js에서 주입(별도 css 파일 없이 동작)
// ─────────────────────────────────────────────────────────────
const RAIL_W = 1600; // ★ 고정 콘텐츠 폭(원하면 1520/1600/1600 등으로 변경)

(function injectRailCSS() {
  const css = `
  :root{ --rail-w: ${RAIL_W}px; }
  #content{ position: relative; overflow: visible; } /* 내부 요소 잘림 방지 */
  .lv-frame{ position: relative; height: 1000px; }   /* 캡처 기준 높이 고정 */
  .lv-rail{
    width: var(--rail-w);
    height: 1000px;
    margin-left: auto;
    margin-right: auto;          /* 메인뷰 내부 중앙 정렬 */
    position: relative;
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();

// 문자열 → DocumentFragment
const toFragment = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content;
};

// 레이아웃 장착
const app = document.getElementById('app');
app.appendChild(toFragment(layoutHtml));
document.getElementById('logo').src = logoUrl;

// 라우트 테이블
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

// 각 뷰를 고정 폭 레일로 감싸 중앙 배치
function wrapWithRail(node) {
  const rail = document.createElement('div');
  rail.className = 'lv-rail';
  rail.appendChild(node);
  return rail;
}

function renderRoute() {
  let key = location.hash.replace('#/', '') || 'dashboard';
  if (key === 'auto') {
    // auto 루트 접근 시 에디터로 유도
    location.hash = '#/auto/editor';
    return;
  }
  const page = routes[key] || routes.dashboard;
  titleEl.textContent = page.title;
  contentEl.replaceChildren(wrapWithRail(page.frag.cloneNode(true))); // ★ 중앙 고정폭 레일
  setActiveNav(key);

  // 뷰별 초기화
  if (key === 'auto/editor') initAutoEditor();
  if (key === 'auto/run') initAutoRun();
}

window.addEventListener('hashchange', renderRoute);
renderRoute();

// SNAP 버튼(1920×1000 캡처 → PNG 저장). selector는 기존 프레임 기준 유지
mountSnapshotFab({
  selector: '.lv-frame',
  filename: 'Snapshot',
  size: [1920, 1000],
});

// ─────────────────────────────────────────────────────────────
// 이하 데모 상태/모니터링 코드(프로젝트에 이미 있던 부분 유지)
// ─────────────────────────────────────────────────────────────
const EStop = {
  READY: 'ready',
  WARNING: 'warning',
  EMERGENCY: 'emergency',
  LATCHED: 'latched',
};
const estopBtn = document.getElementById('btn-estop');
function labelFor(state) {
  return state === EStop.LATCHED ? 'RESET' : 'E-STOP';
}
function titleFor(state) {
  switch (state) {
    case EStop.READY:
      return 'E-Stop: Ready (click to trip)';
    case EStop.WARNING:
      return 'E-Stop: Warning (click to trip)';
    case EStop.EMERGENCY:
      return 'E-Stop: Emergency (click to latch)';
    case EStop.LATCHED:
      return 'E-Stop: Latched (click to reset)';
  }
}
function setEStopState(state) {
  if (!estopBtn) return;
  estopBtn.dataset.state = state;
  estopBtn.textContent = labelFor(state);
  estopBtn.title = titleFor(state);
}
setEStopState(EStop.READY);
estopBtn?.addEventListener('click', (e) => {
  const cur = estopBtn.dataset.state;
  if (e.shiftKey) {
    const order = [EStop.READY, EStop.WARNING, EStop.EMERGENCY, EStop.LATCHED];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setEStopState(next);
    return;
  }
  setEStopState(cur === EStop.LATCHED ? EStop.READY : EStop.LATCHED);
});

// 연결 상태 데모
function setConnection(key, status) {
  const item = document.querySelector(`.conn-item[data-key="${key}"]`);
  if (!item) return;
  item.querySelector('.dot').setAttribute('data-status', status);
  item.querySelector('.text').textContent =
    status === 'connected' ? 'Connected' : 'Disconnected';
}
setConnection('sim', 'connected');
setConnection('vs', 'disconnected');

// Run Monitor 데모
const monitorEl = document.getElementById('run-monitor');
const modeChip = document.getElementById('rm-mode');
const statusChip = document.getElementById('rm-status');
const line1 = document.getElementById('rm-line1');
const line2 = document.getElementById('rm-line2');
const Modes = { IDLE: 'idle', AUTO: 'auto', MANUAL: 'manual' };
const Status = { STANDBY: 'Standby', RUNNING: 'Running' };
function setMonitor(mode) {
  if (!monitorEl) return;
  monitorEl.dataset.mode = mode;
  switch (mode) {
    case Modes.AUTO:
      modeChip.textContent = 'Auto';
      statusChip.textContent = Status.RUNNING;
      statusChip.removeAttribute('data-level');
      line1.textContent = 'Battery_A • TC-0421 • Step 08  Set Voltage 12.0V';
      line2.textContent = 'Case Elapsed 00:18:22  •  Step 8/120 (12%)';
      break;
    case Modes.MANUAL:
      modeChip.textContent = 'Manual';
      statusChip.textContent = Status.STANDBY;
      statusChip.removeAttribute('data-level');
      line1.textContent = 'Manual Action  Jog Axis X+';
      line2.textContent = 'Session Elapsed 00:03:41';
      break;
    default:
      modeChip.textContent = 'Idle';
      statusChip.textContent = Status.STANDBY;
      statusChip.removeAttribute('data-level');
      line1.textContent = 'No active test';
      line2.textContent = '—';
  }
}
function cycleMode() {
  const cur = monitorEl?.dataset.mode || Modes.IDLE;
  const next =
    cur === Modes.IDLE
      ? Modes.AUTO
      : cur === Modes.AUTO
      ? Modes.MANUAL
      : Modes.IDLE;
  setMonitor(next);
}
monitorEl?.addEventListener('click', cycleMode);
setMonitor(Modes.IDLE);
