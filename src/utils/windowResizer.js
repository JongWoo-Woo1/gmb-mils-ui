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
