import './styles/main.css';
import logoUrl from './assets/gmb-logo.png';

// HTML 파일을 그대로 import (asset/source)
import layoutHtml from './components/layout.html';
import dashboardHtml from './views/dashboard.html';
import autoHtml from './views/auto.html';
import manualHtml from './views/manual.html';
import resultHtml from './views/result.html';
import settingHtml from './views/settings.html';

import { initAutoEditor } from './autotest/editor';
import { initAutoRun } from './autotest/run';

// 문자열 → DocumentFragment 변환 헬퍼 (템플릿으로 안전하게)
const toFragment = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content;
};

// 1) 레이아웃 장착
const app = document.getElementById('app');
app.appendChild(toFragment(layoutHtml));
document.getElementById('logo').src = logoUrl;

// 2) 라우팅
const routes = {
  dashboard: { title: 'Dashboard', frag: toFragment(dashboardHtml) },
  auto: { title: 'Auto Test', frag: toFragment(autoHtml) },
  manual: { title: 'Manual Test', frag: toFragment(manualHtml) },
  result: { title: 'Result Viewer', frag: toFragment(resultHtml) },
  setting: { title: 'Setting', frag: toFragment(settingHtml) },
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
  const key = location.hash.replace('#/', '') || 'dashboard';
  if (key === 'auto') {
    location.hash = '#/auto/editor';
    return;
  }
  const page = routes[key] || routes.dashboard;
  titleEl.textContent = page.title;
  contentEl.replaceChildren(page.frag.cloneNode(true)); // ← DOM 복제해서 삽입
  setActiveNav(key);
  if (key === 'auto/editor') initAutoEditor();
  if (key === 'auto/run') initAutoRun();
}
window.addEventListener('hashchange', renderRoute);
renderRoute();

// ───── E-STOP 상태 머신 ─────
const EStop = {
  READY: 'ready',
  WARNING: 'warning',
  EMERGENCY: 'emergency',
  LATCHED: 'latched', // = E-STOPPED
};

const estopBtn = document.getElementById('btn-estop');

function labelFor(state) {
  // 버튼 표시는 상태에 따라 바뀜
  switch (state) {
    case EStop.LATCHED:
      return 'RESET';
    default:
      return 'E-STOP';
  }
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
  estopBtn.dataset.state = state;
  estopBtn.textContent = labelFor(state);
  estopBtn.title = titleFor(state);
  // 필요 시 상단 Activity/로그 등과 연동 가능:
  // setCurrentTest('Idle') 등…
}

// 기본 상태
setEStopState(EStop.READY);

// 클릭 동작:
// - READY/WARNING/EMERGENCY → LATCHED
// - LATCHED → READY
estopBtn.addEventListener('click', (e) => {
  const cur = estopBtn.dataset.state;
  if (e.shiftKey) {
    // 개발용 순환 시뮬레이터
    const order = [EStop.READY, EStop.WARNING, EStop.EMERGENCY, EStop.LATCHED];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setEStopState(next);
    return;
  }
  if (cur === EStop.LATCHED) setEStopState(EStop.READY);
  else setEStopState(EStop.LATCHED);
});

// 4) 연결 상태 표시
function setConnection(key, status) {
  const item = document.querySelector(`.conn-item[data-key="${key}"]`);
  if (!item) return;
  item.querySelector('.dot').setAttribute('data-status', status);
  item.querySelector('.text').textContent =
    status === 'connected' ? 'Connected' : 'Disconnected';
}
// 초기 데모 상태
setConnection('sim', 'connected');
setConnection('vs', 'disconnected');

// ── Run Monitor 데모: 클릭 시 Idle → Auto → Manual 순환
const monitorEl = document.getElementById('run-monitor');
const modeChip = document.getElementById('rm-mode');
const statusChip = document.getElementById('rm-status');
const line1 = document.getElementById('rm-line1');
const line2 = document.getElementById('rm-line2');

const Modes = { IDLE: 'idle', AUTO: 'auto', MANUAL: 'manual' };
const Status = { STANDBY: 'Standby', RUNNING: 'Running' };

function setMonitor(mode) {
  monitorEl.dataset.mode = mode;
  switch (mode) {
    case Modes.AUTO:
      modeChip.textContent = 'Auto';
      statusChip.textContent = Status.RUNNING;
      statusChip.removeAttribute('data-level'); // 기본(회색)
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
    default: // IDLE
      modeChip.textContent = 'Idle';
      statusChip.textContent = Status.STANDBY;
      statusChip.removeAttribute('data-level');
      line1.textContent = 'No active test';
      line2.textContent = '—';
  }
}

function cycleMode() {
  const cur = monitorEl.dataset.mode || Modes.IDLE;
  const next =
    cur === Modes.IDLE
      ? Modes.AUTO
      : cur === Modes.AUTO
      ? Modes.MANUAL
      : Modes.IDLE;
  setMonitor(next);
}

monitorEl.addEventListener('click', cycleMode);
setMonitor(Modes.IDLE); // 초기값
