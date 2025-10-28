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
      <div class="cell"><input value="${values[0] ?? ''}" /></div>
      <div class="cell"><input value="${values[1] ?? ''}" /></div>
      <div class="cell"><input value="${values[2] ?? ''}" /></div>
      <div class="cell"><input value="${values[3] ?? ''}" /></div>`;
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

  root.querySelector('#at-add-row')?.addEventListener('click', () => addRow());

  root.querySelector('#at-validate')?.addEventListener('click', () => {
    // 매우 간단한 검증 데모: Step 번호 정수 확인
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
    const csv = ['Step,Input1,Input2,Expected', ...rows.map(r => r.join(','))].join('\n');
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
