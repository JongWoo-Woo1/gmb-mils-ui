// tools/export-ui-review.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const VIEWPORT = { width: 1920, height: 1000, deviceScaleFactor: 1 };
const OUT_DIR = 'docs/ui';
const LOCK = path.resolve('.export-ui-review.lock');

// 1) 재실행 방지: 파일 잠금
try {
  const fd = fs.openSync(LOCK, 'wx'); // 존재하면 예외(이미 실행 중)
  fs.closeSync(fd);
} catch {
  console.error('⚠ export-ui-review: already running, exit.');
  process.exit(0);
}

// 2) 브라우저 경로 자동 탐색 (환경변수 우선)
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

// 3) 타겟 HTML 자동 선택 (CLI 인자 > dist/index.html > gallery.html)
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

// 4) 현재 커밋 해시(없으면 working)
let SHORT = 'working';
try {
  SHORT = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

// 5) 실행 본문
(async () => {
  try {
    await fs.promises.mkdir(OUT_DIR, { recursive: true });
    console.log('▶ Using browser:', executablePath);
    console.log('▶ Target HTML  :', absHtmlPath);
    console.log('▶ URL          :', fileUrl);
    console.log('▶ Commit       :', SHORT);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      defaultViewport: VIEWPORT,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.emulateMediaType('screen');

    const latestPng = path.join(OUT_DIR, 'ui_review_latest.png');
    const pdfFile = path.join(OUT_DIR, `ui_review_${SHORT}.pdf`);

    await page.screenshot({ path: latestPng });
    await page.pdf({
      path: pdfFile,
      width: `${VIEWPORT.width}px`,
      height: `${VIEWPORT.height}px`,
      printBackground: true,
    });

    await browser.close();

    // 인덱스 MD 갱신(선택)
    const md = `# UI Review Snapshot (1920×1000)\n\n- commit: ${SHORT}\n\n![latest](./ui_review_latest.png)\n\n[Open PDF for this commit](./ui_review_${path.basename(
      pdfFile
    )})\n`;
    await fs.promises.writeFile(path.join(OUT_DIR, 'index.md'), md);

    console.log('✅ Saved:', pdfFile, latestPng);
    cleanupAndExit(0);
  } catch (e) {
    console.error('❌ export failed:', e?.message || e);
    cleanupAndExit(1);
  }
})();

// 공용 종료 함수: 잠금 해제 + 강제 종료(재귀/워처 차단)
function cleanupAndExit(code) {
  try {
    fs.unlinkSync(LOCK);
  } catch {}
  process.exit(code);
}
