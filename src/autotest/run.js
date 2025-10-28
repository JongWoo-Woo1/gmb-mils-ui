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
