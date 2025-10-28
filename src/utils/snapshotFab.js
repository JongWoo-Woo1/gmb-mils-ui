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
