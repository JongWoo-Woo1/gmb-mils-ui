// Bottom-right SNAP (PDF) button for 1920x1000 capture
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function mountSnapshotFab(opts={}){
  const {
    selector = '.lv-frame',
    size = [1920, 1000],
    filename = 'Snapshot'
  } = opts;

  if (document.getElementById('at-snap-fab')) return;

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

  const btn = document.createElement('button');
  btn.className = 'at-snap-fab';
  btn.id = 'at-snap-fab';
  btn.type = 'button';
  btn.title = 'Capture current view (1920×1000)';
  btn.innerHTML = '<span>SNAP</span>';
  document.body.appendChild(btn);

  function setBusy(v){ v ? btn.setAttribute('aria-busy','true') : btn.removeAttribute('aria-busy'); }
  function resolveTarget(){
    return document.querySelector(selector) || document.querySelector('#content') || document.querySelector('.app') || document.body;
  }

  async function capture(){
    const [W,H] = size;
    const el = resolveTarget();
    if(!el){ alert('Capture target not found.'); return; }
    setBusy(true);
    try{
      window.scrollTo(0,0);
      const canvas = await html2canvas(el, { backgroundColor:'#ffffff', useCORS:true, scale:1, windowWidth:W, windowHeight:H });
      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      const ctx = out.getContext('2d');
      const sw = canvas.width, sh = canvas.height;
      const scale = Math.max(W/sw, H/sh);
      const dw = Math.round(sw*scale), dh = Math.round(sh*scale);
      const dx = Math.round((W-dw)/2), dy = Math.round((H-dh)/2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,W,H);
      ctx.drawImage(canvas, 0,0, sw,sh, dx,dy, dw,dh);

      const img = out.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: W>=H?'l':'p', unit:'px', format:[W,H] });
      pdf.addImage(img, 'PNG', 0,0, W,H);
      const stamp = new Date().toISOString().replace(/[-:T]/g,'').slice(0,15);
      pdf.save(`${filename}_${stamp}.pdf`);
    }catch(err){
      console.error(err); alert('SNAP 실패 (콘솔 확인)');
    }finally{
      setBusy(false);
    }
  }
  btn.addEventListener('click', capture);
}
