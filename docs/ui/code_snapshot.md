# Code Snapshot

- commit: 220a6df  (branch: main)
- generated: 2025-10-28 12:01:51
- include: src, tools + package.json, webpack.config.js
- exclude dirs: node_modules, dist, docs, .git, .github, assets
- exclude files: package-lock.json
- allow ext: .js, .mjs, .cjs, .ts, .tsx, .jsx, .json, .html, .css, .scss, .md, .yml, .yaml  (binary & others excluded)
- limits: file ≤ 200KB, ≤ 800 lines

## Directory Tree

**src/**
```
├─components
│ └─layout.html
├─index.html
├─index.js
├─styles
│ ├─base.css
│ ├─cards.css
│ ├─connections.css
│ ├─layout.css
│ ├─main.css
│ ├─monitor.css
│ ├─nav.css
│ ├─responsive.css
│ ├─shell.css
│ ├─table.css
│ ├─tokens.css
│ └─toolbar.css
└─views
  ├─auto.html
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
  }
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
    <a class="nav-btn" data-view="auto" href="#/auto">AUTO TEST</a>
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
import logoUrl from './assets/gmb-logo.png';

// HTML 파일을 그대로 import (asset/source)
import layoutHtml from './components/layout.html';
import dashboardHtml from './views/dashboard.html';
import autoHtml from './views/auto.html';
import manualHtml from './views/manual.html';
import resultHtml from './views/result.html';
import settingHtml from './views/settings.html';

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
    a.classList.toggle('is-active', a.dataset.view === key);
  });
}
function renderRoute() {
  const key = location.hash.replace('#/', '') || 'dashboard';
  const page = routes[key] || routes.dashboard;
  titleEl.textContent = page.title;
  contentEl.replaceChildren(page.frag.cloneNode(true)); // ← DOM 복제해서 삽입
  setActiveNav(key);
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
/* 프레임 내부 100% */
.app {
  display: grid;
  grid-template-columns: 260px 1fr; /* Run Monitor 넓게 */
  width: 100%;
  height: 100%;
}

/* 사이드바: 아래 여백 줄이고, 내부 간격 살짝 압축 */
.sidebar {
  background: var(--white);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 12px; /* 14→12 */
  padding: 14px; /* 16→14 */
  padding-bottom: 12px; /* footer 제거 따라 최소화 */
}

.brand-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 6px 10px;
  border-bottom: 1px solid var(--line);
}
.brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.brand img {
  width: 140px;
  height: auto;
  display: block;
  object-fit: contain;
}

/* 메인 영역은 그대로 */
.main {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.content {
  display: grid;
  gap: 20px;
}

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
