// tools/export-ui-review.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  puppeteer = (await import('puppeteer')).default;
}

const VIEWPORT = { width: 1920, height: 1000, deviceScaleFactor: 1 };
const OUT_DIR = 'docs/ui';
const LOCK = path.resolve('.export-ui-review.lock');

try {
  fs.closeSync(fs.openSync(LOCK, 'wx'));
} catch {
  console.error('⚠ export-ui-review: already running, exit.');
  process.exit(0);
}

const htmlArg = process.argv[2];
const candidates = [htmlArg, 'dist/index.html', 'gallery.html'].filter(Boolean);
const TARGET_HTML = candidates.find((p) => p && fs.existsSync(path.resolve(p)));
if (!TARGET_HTML) {
  console.error('❌ dist/index.html 또는 gallery.html 이 필요합니다.');
  cleanupAndExit(1);
}
const absHtmlPath = path.resolve(TARGET_HTML);
const fileUrl = pathToFileURL(absHtmlPath).href;

const guessExePaths = [
  process.env.PUPETEER_EXECUTABLE_PATH, // (오타 대비) 환경에서 지정했으면 우선
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

let SHORT = 'working';
try {
  SHORT = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

(async () => {
  try {
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

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      defaultViewport: { ...VIEWPORT },
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
    await page.setViewport(VIEWPORT);

    // **핵심: 페이지/요소를 고정 배치 & 정확 크기 강제**
    await page.evaluate(async () => {
      const css = `
        html, body { margin:0; padding:0; overflow:hidden; background:transparent !important; }
        .lv-stage {
          position: fixed !important;
          left: 0 !important; top: 0 !important;
          width: 1920px !important; height: 1000px !important;
          transform: none !important; translate: none !important; scale: 1 !important;
          margin: 0 !important; padding: 0 !important; border: 0 !important; outline: 0 !important;
          box-sizing: border-box !important;
          z-index: 2147483647 !important;
          background-clip: padding-box !important;
        }
      `;
      const style = document.createElement('style');
      style.setAttribute('data-gpt-review', '1');
      style.textContent = css;
      document.head.appendChild(style);

      // 폰트 로딩 대기
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {}
      }
    });

    const el = await page.waitForSelector('.lv-stage', {
      visible: true,
      timeout: 30_000,
    });
    const rect = await el.evaluate((n) => {
      const r = n.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    console.log('▶ .lv-stage rect:', rect);

    // 요소 스크린샷 (정확히 1920×1000이어야 함)
    const pngBase64 = await el.screenshot({
      encoding: 'base64',
      captureBeyondViewport: false,
    });

    const pngPath = path.join(OUT_DIR, 'ui_review.png');
    await fs.promises.writeFile(pngPath, Buffer.from(pngBase64, 'base64'));

    // PNG를 1920×1000 한 장 PDF로
    const pdfPath = path.join(OUT_DIR, 'ui_review.pdf');
    const html = `
      <html><head><meta charset="utf-8"/>
      <style>
        @page { size: 1920px 1000px; margin: 0; }
        html, body { margin:0; padding:0; }
        img { display:block; width:1920px; height:1000px; }
      </style>
      </head>
      <body><img src="data:image/png;base64,${pngBase64}" /></body></html>`;
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
