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

  // 2) 스냅샷 생성 (항상 docs/ui/ui_review.* 로 생성)
  run('node tools/export-ui-review.mjs dist/index.html');

  // 3) git add/commit/push
  run('git add -A');
  const staged = out('git diff --cached --name-only');
  if (staged) {
    const msg = process.argv.slice(2).join(' ').trim();
    const commitMsg = msg
      ? `feat: ${msg}`
      : 'chore(ui): update review snapshot';
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

  // 4) baseline 출력
  const shortHash = out('git rev-parse --short HEAD');
  console.log(`\nbaseline=${shortHash}`);
  console.log('Done ✅');
} catch (e) {
  console.error('\n❌ Failed:', e?.message || e);
  process.exit(1);
}
