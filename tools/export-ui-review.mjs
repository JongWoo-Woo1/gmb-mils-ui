// tools/export-ui-review.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const VIEWPORT = { width: 1920, height: 1000, deviceScaleFactor: 1 };
const OUT_DIR = 'docs/ui';
const LOCK = path.resolve('.export-ui-review.lock');

// --- 0) puppeteer 동적 임포트 (core 우선, 실패 시 puppeteer) ---
let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.error(
      '❌ puppeteer-core / puppeteer 가 설치되어 있지 않습니다.\n' +
        '   npm i -D puppeteer-core    (권장)\n' +
        '   또는\n' +
        '   npm i -D puppeteer'
    );
    process.exit(1);
  }
}

// --- 1) 재실행 방지: 파일 LOCK ---
try {
  const fd = fs.openSync(LOCK, 'wx'); // 이미 있으면 예외
  fs.closeSync(fd);
} catch {
  console.error('⚠ export-ui-review: already running, exit.');
  process.exit(0);
}

// --- 2) 타깃 HTML 자동 선택 (CLI 인자 > dist/index.html > gallery.html) ---
const arg = process.argv[2];
const candidates = [arg, 'dist/index.html', 'gallery.html'].filter(Boolean);
const TARGET_HTML = candidates.find((p) => p && fs.existsSync(path.resolve(p)));
if (!TARGET_HTML) {
  console.error(
    '❌ 대상 HTML을 찾지 못했습니다. dist/index.html 또는 gallery.html이 필요합니다.'
  );
  cleanupAndExit(1);
}
const absHtmlPath = path.resolve(TARGET_HTML);
const fileUrl = pathToFileURL(absHtmlPath).href;

// --- 3) 브라우저 실행 파일 자동 탐색(환경변수 우선) ---
const guessExePaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const executablePath = guessExePaths.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error(
    '❌ Chrome/Edge 실행 파일을 찾지 못했습니다.\n' +
      '   PUPPETEER_EXECUTABLE_PATH 환경변수로 경로를 지정하세요.'
  );
  cleanupAndExit(1);
}

// --- 4) 현재 커밋 해시(로그용) ---
let SHORT = 'working';
try {
  SHORT = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

(async () => {
  try {
    // --- 5) 출력 폴더 정리: docs/ui 비우고 시작 ---
    await fs.promises.mkdir(OUT_DIR, { recursive: true });
    const entries = await fs.promises.readdir(OUT_DIR, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === '.gitkeep') continue;
      await fs.promises.rm(path.join(OUT_DIR, e.name), {
        recursive: true,
        force: true,
      });
    }

    console.log('▶ Browser     :', executablePath);
    console.log('▶ Target HTML :', absHtmlPath);
    console.log('▶ URL         :', fileUrl);
    console.log('▶ Commit      :', SHORT);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      defaultViewport: VIEWPORT,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage();

    // 열기 + 뷰포트 보정
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.setViewport(VIEWPORT);

    // PDF가 정확히 1920×1000 한 장으로 나오게 강제
    await page.addStyleTag({
      content: `
        html, body { margin:0; padding:0; background:transparent; overflow:hidden; }
        @page { size: 1920px 1000px; margin: 0; }
        @media print { html, body { margin:0; } }
      `,
    });

    // 고정 파일명
    const pngPath = path.join(OUT_DIR, 'ui_review.png');
    const pdfPath = path.join(OUT_DIR, 'ui_review.pdf');

    // PNG
    await page.screenshot({ path: pngPath, captureBeyondViewport: false });

    // PDF (1페이지만, CSS 사이즈 우선)
    await page.pdf({
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
