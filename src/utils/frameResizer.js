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
