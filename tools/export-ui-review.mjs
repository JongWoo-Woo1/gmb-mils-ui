// tools/export-ui-review.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const VIEWPORT = { width: 1920, height: 1000, deviceScaleFactor: 1 };
const OUT_DIR = 'docs/ui';
const LOCK = path.resolve('.export-ui-review.lock');

// 0) 재실행 방지
try {
  const fd = fs.openSync(LOCK, 'wx');
  fs.closeSync(fd);
} catch {
  console.error('⚠ export-ui-review: already running, exit.');
  process.exit(0);
}

// 1) 타깃 HTML 자동 선택 (CLI 인자 > dist/index.html > gallery.html)
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

// 2) 브라우저 실행 파일 자동 탐지(환경변수 우선)
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
    '❌ Chromium/Chrome/Edge 실행 파일을 찾을 수 없습니다.\n' +
      'PUPPETEER_EXECUTABLE_PATH 환경변수로 경로를 지정하세요.'
  );
  cleanupAndExit(1);
}

// 3) 현재 커밋 해시(로그용)
let SHORT = 'working';
try {
  SHORT = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

(async () => {
  try {
    // 4) 출력 폴더 정리: docs/ui 비우고 시작
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

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.emulateMediaType('screen');

    // 5) 고정 파일명으로 저장
    const pngPath = path.join(OUT_DIR, 'ui_review.png');
    const pdfPath = path.join(OUT_DIR, 'ui_review.pdf');

    await page.screenshot({ path: pngPath });
    await page.pdf({
      path: pdfPath,
      width: `${VIEWPORT.width}px`,
      height: `${VIEWPORT.height}px`,
      printBackground: true,
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
