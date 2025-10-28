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
