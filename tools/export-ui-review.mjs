// tools/export-ui-review.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// ---- Puppeteer 동적 임포트 (core 우선) ----
let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  puppeteer = (await import('puppeteer')).default;
}

const VIEWPORT = { width: 1920, height: 1000, deviceScaleFactor: 1 };
const OUT_DIR = 'docs/ui';
const LOCK = path.resolve('.export-ui-review.lock');

// ── 0) 재실행 방지 ─────────────────────────
try {
  fs.closeSync(fs.openSync(LOCK, 'wx'));
} catch {
  console.error('⚠ export-ui-review: already running, exit.');
  process.exit(0);
}

// ── 1) 입력/대상 결정 ───────────────────────
const htmlArg = process.argv[2];
const candidates = [htmlArg, 'dist/index.html', 'gallery.html'].filter(Boolean);
const TARGET_HTML = candidates.find((p) => p && fs.existsSync(path.resolve(p)));
if (!TARGET_HTML) {
  console.error('❌ dist/index.html 또는 gallery.html 이 필요합니다.');
  cleanupAndExit(1);
}
const absHtmlPath = path.resolve(TARGET_HTML);
const fileUrl = pathToFileURL(absHtmlPath).href;

// 타깃 요소 셀렉터: 기본 .lv-stage, 환경변수/CLI(3번째 인자)로 재정의 가능
const TARGET_SELECTOR =
  process.env.REVIEW_SELECTOR || process.argv[3] || '.lv-stage';
const PADDING = 0; // 필요 시 여백(px)

// ── 2) 브라우저 경로 탐색 ───────────────────
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
    '❌ Chrome/Edge 실행 파일을 찾지 못했습니다. PUPPETEER_EXECUTABLE_PATH 를 설정하세요.'
  );
  cleanupAndExit(1);
}

// ── 3) 커밋 해시(로그) ──────────────────────
let SHORT = 'working';
try {
  SHORT = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

// ── 4) 실행 본문 ────────────────────────────
(async () => {
  try {
    // 출력 폴더 정리
    await fs.promises.mkdir(OUT_DIR, { recursive: true });
    for (const e of await fs.promises.readdir(OUT_DIR, {
      withFileTypes: true,
    })) {
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
    console.log('▶ Selector    :', TARGET_SELECTOR);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      defaultViewport: { ...VIEWPORT }, // 기본 1920×1000
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });

    // 타깃 요소 대기 + 정보 수집
    const el = await page.waitForSelector(TARGET_SELECTOR, {
      visible: true,
      timeout: 30_000,
    });
    await el.evaluate((n) =>
      n.scrollIntoView({ block: 'start', inline: 'start' })
    );

    // 요소 bbox(CSS px)
    let box = await el.boundingBox();
    if (!box) throw new Error(`Target not measurable: ${TARGET_SELECTOR}`);

    // 정수 보정 + 패딩
    let clip = {
      x: Math.max(0, Math.floor(box.x) - PADDING),
      y: Math.max(0, Math.floor(box.y) - PADDING),
      width: Math.ceil(box.width) + PADDING * 2,
      height: Math.ceil(box.height) + PADDING * 2,
    };

    // 1920×1000 강제(요구 해상도와 맞추기) — lv-stage가 그 크기여야 함
    // 만약 lv-frame/#app을 찍고 싶으면 SELECTOR를 바꾸세요.
    clip.width = 1920;
    clip.height = 1000;

    console.log('▶ Measured bbox:', box);
    console.log('▶ Clip (final) :', clip);

    // 뷰포트가 clip을 모두 포함하도록 보정
    await page.setViewport({
      width: Math.max(VIEWPORT.width, Math.ceil(clip.x + clip.width)),
      height: Math.max(VIEWPORT.height, Math.ceil(clip.y + clip.height)),
      deviceScaleFactor: VIEWPORT.deviceScaleFactor,
    });

    // PNG (클립 캡처)
    const pngPath = path.join(OUT_DIR, 'ui_review.png');
    const pngBase64 = await page.screenshot({
      clip,
      encoding: 'base64',
      captureBeyondViewport: false,
    });
    await fs.promises.writeFile(pngPath, Buffer.from(pngBase64, 'base64'));

    // PDF: PNG를 data URL 페이지에 정확히 1920×1000으로 꽉 채워 넣어 1장 출력
    const pdfPath = path.join(OUT_DIR, 'ui_review.pdf');
    const html = `
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            @page { size: 1920px 1000px; margin:0; }
            html, body { margin:0; padding:0; }
            img { display:block; width:1920px; height:1000px; }
          </style>
        </head>
        <body>
          <img src="data:image/png;base64,${pngBase64}" />
        </body>
      </html>`;
    const dataUrl =
      'data:text/html;base64,' + Buffer.from(html).toString('base64');

    const page2 = await browser.newPage();
    await page2.goto(dataUrl, { waitUntil: 'load' });
    await page2.pdf({
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
