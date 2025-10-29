import './styles/main.css';
import './styles/rail.css';
import './styles/sidebar_fix.css';
import logoUrl from './assets/gmb-logo.png';

import layoutHtml from './components/layout.html';
import dashboardHtml from './views/dashboard.html';
import autoHtml from './views/auto.html';
import manualHtml from './views/manual.html';
import resultHtml from './views/result.html';
import settingsHtml from './views/settings.html';

import editorHtml from './views/autotest/editor.html';
import runHtml from './views/autotest/run.html';

import { initAutoEditor } from './autotest/editor';
import { initAutoRun } from './autotest/run';

import { mountSnapshotFab } from './utils/snapshotFab';
import { mountFrameResizer } from './utils/frameResizer';

// ─────────────────────────────────────────
var RAIL_W = 1600; // 고정 콘텐츠 폭
var RAIL_PAD = 0; // 내부 좌/우 패딩
(function injectVars() {
  var style = document.createElement('style');
  style.textContent =
    ':root{ --rail-w:' + RAIL_W + 'px; --rail-pad:' + RAIL_PAD + 'px; }';
  document.head.appendChild(style);
})();

function toFragment(html) {
  var t = document.createElement('template');
  t.innerHTML = (html || '').trim();
  return t.content;
}

var app = document.getElementById('app');
app.appendChild(toFragment(layoutHtml));
document.getElementById('logo').src = logoUrl;

var routes = {
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

var titleEl = document.getElementById('view-title');
var contentEl = document.getElementById('content');

function setActiveNav(key) {
  var buttons = document.querySelectorAll('.nav-btn');
  for (var i = 0; i < buttons.length; i++) {
    var a = buttons[i];
    var k = key.indexOf('auto/') === 0 ? 'auto' : key;
    a.classList.toggle('is-active', a.getAttribute('data-view') === k);
  }
}

function wrapWithRail(node) {
  var rail = document.createElement('div');
  rail.className = 'lv-rail';
  rail.appendChild(node);
  return rail;
}

// 헤더도 같은 레일 기준으로 정렬
(function alignHeaderInsideRail() {
  if (!titleEl) return;
  var headerRow = titleEl.parentElement;
  if (headerRow) {
    headerRow.classList.add('lv-header-rail');
  }
})();

function renderRoute() {
  var key = location.hash.replace('#/', '') || 'dashboard';
  if (key === 'auto') {
    location.hash = '#/auto/editor';
    return;
  }
  var page = routes[key] || routes.dashboard;
  if (titleEl) titleEl.textContent = page.title;
  if (contentEl)
    contentEl.replaceChildren(wrapWithRail(page.frag.cloneNode(true)));
  setActiveNav(key);
  if (key === 'auto/editor') initAutoEditor();
  if (key === 'auto/run') initAutoRun();
}
window.addEventListener('hashchange', renderRoute);
renderRoute();

// 스냅샷 + 드래그(창 가로폭만 변경, UI는 고정)
mountSnapshotFab({
  selector: '.lv-frame',
  filename: 'Snapshot',
  size: [1920, 1000],
});
mountFrameResizer({
  selector: '.lv-frame',
  initial: 1920,
  height: 1000,
  min: 1920,
  max: 2560,
});

// ----- 데모 상태 코드(문법 호환 버전) -----
var EStop = {
  READY: 'ready',
  WARNING: 'warning',
  EMERGENCY: 'emergency',
  LATCHED: 'latched',
};
var estopBtn = document.getElementById('btn-estop');

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
if (estopBtn) {
  estopBtn.addEventListener('click', function (e) {
    var cur = estopBtn.dataset.state;
    if (e.shiftKey) {
      var order = [EStop.READY, EStop.WARNING, EStop.EMERGENCY, EStop.LATCHED];
      var next = order[(order.indexOf(cur) + 1) % order.length];
      setEStopState(next);
      return;
    }
    setEStopState(cur === EStop.LATCHED ? EStop.READY : EStop.LATCHED);
  });
}

// 연결 상태 표시(백틱 제거)
function setConnection(key, status) {
  var sel = '.conn-item[data-key="' + key + '"]';
  var item = document.querySelector(sel);
  if (!item) return;
  var dot = item.querySelector('.dot');
  var text = item.querySelector('.text');
  if (dot) dot.setAttribute('data-status', status);
  if (text)
    text.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
}
setConnection('sim', 'connected');
setConnection('vs', 'disconnected');

// Run Monitor
var monitorEl = document.getElementById('run-monitor');
var modeChip = document.getElementById('rm-mode');
var statusChip = document.getElementById('rm-status');
var line1 = document.getElementById('rm-line1');
var line2 = document.getElementById('rm-line2');
var Modes = { IDLE: 'idle', AUTO: 'auto', MANUAL: 'manual' };
var Status = { STANDBY: 'Standby', RUNNING: 'Running' };

function setMonitor(mode) {
  if (!monitorEl) return;
  monitorEl.dataset.mode = mode;
  if (mode === Modes.AUTO) {
    if (modeChip) modeChip.textContent = 'Auto';
    if (statusChip) statusChip.textContent = Status.RUNNING;
    if (statusChip) statusChip.removeAttribute('data-level');
    if (line1)
      line1.textContent = 'Battery_A • TC-0421 • Step 08  Set Voltage 12.0V';
    if (line2) line2.textContent = 'Case Elapsed 00:18:22  •  Step 8/120 (12%)';
  } else if (mode === Modes.MANUAL) {
    if (modeChip) modeChip.textContent = 'Manual';
    if (statusChip) statusChip.textContent = Status.STANDBY;
    if (statusChip) statusChip.removeAttribute('data-level');
    if (line1) line1.textContent = 'Manual Action  Jog Axis X+';
    if (line2) line2.textContent = 'Session Elapsed 00:03:41';
  } else {
    if (modeChip) modeChip.textContent = 'Idle';
    if (statusChip) statusChip.textContent = Status.STANDBY;
    if (statusChip) statusChip.removeAttribute('data-level');
    if (line1) line1.textContent = 'No active test';
    if (line2) line2.textContent = '—';
  }
}
function cycleMode() {
  if (!monitorEl) return;
  var cur = monitorEl.dataset.mode || Modes.IDLE;
  var next =
    cur === Modes.IDLE
      ? Modes.AUTO
      : cur === Modes.AUTO
      ? Modes.MANUAL
      : Modes.IDLE;
  setMonitor(next);
}
if (monitorEl) {
  monitorEl.addEventListener('click', cycleMode);
  setMonitor(Modes.IDLE);
}
