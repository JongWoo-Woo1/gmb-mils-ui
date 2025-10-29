# Code Snapshot

- commit: 917f27f  (branch: main)
- generated: 2025-10-29 03:41:37
- include: src, tools + package.json, webpack.config.js
- exclude dirs: node_modules, dist, docs, .git, .github, assets
- exclude files: package-lock.json
- allow ext: .js, .mjs, .cjs, .ts, .tsx, .jsx, .json, .html, .css, .scss, .md, .yml, .yaml  (binary & others excluded)
- limits: file ≤ 200KB, ≤ 800 lines

## Directory Tree

**src/**
```
├─autotest
│ ├─editor.js
│ └─run.js
├─components
│ └─layout.html
├─index.html
├─index.js
├─styles
│ ├─autotest
│ │ ├─editor.css
│ │ └─run.css
│ ├─base.css
│ ├─cards.css
│ ├─connections.css
│ ├─layout.css
│ ├─main.css
│ ├─monitor.css
│ ├─nav.css
│ ├─rail.css
│ ├─responsive.css
│ ├─shell.css
│ ├─sidebar_fix.css
│ ├─table.css
│ ├─tokens.css
│ └─toolbar.css
├─utils
│ ├─frameResizer.js
│ ├─snapshotFab.js
│ └─windowResizer.js
└─views
  ├─auto.html
  ├─autotest
  │ ├─editor.html
  │ └─run.html
  ├─dashboard.html
  ├─manual.html
  ├─result.html
  └─settings.html
```

**tools/**
```
├─export-ui-review.mjs
├─make-code-snapshot.mjs
├─review-commit.mjs
└─review.mjs
```

**package.json**

**webpack.config.js**

## Files

### package.json
```json
{
  "name": "gmb-mils-ui",
  "version": "0.1.1",
  "private": true,
  "scripts": {
    "start": "webpack serve --mode development",
    "review": "node tools/review.mjs",
    "build": "webpack --mode production",
    "code:snapshot": "node tools/make-code-snapshot.mjs"
  },
  "devDependencies": {
    "css-loader": "^6.10.0",
    "html-webpack-plugin": "^5.6.0",
    "puppeteer-core": "^24.26.1",
    "style-loader": "^3.3.4",
    "webpack": "^5.94.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.2"
  },
  "dependencies": {
    "html2canvas": "^1.4.1"
  }
}

```

### src\autotest\editor.js
```js
export function initAutoEditor(){
  const root = document.querySelector('.at-root');
  if(!root) return;

  const fileInput = root.querySelector('#at-file');
  const fileName  = root.querySelector('#at-file-name');
  const body      = root.querySelector('#at-step-body');

  function addRow(values=['', '', '', '']){
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="cell"><input type="number" min="1" value="${values[0] ?? ''}" /></div>
      <div class="cell"><input value=\"${values[1] ?? ''}\" /></div>
      <div class="cell"><input value=\"${values[2] ?? ''}\" /></div>
      <div class="cell"><input value=\"${values[3] ?? ''}\" /></div>`;
    body.appendChild(row);
  }

  // 초기 3행
  ['1','2','3'].forEach(n => addRow([n, '', '', '']));

  // 파일 임포트 (CSV 간이 미리보기)
  fileInput?.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if(!f) return;
    fileName.textContent = f.name;
    if (/\.csv$/i.test(f.name)) {
      const rd = new FileReader();
      rd.onload = () => {
        // 간단 CSV 파서 (쉼표 기준, 첫줄 헤더 스킵)
        const lines = String(rd.result).split(/\r?\n/).filter(Boolean);
        const rows  = lines.slice(1).map(s => s.split(','));
        body.replaceChildren();
        rows.slice(0, 50).forEach(r => addRow([r[0], r[1], r[2], r[3]]));
      };
      rd.readAsText(f);
    } else {
      // XLSX/XLS는 후속에 SheetJS 등 연동
      alert('XLSX 미리보기는 추후 연동 예정입니다. CSV로 임시 확인 가능합니다.');
    }
  });

  root.querySelector('#at-add-row')?.addEventListener('click', () => {
    // 마지막 Step 값 +1 자동
    const last = body.querySelector('.row:last-child input[type=\"number\"]')?.value;
    const next = String((parseInt(last || '0', 10) || 0) + 1);
    addRow([next, '', '', '']);
  });

  root.querySelector('#at-validate')?.addEventListener('click', () => {
    // Step 정수 & 공란 허용 안 함
    const ok = [...body.querySelectorAll('.row')].every(row => {
      const v = row.querySelector('.cell:first-child input')?.value?.trim();
      return /^\d+$/.test(v);
    });
    alert(ok ? 'Validation OK' : 'Step 번호 오류가 있습니다.');
  });

  root.querySelector('#at-export')?.addEventListener('click', () => {
    const rows = [...body.querySelectorAll('.row')].map(row =>
      [...row.querySelectorAll('input')].map(i => i.value.replace(/,/g,''))
    );
    const csv = ['Step,Input1,Input2,Expected', ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'TestCase.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  root.querySelector('#at-go-run')?.addEventListener('click', () => {
    location.hash = '#/auto/run';
  });
}

```

### src\autotest\run.js
```js
export function initAutoRun(){
  const root = document.querySelector('.at-run-root');
  if(!root) return;

  const stepsEl = root.querySelector('#rt-steps');
  const bar = root.querySelector('#rt-progress > i');
  const pctEl = root.querySelector('#rt-pct');

  // 데모 스텝 목록 (실제론 Editor/파일에서 로딩)
  const steps = Array.from({length: 30}, (_,i)=>`Step ${i+1}  •  Do something`);
  stepsEl.replaceChildren(...steps.map((t)=> {
    const li = document.createElement('li'); li.textContent = t; return li;
  }));

  const indV = root.querySelector('#ind-v');
  const indI = root.querySelector('#ind-i');
  const indT = root.querySelector('#ind-t');
  const indStep = root.querySelector('#ind-step');

  // 간단 캔버스 렌더(임시)
  const canvas = root.querySelector('#rt-canvas');
  const ctx = canvas?.getContext('2d');

  let idx = 0, prog = 0, timer = null;
  function tick(){
    prog = Math.min(100, prog + 0.5);
    idx = Math.min(steps.length-1, Math.floor((prog/100)*steps.length));
    bar.style.width = prog + '%';
    if (pctEl) pctEl.textContent = Math.round(prog) + '%';

    // 스텝 하이라이트
    [...stepsEl.children].forEach((li,i)=> li.classList.toggle('is-active', i===idx));
    indStep.textContent = `${idx+1}/${steps.length}`;

    // 인디케이터
    const v = +(12 + Math.sin(prog/8)).toFixed(2);
    const i = 450 + ((Math.random()*20) | 0);
    const t = +(25 + Math.cos(prog/10)).toFixed(1);
    indV.textContent = `${v} V`; indI.textContent = `${i} mA`; indT.textContent = `${t} °C`;

    // 그래프
    if(ctx){
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = '#e5e7eb'; ctx.strokeRect(0,0,canvas.width,canvas.height);
      ctx.beginPath();
      for(let x=0;x<canvas.width;x++){
        const y = 150 + 40*Math.sin((x+prog*3)/30);
        if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.strokeStyle = '#ef4444'; ctx.stroke();
    }

    if (prog >= 100){ clearInterval(timer); }
  }

  root.querySelector('#rt-load')?.addEventListener('click', ()=> {
    alert('Load Test Case (실제 로딩 로직 연동 지점)');
  });
  root.querySelector('#rt-start')?.addEventListener('click', ()=> {
    clearInterval(timer); prog = 0; idx = 0; if (pctEl) pctEl.textContent = '0%'; bar.style.width='0%';
    tick(); timer = setInterval(tick, 50);
  });
  root.querySelector('#rt-stop')?.addEventListener('click', ()=> {
    clearInterval(timer); bar.style.width = '0%'; if (pctEl) pctEl.textContent = '0%';
    [...stepsEl.children].forEach(li=> li.classList.remove('is-active'));
    indStep.textContent = '—';
  });
}

```

### src\components\layout.html
```html
<aside class="sidebar">
  <header class="brand-bar">
    <a href="#/dashboard" aria-label="GMB Home" class="brand">
      <img id="logo" alt="GMB Logo" />
    </a>
  </header>

  <nav class="nav">
    <a class="nav-btn" data-view="dashboard" href="#/dashboard">DASHBOARD</a>
    <a class="nav-btn" data-view="auto" href="#/auto/editor">AUTO TEST</a>
    <a class="nav-btn" data-view="manual" href="#/manual">MANUAL TEST</a>
    <a class="nav-btn" data-view="result" href="#/result">RESULT VIEWER</a>
    <a class="nav-btn" data-view="settings" href="#/settings">SETTINGS</a>
  </nav>

  <!-- ▼ Run Monitor : 클릭 시 Idle→Auto→Manual 토글 (데모) -->
  <section
    class="run-monitor"
    id="run-monitor"
    data-mode="idle"
    title="Click to toggle (Idle → Auto → Manual)"
  >
    <div class="rm-title">Run Monitor</div>
    <div class="rm-row chips">
      <span class="chip chip-mode" id="rm-mode">Idle</span>
      <span class="chip chip-status" id="rm-status">Standby</span>
    </div>
    <div class="rm-row" id="rm-line1">No active test</div>
    <div class="rm-row mono" id="rm-line2">—</div>
  </section>

  <div class="connections">
    <div class="conn-title">CONNECTIONS</div>
    <div class="conn-item" data-key="sim">
      <span class="label">SIMULATOR</span>
      <span class="status"
        ><span class="dot" data-status="connected"></span
        ><span class="text">Connected</span></span
      >
    </div>
    <div class="conn-item" data-key="vs">
      <span class="label">VeriStand</span>
      <span class="status"
        ><span class="dot" data-status="disconnected"></span
        ><span class="text">Disconnected</span></span
      >
    </div>
  </div>
</aside>

<main class="main">
  <header class="toolbar">
    <h1 id="view-title">Dashboard</h1>
    <div class="toolbar-right">
      <button
        id="btn-estop"
        class="btn estop"
        data-state="ready"
        title="E-Stop: Ready"
      >
        E-STOP
      </button>
      <button class="btn ghost" id="btn-exit" title="Exit Program">Exit</button>
    </div>
  </header>

  <section class="content" id="content"></section>
</main>

```

### src\index.html
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GMB HIL Controller</title>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <!-- ⬇⬇ LabVIEW 고정 프레임(중앙 정렬) ⬇⬇ -->
    <div class="lv-stage">
      <div class="lv-frame">
        <div id="app" class="app"></div>
      </div>
    </div>
    <!-- ⬆⬆ -->
  </body>
</html>

```

### src\index.js
```js
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

```

### src\styles\autotest\editor.css
```css
.at-tabs { display:flex; gap:8px; margin-bottom:12px; }
.tab { padding:8px 12px; border:1px solid var(--line); background:#fff; font-size:13px; }
.tab.is-active { border-color: var(--brand-red); }

.at-top-grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
.drop { border:1px dashed var(--line); background:#fff; padding:14px; text-align:center; }
.btn-row { display:flex; gap:8px; margin-top:10px; }
.kv .row{ display:grid; grid-template-columns: 200px 1fr 80px; }
.kv .head{ background:#fafafa; font-weight:700; border-bottom:1px solid var(--line); }
.kv .cell{ padding:8px 10px; border-bottom:1px solid var(--line-soft); }
.kv input{ width:100%; height:32px; padding:0 8px; border:1px solid var(--line); background:#fff; font:inherit; }

.at-steps .grid{ display:grid; grid-template-columns: 100px 1fr 1fr 1fr; }
.at-steps .head{ background:#fafafa; font-weight:700; border:1px solid var(--line); border-bottom:none; }
#at-step-body .row{ display:grid; grid-template-columns: 100px 1fr 1fr 1fr; border:1px solid var(--line); border-top:none; }
#at-step-body .cell{ padding:8px 10px; border-right:1px solid var(--line-soft); }
#at-step-body .cell:first-child input{ text-align:center; } /* Step 입력 가독성 */
#at-step-body .cell:last-child{ border-right:none; }
#at-step-body input{ width:100%; height:30px; padding:0 8px; border:1px solid var(--line); background:#fff; font:inherit; }

```

### src\styles\autotest\run.css
```css
.at-tabs { display:flex; gap:8px; margin-bottom:12px; }
.tab { padding:8px 12px; border:1px solid var(--line); background:#fff; font-size:13px; }
.tab.is-active { border-color: var(--brand-red); }

.at-ctrl .btn-row{ display:flex; gap:8px; }
.progress{
  border:1px solid var(--line);
  height:20px;                /* ↑ 더 두껍게 */
  margin-top:10px; position:relative; background:#fff;
}
.progress>i{
  position:absolute; left:0; top:0; bottom:0; width:0%; background:var(--brand-red);
}
.progress .pct{
  position:absolute; right:8px; top:50%; transform:translateY(-50%);
  font-size:12px; color:var(--ink-700);
}

.at-run-grid{ display:grid; grid-template-columns: 1.6fr 1fr; gap:16px; margin-top:12px; }
.at-chart{ padding:12px; }
.chart{ border:1px solid var(--line); background:#fff; padding:10px; display:grid; place-items:center; }

.step-list{ margin:0; padding-left:18px; max-height:360px; overflow:auto; }
.step-list li{ padding:6px 0; border-bottom:1px solid var(--line-soft); }
.step-list li.is-active{
  font-weight:700;
  border-left:3px solid var(--brand-red);
  background:#fff8f8;
  padding-left:9px;           /* 좌측 강조선 보정 */
}

.at-ind .ind-grid{ display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-top:8px; }
.ind{ border:1px solid var(--line); background:#fff; padding:10px; }
.ind .k{ font-size:12px; color:var(--ink-500); }
.ind .v{ font-size:20px; font-weight:700; margin-top:2px; } /* 값 크기 ↑ */

```

### src\styles\base.css
```css
* {
  box-sizing: border-box;
}
html,
body {
  height: 100%;
}
body {
  margin: 0;
  font-family: 'Noto Sans KR', 'Malgun Gothic', 'Segoe UI', system-ui,
    -apple-system, sans-serif;
  font-size: 16px;
  color: var(--ink-900);
  background: var(--bg);
}
a {
  color: inherit;
  text-decoration: none;
}

.caption {
  font-size: 12px;
  color: var(--ink-500);
  letter-spacing: 0.2px;
}
.muted {
  color: var(--ink-500);
}
.mono {
  font-family: Consolas, 'Courier New', ui-monospace, monospace;
  letter-spacing: 0.2px;
}

```

### src\styles\cards.css
```css
.card {
  background: #fff;
  border: 1px solid var(--line);
  padding: 24px;
}
.card h2 {
  margin: 0 0 var(--space-3) 0;
  font-size: 18px;
  padding-top: var(--space-1);
  border-top: 1px solid var(--line-soft); /* 은은한 top-rule */
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.tile {
  height: 120px;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  background: #fff;
}

```

### src\styles\connections.css
```css
.connections {
  margin-top: auto; /* 남은 공간을 위로 밀어 '바닥 고정' */
  border: 1px solid var(--line);
  background: #fff;
  padding: 12px;
  margin-bottom: 0; /* 0으로 바닥에 딱 붙임 */
}
.conn-title {
  font-size: 12px;
  color: var(--ink-500);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.conn-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 6px;
}
.conn-item + .conn-item {
  margin-top: 6px;
}
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-700);
}
.dot {
  width: 10px;
  height: 10px;
  border: 1px solid #d1d5db;
  background: #d1d5db;
}
.dot[data-status='connected'] {
  background: #16a34a;
  border-color: #16a34a;
}
.dot[data-status='disconnected'] {
  background: #ef4444;
  border-color: #ef4444;
}

```

### src\styles\layout.css
```css
/* src/styles/layout.css — 사이드바 그리드화로 Connections 하단 정렬 안정화 */
.app {
  display: grid;
  grid-template-columns: 260px 1fr;
  width: 100%;
  height: 100%;
}

/* 사이드바: grid로 재구성 (상단 Brand, 중간 Nav+RunMonitor, 하단 Connections) */
.sidebar {
  background: var(--white);
  border-right: 1px solid var(--line);
  display: grid;
  grid-template-rows: auto 1fr auto auto; /* brand | nav(스크롤) | run-monitor | connections */
  gap: 12px;
  padding: 14px;
  height: 100%; /* 프레임 높이에 맞춤 */
  overflow: hidden; /* 내부 스크롤은 nav에서 처리 */
}
.brand-bar{
  display:flex; align-items:center; justify-content:center;
  padding: 10px 6px 10px; border-bottom: 1px solid var(--line);
}
.brand{ display:inline-flex; align-items:center; justify-content:center; width:100%; }
.brand img{ width: 140px; height:auto; display:block; object-fit:contain; }

.nav{
  display:flex; flex-direction:column; gap:10px; margin-top:12px;
  overflow:auto; min-height: 0; /* grid item이 높이 줄어들 수 있게 */
}
.nav-btn{
  display:flex; align-items:center;
  border: 1px solid var(--line); background:#fff;
  font-weight:700; cursor:pointer; position:relative;
  height:56px; font-size:18px; padding:0 18px;
}
.nav-btn:is(:hover, :focus-visible){ outline:none; border-color:var(--brand-red); background:#f8fafc; }
.nav-btn.is-active{ border-color: var(--line); box-shadow: inset var(--stripe-w) 0 0 0 var(--brand-red); background:#fff; color:var(--ink-900); }

/* Run Monitor는 고정 높이로, 연결부와 겹치지 않게 별 행에 둠 */
.run-monitor{ border:1px solid var(--line); background:#fff; padding:14px; height:360px; display:flex; flex-direction:column; }

/* Connections는 마지막 행: 자연스런 하단 정렬, 넘침 방지 */
.connections{ border:1px solid var(--line); background:#fff; padding:12px; margin:0; align-self:end; }

.main{
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.content{ display:grid; gap:20px; }

```

### src\styles\main.css
```css
/* main.css — 이 순서를 권장 (토큰 → 셸 → 나머지) */
@import './tokens.css';
@import './shell.css';

@import './base.css';
@import './layout.css';
@import './nav.css';
@import './connections.css';
@import './toolbar.css';
@import './cards.css';
@import './table.css';
@import './responsive.css';
@import './monitor.css';

@import './autotest/editor.css';
@import './autotest/run.css';

```

### src\styles\monitor.css
```css
.run-monitor {
  border: 1px solid var(--line);
  background: #fff;

  padding: 14px;
  margin-top: 12px; /* nav와 간격 약간 확보 */
  height: 360px; /* ← 고정 높이(필요시 320~400 조절) */
  display: flex;
  flex-direction: column;
}

.rm-title {
  font-size: 13px;
  color: var(--ink-500);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.rm-row {
  font-size: 15px;
  color: var(--ink-700);
  line-height: 1.28;
}
.rm-row .rm-row {
  margin-top: 4px;
}
.mono {
  font-family: Consolas, 'Courier New', ui-monospace, monospace;
  letter-spacing: 0.2px;
}

.chips {
  display: flex;
  gap: 8px;
  align-items: center;
}
.chip {
  display: inline-block;
  border: 1px solid var(--line);
  background: #fff;
  font-weight: 700;
  line-height: 1;
  font-size: 13px;
  padding: 4px 10px;
}

#rm-line1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ▼ AUTO TEST 섹션(스크롤 영역 포함) */
.rm-subtitle {
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-500);
  letter-spacing: 0.3px;
  text-transform: uppercase;
  border-top: 1px solid var(--line);
  padding-top: 8px;
}
.rm-scroll {
  margin-top: 6px;
  overflow: auto; /* 고정 높이 내에서 리스트 스크롤 */
}
.rm-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.rm-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  padding: 6px 8px;
  font-size: 13px;
  background: #fff;
}
.rm-item .task {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rm-item .meta {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--ink-600);
}

```

### src\styles\nav.css
```css
.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.nav-btn {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  background: #fff;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  height: 56px;
  font-size: 18px;
  padding: 0 18px;
}
.nav-btn:is(:hover, :focus-visible) {
  outline: none;
  border-color: var(--brand-red);
  background: #f8fafc;
}
.nav-btn.is-active {
  border-color: var(--line);
  box-shadow: inset var(--stripe-w) 0 0 0 var(--brand-red);
  background: #fff;
  color: var(--ink-900);
}

```

### src\styles\rail.css
```css
:root{ --rail-w:1600px; --rail-pad:40px; }
.lv-header-rail{ width:var(--rail-w); margin:0 auto; padding:0 var(--rail-pad); display:flex; align-items:center; gap:12px; }
#content{ position:relative; overflow:visible; }
.lv-frame{ position:relative; height:1000px; }
.lv-rail{ width:var(--rail-w); height:1000px; margin:0 auto; position:relative; padding:0 var(--rail-pad); }
```

### src\styles\responsive.css
```css
@media (max-width: 1200px) {
  .app {
    grid-template-columns: 220px 1fr;
  }
  :root {
    --logo-w: 120px;
  }
}

```

### src\styles\shell.css
```css
:root {
  /* LabVIEW 창 크기에 맞춘 고정 프레임 */
  --panel-w: 1920px;
  --panel-h: 1000px;

  --shell-bg: #eceff3;
  --frame-border: #cfd6dd;
}

.lv-stage {
  min-height: 100vh;
  display: grid;
  place-items: center; /* 창 가운데 배치 */
  background: var(--shell-bg);
  padding: 12px; /* 외곽 여백(미리보기용) */
}

.lv-frame {
  width: var(--panel-w);
  height: var(--panel-h);
  background: var(--bg);
  border: 1px solid var(--frame-border);
  border-radius: 0;
  box-shadow: none;
  overflow: hidden; /* 내부 스크롤 방지 */
}

```

### src\styles\sidebar_fix.css
```css
.sidebar{ display:flex; flex-direction:column; height:1000px; overflow:hidden; gap:12px; }
.nav{ flex:1 1 auto; overflow:auto; min-height:0; }
.run-monitor{ flex:0 0 auto; }
.connections{ margin-top:auto; flex:0 0 auto; }
```

### src\styles\table.css
```css
.table-like {
  border: 1px solid var(--line);
  background: #fff;
}
.table-like .row {
  display: grid;
  grid-template-columns: 180px 1fr 140px 120px;
}
.table-like .row.head {
  background: #fafafa;
  font-weight: 700;
  border-bottom: 1px solid var(--line);
}
.table-like .row > div {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line-soft);
}
.table-like .row:last-child > div {
  border-bottom: none;
}

/* ⬇ 미세 hover로 층위감 */
.table-like .row:not(.head):hover {
  background: #fafafa;
}

/* 시간/케이스를 고정폭 숫자체로 */
.table-like .row > div:nth-child(1),
.table-like .row > div:nth-child(2) {
  font-family: Consolas, 'Courier New', ui-monospace, monospace;
  letter-spacing: 0.2px;
}

.pass {
  color: #15803d;
  font-weight: 700;
}
.fail {
  color: #b91c1c;
  font-weight: 700;
}

```

### src\styles\tokens.css
```css
:root {
  --brand-red: #c8102e;
  --brand-red-700: #ab0e27;
  --danger: #991b1b;
  --ink-900: #171717;
  --ink-700: #2d2d2d;
  --ink-500: #6b7280;

  /* line 계층: 외곽, 내부 구분 */
  --line: #e5e7eb; /* 컨테이너 외곽선 */
  --line-soft: #f0f2f5; /* 내부 구분선/섹션 바 */

  --bg: #f6f7f9;
  --white: #fff;

  /* 각진 */
  --radius: 0;

  /* 여백(밀도 ↓ 10~15%) */
  --space-1: 6px;
  --space-2: 10px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;

  --logo-w: 128px;
  --stripe-w: 4px;

  --state-amber: #f59e0b;
  --state-amber-900: #7c2d12;
  --state-red-dark: #7f1d1d;
}

```

### src\styles\toolbar.css
```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
#view-title {
  font-size: 28px;
  margin: 0;
}
.toolbar-right {
  gap: 16px;
}

.btn {
  border: 1px solid var(--line);
  font-weight: 700;
  font-size: 16px;
  background: #fff;
  cursor: pointer;
  height: 46px;
  padding: 0 20px;
}

/* ▼ E-STOP 인디케이터+토글 (각진) */
.btn.estop {
  min-width: 120px;
}

/* READY: 흰배경 + 레드 테두리 → ‘누르면 정지’ */
.btn.estop[data-state='ready'] {
  background: #fff;
  color: var(--brand-red);
  border-color: var(--brand-red);
}

/* WARNING: 옅은 앰버 배경 */
.btn.estop[data-state='warning'] {
  background: #fff7ed;
  color: var(--state-amber-900);
  border-color: var(--state-amber);
}

/* EMERGENCY: 강한 레드 채움(정지 루틴 진행 중) */
.btn.estop[data-state='emergency'] {
  background: var(--brand-red);
  color: #fff;
  border-color: var(--brand-red);
}

/* E-STOPPED(래치): 더 어두운 레드 계열, 버튼 라벨은 RESET으로 바뀜 */
.btn.estop[data-state='latched'] {
  background: var(--state-red-dark);
  color: #fff;
  border-color: var(--state-red-dark);
}

.btn.ghost {
  background: #fff;
  color: var(--ink-700);
}

```

### src\utils\frameResizer.js
```js
// Horizontal Resizer for the 1920×1000 preview frame (.lv-frame)
export function mountFrameResizer(opts={}){
  const {
    selector = '.lv-frame',
    initial = 1920,
    height = 1000,
    min = 1320,
    max = 2560
  } = opts;

  const frame = document.querySelector(selector);
  if(!frame){ console.warn('[FrameResizer] target not found:', selector); return; }

  frame.style.position = frame.style.position || 'relative';
  frame.style.marginLeft = 'auto';
  frame.style.marginRight = 'auto';
  frame.style.width = initial + 'px';
  frame.style.height = height + 'px';

  const css = `
    .lv-resize-handle{
      position:absolute; top:0; right:-6px; width:12px; height:100%;
      cursor: ew-resize; z-index: 2000;
      background: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,.06) 100%);
      border-left: 1px solid var(--line);
    }
    .lv-resize-handle::after{
      content:''; position:absolute; top:50%; left:50%; transform: translate(-50%,-50%);
      width:4px; height:40px; border-radius:2px; background: rgba(0,0,0,.2);
      box-shadow: -6px 0 0 rgba(0,0,0,.12), 6px 0 0 rgba(0,0,0,.12);
      opacity:.25;
    }
    .lv-size-hud{
      position:absolute; top:8px; right:16px; z-index:2100;
      padding:4px 8px; background:#000; color:#fff; font-size:12px; border-radius:4px;
      opacity:.8; pointer-events:none;
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const handle = document.createElement('div');
  handle.className = 'lv-resize-handle';
  frame.appendChild(handle);

  const hud = document.createElement('div');
  hud.className = 'lv-size-hud';
  hud.textContent = `${initial} × ${height}`;
  frame.appendChild(hud);

  let dragging = false;
  let startX = 0;
  let startW = initial;

  function setWidth(w){
    const clamped = Math.max(min, Math.min(max, Math.round(w)));
    frame.style.width = clamped + 'px';
    hud.textContent = `${clamped} × ${height}`;
    return clamped;
  }

  handle.addEventListener('mousedown', (e)=>{
    e.preventDefault();
    dragging = true; startX = e.clientX; startW = frame.clientWidth;
    document.body.style.userSelect = 'none';
    hud.style.opacity = '0.9';
  });
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX;
    setWidth(startW + dx);
  });
  window.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
    hud.style.opacity = '0.8';
  });

  handle.addEventListener('dblclick', ()=> setWidth(initial));
  handle.tabIndex = 0;
  handle.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft') setWidth(frame.clientWidth - 10);
    if(e.key === 'ArrowRight') setWidth(frame.clientWidth + 10);
    if(e.key.toLowerCase() === 'r') setWidth(initial);
  });

  window.__setFrameWidth = setWidth;
}

```

### src\utils\snapshotFab.js
```js
// Bottom-right SNAP button (PNG export, 1920x1000)
// NOTE: Now exports PNG instead of PDF and auto-names files by current route.
// Requires: html2canvas
import html2canvas from 'html2canvas';

/**
 * Install floating SNAP button at bottom-right to export a 1920x1000 PNG.
 * CSS is injected automatically; no main.css edits required.
 * - AutoTest filenames:
 *    - #/auto/editor → 'snapshot_autotest_tescase editor.png'
 *    - #/auto/run    → 'snapshot_autotest_run test.png'
 */
export function mountSnapshotFab(opts={}){
  const {
    selector = '.lv-frame',
    size = [1920, 1000],
    // filename: optional fallback for non-AutoTest pages
    filename = 'Snapshot'
  } = opts;

  if (document.getElementById('at-snap-fab')) return;

  // Inject minimal CSS
  const css = `
  .at-snap-fab{
    position: fixed; right: 20px; bottom: 20px;
    width: 60px; height: 60px; border-radius: 9999px;
    border: 1px solid var(--line); background: var(--brand-red); color: #fff;
    display: grid; place-items: center; font-weight: 700; font-size: 12px;
    cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.15); z-index: 9999;
  }
  .at-snap-fab:hover{ filter: brightness(.95); }
  .at-snap-fab[aria-busy="true"]{ opacity: .7; pointer-events: none; }
  .at-snap-fab span{ pointer-events: none; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Create button
  const btn = document.createElement('button');
  btn.className = 'at-snap-fab';
  btn.id = 'at-snap-fab';
  btn.type = 'button';
  btn.title = 'Capture current view (1920×1000 PNG)';
  btn.innerHTML = '<span>SNAP</span>';
  document.body.appendChild(btn);

  function setBusy(v){ v ? btn.setAttribute('aria-busy','true') : btn.removeAttribute('aria-busy'); }
  function resolveTarget(){
    return document.querySelector(selector) || document.querySelector('#content') || document.querySelector('.app') || document.body;
  }
  function routeBasedName(){
    const h = location.hash || '';
    if (h.includes('/auto/editor')) return 'snapshot_autotest_tescase editor';
    if (h.includes('/auto/run'))    return 'snapshot_autotest_run test';
    return filename || 'Snapshot';
  }

  async function capture(){
    const [W,H] = size;
    const el = resolveTarget();
    if(!el){ alert('Capture target not found.'); return; }
    setBusy(true);
    try{
      window.scrollTo(0,0);
      const canvas = await html2canvas(el, { backgroundColor:'#ffffff', useCORS:true, scale:1, windowWidth:W, windowHeight:H });

      // Normalize to exact 1920x1000 (cover-fit)
      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      const ctx = out.getContext('2d');
      const sw = canvas.width, sh = canvas.height;
      const scale = Math.max(W/sw, H/sh);
      const dw = Math.round(sw*scale), dh = Math.round(sh*scale);
      const dx = Math.round((W-dw)/2), dy = Math.round((H-dh)/2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,W,H);
      ctx.drawImage(canvas, 0,0, sw,sh, dx,dy, dw,dh);

      const dataUrl = out.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = routeBasedName() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }catch(err){
      console.error(err);
      alert('SNAP 실패 (콘솔 확인)');
    }finally{
      setBusy(false);
    }
  }

  btn.addEventListener('click', capture);
}

```

### src\utils\windowResizer.js
```js
// Window-only Horizontal Resizer v2 (outer width only)
// - Keeps VIEW fixed (PNG cards, borders) at viewWidth × viewHeight
// - Resizes ONLY the outer window (.lv-window) to simulate left/right gutters
// - More robust handle placement & dragging (pointer events), container overflow visible

export function mountWindowResizer(opts={}){
  const {
    viewSelector = '.lv-frame',
    viewWidth = 1440,          // widened default
    viewHeight = 1000,
    windowWidth = 1920,
    minWindow = 300 + 1440,    // NAV 300 + VIEW 1440
    maxWindow = 2880
  } = opts;

  const view = document.querySelector(viewSelector);
  if(!view){ console.warn('[WindowResizer] view not found:', viewSelector); return; }

  // Ensure the main content container doesn't clip the handle.
  const content = document.getElementById('content');
  if(content){ content.style.overflow = 'visible'; content.style.position = content.style.position || 'relative'; }

  // Create wrapper .lv-window around the fixed VIEW
  let win = view.closest('.lv-window');
  if(!win){
    win = document.createElement('div');
    win.className = 'lv-window';
    view.parentNode.insertBefore(win, view);
    win.appendChild(view);
  }

  // Style injection
  const css = `
    .lv-window{
      position: relative;
      margin: 0 auto;
      width: ${windowWidth}px;           /* OUTER window width */
      height: ${viewHeight}px;
      background: transparent;
      box-sizing: content-box;
      z-index: 1;                         /* under handle/hud */
    }
    .lv-window > ${viewSelector}{
      width: ${viewWidth}px;              /* FIXED VIEW */
      height: ${viewHeight}px;
      margin-left: auto;
      margin-right: auto;
      position: relative;
    }
    .lvw-resize-handle{
      position:absolute; top:0; right:-12px; width: 24px; height:100%;
      cursor: ew-resize; z-index: 4000;
      background: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,.06) 100%);
      border-left: 1px solid var(--line);
    }
    .lvw-resize-handle::after{
      content:''; position:absolute; top:50%; left:50%; transform: translate(-50%,-50%);
      width:6px; height:44px; border-radius:3px; background: rgba(0,0,0,.2);
      box-shadow: -8px 0 0 rgba(0,0,0,.12), 8px 0 0 rgba(0,0,0,.12);
      opacity:.25;
    }
    .lvw-size-hud{
      position:absolute; top:8px; right:16px; z-index:4100;
      padding:4px 8px; background:#000; color:#fff; font-size:12px; border-radius:4px;
      opacity:.8; pointer-events:none;
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Create handle + HUD once
  let handle = win.querySelector('.lvw-resize-handle');
  if(!handle){
    handle = document.createElement('div');
    handle.className = 'lvw-resize-handle';
    win.appendChild(handle);
  }
  let hud = win.querySelector('.lvw-size-hud');
  if(!hud){
    hud = document.createElement('div');
    hud.className = 'lvw-size-hud';
    win.appendChild(hud);
  }

  function setWindowWidth(w){
    const clamped = Math.max(minWindow, Math.min(maxWindow, Math.round(w)));
    win.style.width = clamped + 'px';
    hud.textContent = `${clamped} × ${viewHeight}`;
    return clamped;
  }
  setWindowWidth(windowWidth);            // initialize
  view.style.width = viewWidth + 'px';    // VIEW stays fixed
  view.style.height = viewHeight + 'px';

  // Pointer-based drag
  let startX = 0;
  let startW = windowWidth;

  function onPointerDown(e){
    e.preventDefault();
    startX = e.clientX;
    startW = win.getBoundingClientRect().width;
    handle.setPointerCapture?.(e.pointerId);
    document.body.style.userSelect = 'none';
    hud.style.opacity = '0.9';
  }
  function onPointerMove(e){
    if (!handle.hasPointerCapture?.(e.pointerId)) return;
    const dx = e.clientX - startX;
    setWindowWidth(startW + dx);
  }
  function onPointerUp(e){
    if (!handle.hasPointerCapture?.(e.pointerId)) return;
    handle.releasePointerCapture?.(e.pointerId);
    document.body.style.userSelect = '';
    hud.style.opacity = '0.8';
  }

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);

  // Double-click to reset
  handle.addEventListener('dblclick', ()=> setWindowWidth(windowWidth));

  // Keyboard nudges
  handle.tabIndex = 0;
  handle.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft') setWindowWidth(win.getBoundingClientRect().width - 10);
    if(e.key === 'ArrowRight') setWindowWidth(win.getBoundingClientRect().width + 10);
    if(e.key.toLowerCase() === 'r') setWindowWidth(windowWidth);
  });

  // Expose helper
  window.__setWindowWidth = setWindowWidth;
}

```

### src\views\auto.html
```html
<div class="card">
  <h2>Auto Test Queue</h2>
  <div class="tile">Queued: 12</div>
</div>
<div class="card">
  <h2>Controls</h2>
  <div class="grid-2">
    <div class="tile">Start Queue</div>
    <div class="tile">Clear Queue</div>
  </div>
</div>

```

### src\views\autotest\editor.html
```html
<div class="at-root">
  <div class="at-tabs">
    <a href="#/auto/editor" class="tab is-active">TESTCASE EDITOR</a>
    <a href="#/auto/run" class="tab">RUN TEST</a>
  </div>

  <!-- 상단: 파일 임포트 + 전역 변수 -->
  <section class="card at-top">
    <div class="at-top-grid">
      <div class="at-import">
        <div class="caption">Import Excel/CSV</div>
        <div class="drop" id="at-drop">
          <div>Drag &amp; Drop or</div>
          <label class="btn" for="at-file">Choose File</label>
          <input id="at-file" type="file" accept=".xlsx,.xls,.csv" hidden/>
          <div class="muted" id="at-file-name">No file selected</div>
        </div>
        <div class="btn-row">
          <button class="btn" id="at-validate">Validate</button>
          <button class="btn" id="at-save">Save</button>
          <button class="btn ghost" id="at-go-run">Go to Run</button>
        </div>
      </div>

      <div class="at-vars card">
        <div class="caption">Global Variables</div>
        <div class="kv">
          <div class="row head"><div class="cell">Variable</div><div class="cell">Value</div><div class="cell">Unit</div></div>
          <div class="row"><div class="cell">Voltage Set</div><div class="cell"><input id="v-set" value="12.0"/></div><div class="cell">V</div></div>
          <div class="row"><div class="cell">Current Limit</div><div class="cell"><input id="i-limit" value="500"/></div><div class="cell">mA</div></div>
          <div class="row"><div class="cell">Soak Time</div><div class="cell"><input id="soak" value="5"/></div><div class="cell">s</div></div>
        </div>
      </div>
    </div>
  </section>

  <!-- 하단: Test Steps 에디터 -->
  <section class="card at-steps">
    <div class="caption">Test Steps</div>
    <div class="grid head">
      <div class="cell">Step</div>
      <div class="cell">Input1</div>
      <div class="cell">Input2</div>
      <div class="cell">Expected</div>
    </div>
    <div id="at-step-body">
      <!-- rows injected -->
    </div>
    <div class="btn-row">
      <button class="btn" id="at-add-row">Add Step</button>
      <button class="btn ghost" id="at-export">Export CSV</button>
    </div>
  </section>
</div>

```

### src\views\autotest\run.html
```html
<div class="at-run-root">
  <div class="at-tabs">
    <a href="#/auto/editor" class="tab">TESTCASE EDITOR</a>
    <a href="#/auto/run" class="tab is-active">RUN TEST</a>
  </div>

  <!-- 상단 컨트롤 -->
  <section class="card at-ctrl">
    <div class="btn-row">
      <button class="btn" id="rt-load">Load Case</button>
      <button class="btn" id="rt-start">Start</button>
      <button class="btn" id="rt-stop">Stop</button>
    </div>
    <div class="progress" id="rt-progress"><i></i><span class="pct" id="rt-pct">0%</span></div>
  </section>

  <!-- 본문 레이아웃 -->
  <section class="at-run-grid">
    <div class="card at-chart">
      <div class="caption">Realtime Graph</div>
      <div class="chart" id="rt-chart">
        <canvas id="rt-canvas" width="600" height="300"></canvas>
      </div>
    </div>

    <div class="card at-steps">
      <div class="caption">Steps</div>
      <ol id="rt-steps" class="step-list">
      </ol>
      <div class="muted">현재 진행중인 스텝은 강조 표시됩니다.</div>
    </div>
  </section>

  <section class="card at-ind">
    <div class="caption">Indicators</div>
    <div class="ind-grid">
      <div class="ind"><div class="k">Voltage</div><div class="v" id="ind-v">—</div></div>
      <div class="ind"><div class="k">Current</div><div class="v" id="ind-i">—</div></div>
      <div class="ind"><div class="k">Temp</div><div class="v" id="ind-t">—</div></div>
      <div class="ind"><div class="k">Step</div><div class="v" id="ind-step">—</div></div>
    </div>
  </section>
</div>

```

### src\views\dashboard.html
```html
<div class="card">
  <h2>System Status</h2>
  <div class="grid-2">
    <div class="tile">CPU Usage</div>
    <div class="tile">Memory</div>
  </div>
</div>

<div class="card">
  <h2>Recent Tests</h2>
  <div class="table-like">
    <div class="row head">
      <div>Time</div>
      <div>Case</div>
      <div>Result</div>
      <div>Operator</div>
    </div>
    <div class="row">
      <div>10:31:22</div>
      <div>TC-0421</div>
      <div class="pass">PASS</div>
      <div>JW</div>
    </div>
    <div class="row">
      <div>10:25:09</div>
      <div>TC-0419</div>
      <div class="fail">FAIL</div>
      <div>JW</div>
    </div>
  </div>
</div>

```

### src\views\manual.html
```html
<div class="card">
  <h2>Manual Panel</h2>
  <div class="tile">Axis / IO</div>
</div>

```

### src\views\result.html
```html
<div class="card">
  <h2>Result Viewer</h2>
  <div class="tile">Filter &amp; Export</div>
</div>

```

### src\views\settings.html
```html
<div class="card">
  <h2>Settings</h2>
  <div class="tile">Connection / Paths</div>
</div>

```

### tools\export-ui-review.mjs
```mjs
// tools/export-ui-review.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  puppeteer = (await import('puppeteer')).default;
}

const VIEWPORT = { width: 1920, height: 1000, deviceScaleFactor: 1 };
const OUT_DIR = 'docs/ui';
const LOCK = path.resolve('.export-ui-review.lock');

try {
  fs.closeSync(fs.openSync(LOCK, 'wx'));
} catch {
  console.error('⚠ export-ui-review: already running, exit.');
  process.exit(0);
}

const htmlArg = process.argv[2];
const candidates = [htmlArg, 'dist/index.html', 'gallery.html'].filter(Boolean);
const TARGET_HTML = candidates.find((p) => p && fs.existsSync(path.resolve(p)));
if (!TARGET_HTML) {
  console.error('❌ dist/index.html 또는 gallery.html 이 필요합니다.');
  cleanupAndExit(1);
}
const absHtmlPath = path.resolve(TARGET_HTML);
const fileUrl = pathToFileURL(absHtmlPath).href;

const guessExePaths = [
  process.env.PUPETEER_EXECUTABLE_PATH, // (오타 대비) 환경에서 지정했으면 우선
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const executablePath = guessExePaths.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error(
    '❌ Chrome/Edge 실행 파일을 찾지 못했습니다. PUPPETEER_EXECUTABLE_PATH 를 설정하세요.'
  );
  cleanupAndExit(1);
}

let SHORT = 'working';
try {
  SHORT = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

(async () => {
  try {
    await fs.promises.mkdir(OUT_DIR, { recursive: true });
    for (const e of await fs.promises.readdir(OUT_DIR, {
      withFileTypes: true,
    })) {
      if (e.name === '.gitkeep') continue;
      await fs.promises.rm(path.join(OUT_DIR, e.name), {
        recursive: true,
        force: true,
      });
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      defaultViewport: { ...VIEWPORT },
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.setViewport(VIEWPORT);

    // **핵심: 페이지/요소를 고정 배치 & 정확 크기 강제**
    await page.evaluate(async () => {
      const css = `
        html, body { margin:0; padding:0; overflow:hidden; background:transparent !important; }
        .lv-stage {
          position: fixed !important;
          left: 0 !important; top: 0 !important;
          width: 1920px !important; height: 1000px !important;
          transform: none !important; translate: none !important; scale: 1 !important;
          margin: 0 !important; padding: 0 !important; border: 0 !important; outline: 0 !important;
          box-sizing: border-box !important;
          z-index: 2147483647 !important;
          background-clip: padding-box !important;
        }
      `;
      const style = document.createElement('style');
      style.setAttribute('data-gpt-review', '1');
      style.textContent = css;
      document.head.appendChild(style);

      // 폰트 로딩 대기
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {}
      }
    });

    const el = await page.waitForSelector('.lv-stage', {
      visible: true,
      timeout: 30_000,
    });
    const rect = await el.evaluate((n) => {
      const r = n.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    console.log('▶ .lv-stage rect:', rect);

    // 요소 스크린샷 (정확히 1920×1000이어야 함)
    const pngBase64 = await el.screenshot({
      encoding: 'base64',
      captureBeyondViewport: false,
    });

    const pngPath = path.join(OUT_DIR, 'ui_review.png');
    await fs.promises.writeFile(pngPath, Buffer.from(pngBase64, 'base64'));

    // PNG를 1920×1000 한 장 PDF로
    const pdfPath = path.join(OUT_DIR, 'ui_review.pdf');
    const html = `
      <html><head><meta charset="utf-8"/>
      <style>
        @page { size: 1920px 1000px; margin: 0; }
        html, body { margin:0; padding:0; }
        img { display:block; width:1920px; height:1000px; }
      </style>
      </head>
      <body><img src="data:image/png;base64,${pngBase64}" /></body></html>`;
    const dataUrl =
      'data:text/html;base64,' + Buffer.from(html).toString('base64');

    const page2 = await browser.newPage();
    await page2.goto(dataUrl, { waitUntil: 'load' });
    await page2.pdf({
      path: pdfPath,
      printBackground: true,
      preferCSSPageSize: true,
      pageRanges: '1',
    });

    await browser.close();
    console.log('✅ Saved:', pdfPath, pngPath);
    cleanupAndExit(0);
  } catch (e) {
    console.error('❌ export failed:', e?.message || e);
    cleanupAndExit(1);
  }
})();

function cleanupAndExit(code) {
  try {
    fs.unlinkSync(LOCK);
  } catch {}
  process.exit(code);
}

```

### tools\make-code-snapshot.mjs
```mjs
// tools/make-code-snapshot.mjs
// 목적: 코드 트리 + 핵심 텍스트 파일만 모아 docs/ui/code_snapshot.md 생성
// 사용: npm run code:snapshot

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs', 'ui');
const MD_FILE = path.join(OUT_DIR, 'code_snapshot.md');

// 포함/제외 규칙
const INCLUDE_DIRS = ['src', 'tools']; // 필요한 디렉터리만
const INCLUDE_FILES = ['package.json', 'webpack.config.js']; // 단일 파일 화이트리스트
const EXCLUDE_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'docs',
  '.git',
  '.github',
  'assets',
]);
// 파일명 단독 제외
const EXCLUDE_FILE_NAMES = new Set(['package-lock.json']);
// 텍스트 확장자만 허용 (화이트리스트)
const ALLOWED_EXT = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.json',
  '.html',
  '.css',
  '.scss',
  '.md',
  '.yml',
  '.yaml',
]);
// 명시적 바이너리 확장자(혹시 ALLOWED_EXT에 없어도 안전장치)
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.bmp',
  '.webp',
  '.pdf',
  '.zip',
  '.7z',
  '.rar',
  '.gz',
  '.mp4',
  '.mp3',
  '.wav',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
]);

const MAX_FILE_SIZE = 200 * 1024; // 200KB 초과 파일은 스킵
const MAX_LINES_PER_FILE = 800; // 파일당 최대 라인

const sh = (cmd) =>
  execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();

function isDirExcluded(rel) {
  return rel.split(path.sep).some((seg) => EXCLUDE_DIR_NAMES.has(seg));
}
function isFileExcluded(rel) {
  const base = path.basename(rel);
  if (EXCLUDE_FILE_NAMES.has(base)) return true;
  const ext = path.extname(rel).toLowerCase();
  if (BINARY_EXT.has(ext)) return true;
  if (!ALLOWED_EXT.has(ext)) return true; // 화이트리스트 밖이면 제외
  return false;
}

function listFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = path.relative(ROOT, abs);
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (isDirExcluded(rel)) continue;
      listFiles(abs, out);
    } else {
      if (isDirExcluded(path.dirname(rel))) continue;
      if (isFileExcluded(rel)) continue;
      out.push(abs);
    }
  }
  return out;
}

function tree(dir, prefix = '', out = []) {
  let names = fs.readdirSync(dir).sort();
  names = names.filter((name) => {
    const abs = path.join(dir, name);
    const rel = path.relative(ROOT, abs);
    if (fs.statSync(abs).isDirectory()) {
      return !isDirExcluded(rel);
    } else {
      return !isDirExcluded(path.dirname(rel)) && !isFileExcluded(rel);
    }
  });
  names.forEach((name, idx) => {
    const abs = path.join(dir, name);
    const last = idx === names.length - 1;
    const bar = last ? '└─' : '├─';
    out.push(prefix + bar + name);
    if (fs.statSync(abs).isDirectory()) {
      tree(abs, prefix + (last ? '  ' : '│ '), out);
    }
  });
  return out;
}

function safeRead(abs) {
  const st = fs.statSync(abs);
  if (st.size > MAX_FILE_SIZE)
    return { text: null, reason: `skipped: ${st.size} bytes > limit` };
  let txt = fs.readFileSync(abs, 'utf8').replace(/\uFEFF/g, '');
  const lines = txt.split(/\r?\n/);
  if (lines.length > MAX_LINES_PER_FILE) {
    txt =
      lines.slice(0, MAX_LINES_PER_FILE).join('\n') +
      `\n// ... (truncated, ${
        lines.length - MAX_LINES_PER_FILE
      } lines omitted)`;
  }
  return { text: txt, reason: null };
}

// 준비
fs.mkdirSync(OUT_DIR, { recursive: true });

const short = (() => {
  try {
    return sh('git rev-parse --short HEAD');
  } catch {
    return 'working';
  }
})();
const branch = (() => {
  try {
    return sh('git rev-parse --abbrev-ref HEAD');
  } catch {
    return '';
  }
})();
const when = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');

// 디렉터리 트리
const roots = [
  ...INCLUDE_DIRS.filter((d) => fs.existsSync(d)),
  ...INCLUDE_FILES.filter((f) => fs.existsSync(f)),
];
let treeMd = [];
for (const root of roots) {
  const abs = path.resolve(root);
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    const lines = tree(abs);
    if (lines.length) {
      treeMd.push(`\n**${root}/**`);
      treeMd.push('`\`\`');
      treeMd.push(lines.join('\n'));
      treeMd.push('`\`\`');
    }
  } else if (fs.existsSync(abs)) {
    treeMd.push(`\n**${root}**`);
  }
}
if (treeMd.length === 0) treeMd.push('(no targets)');

// 파일 목록
const files = [];
for (const d of INCLUDE_DIRS)
  if (fs.existsSync(d)) listFiles(path.resolve(d), files);
for (const f of INCLUDE_FILES) {
  const abs = path.resolve(f);
  if (fs.existsSync(abs) && !isFileExcluded(path.relative(ROOT, abs)))
    files.push(abs);
}
files.sort();

// MD 생성
let md = '';
md += `# Code Snapshot\n\n`;
md += `- commit: ${short}  (branch: ${branch})\n`;
md += `- generated: ${when}\n`;
md += `- include: ${INCLUDE_DIRS.join(', ')} + ${INCLUDE_FILES.join(', ')}\n`;
md += `- exclude dirs: ${[...EXCLUDE_DIR_NAMES].join(', ')}\n`;
md += `- exclude files: ${[...EXCLUDE_FILE_NAMES].join(', ')}\n`;
md += `- allow ext: ${[...ALLOWED_EXT].join(
  ', '
)}  (binary & others excluded)\n`;
md += `- limits: file ≤ ${Math.round(
  MAX_FILE_SIZE / 1024
)}KB, ≤ ${MAX_LINES_PER_FILE} lines\n`;

md += `\n## Directory Tree\n`;
md += treeMd.join('\n') + '\n';

md += `\n## Files\n`;
for (const abs of files) {
  const rel = path.relative(ROOT, abs);
  try {
    const { text, reason } = safeRead(abs);
    if (reason) {
      md += `\n### ${rel}\n*(${reason})*\n`;
      continue;
    }
    const ext = path.extname(abs).toLowerCase();
    const lang = ext.startsWith('.') ? ext.slice(1) : '';
    md += `\n### ${rel}\n`;
    md += '`\`\`' + lang + '\n' + text.replace(/`\`\`/g, '`\\`\\`') + '\n`\`\`\n';
  } catch {
    md += `\n### ${rel}\n*(error reading)*\n`;
  }
}

// 저장
fs.writeFileSync(MD_FILE, md, 'utf8');
console.log('✅ code snapshot MD written:', path.relative(ROOT, MD_FILE));

```

### tools\review-commit.mjs
```mjs
// tools/review-commit.mjs
import { execSync } from 'node:child_process';

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function out(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

try {
  // 1) build
  run('npm run build');

  // 2) review (PNG/PDF 스냅샷 생성) - dist/index.html 기준
  run('node tools/export-ui-review.mjs dist/index.html');

  // 3) git add (전체)
  run('git add -A');

  // 4) 변경이 없으면 커밋 생략
  const staged = out('git diff --cached --name-only');
  if (!staged) {
    console.log('No changes to commit (working tree clean).');
  } else {
    // 커밋 메시지: feat: <인자>  / 인자 없으면 기본 메시지
    const msgArg = process.argv.slice(2).join(' ').trim();
    const commitMsg = msgArg
      ? `feat: ${msgArg}`
      : 'chore(ui): update review snapshot';
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  }

  // 5) push (업스트림 없으면 -u로 설정)
  const branch = out('git rev-parse --abbrev-ref HEAD');
  let hasUpstream = true;
  try {
    out('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
  } catch {
    hasUpstream = false;
  }
  run(hasUpstream ? 'git push' : `git push -u origin ${branch}`);

  // 6) 최종 해시 출력
  const shortHash = out('git rev-parse --short HEAD');
  console.log(`\nbaseline=${shortHash}`);
  console.log('Done ✅');
} catch (e) {
  console.error('\n❌ Failed:', e?.message || e);
  process.exit(1);
}

```

### tools\review.mjs
```mjs
// tools/review.mjs
import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}
function out(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

try {
  // 1) build
  run('npm run build');

  // 2) UI 스냅샷 생성 (docs/ui/ui_review.png, ui_review.pdf)
  run('node tools/export-ui-review.mjs dist/index.html');

  // 3) 코드 스냅샷 생성 (docs/ui/code_snapshot.md, code_snapshot.pdf)
  run('node tools/make-code-snapshot.mjs');

  // 4) git add/commit/push
  run('git add -A');
  const staged = out('git diff --cached --name-only');
  if (staged) {
    const msg = process.argv.slice(2).join(' ').trim();
    const commitMsg = msg
      ? `feat: ${msg}`
      : 'chore(ui): update review & code snapshot';
    const safe = commitMsg.replace(/"/g, '\\"');
    run(`git commit -m "${safe}"`);
  } else {
    console.log('No changes to commit (working tree clean).');
  }

  const branch = out('git rev-parse --abbrev-ref HEAD');
  let hasUpstream = true;
  try {
    out('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
  } catch {
    hasUpstream = false;
  }
  run(hasUpstream ? 'git push' : `git push -u origin ${branch}`);

  const shortHash = out('git rev-parse --short HEAD');
  console.log(`\nbaseline=${shortHash}`);
  console.log('Done ✅');
} catch (e) {
  console.error('\n❌ Failed:', e?.message || e);
  process.exit(1);
}

```

### webpack.config.js
```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web', // ← 에러 해결 포인트
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    assetModuleFilename: 'assets/[name].[contenthash][ext]',
    clean: true,
    // chunkFormat: 'array-push',          // ← 드물게 필요하면 주석 해제(옵션)
  },
  module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] }, // 최소 구성
      { test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' },
      {
        test: /\.html$/i,
        include: [
          path.resolve(__dirname, 'src/views'),
          path.resolve(__dirname, 'src/components'),
        ],
        type: 'asset/source', // ← 로더 없이 원문 문자열로 import
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
  devtool: 'source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9001,
    open: false,
    hot: false, // 애니메이션/효과 불필요 → HMR 비활성화
    liveReload: true,
  },
};

```
