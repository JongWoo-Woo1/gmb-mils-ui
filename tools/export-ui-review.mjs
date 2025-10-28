// ...상단 import/LOCK/경로탐색/브라우저탐색/SHORT 등 기존 그대로...

const VIEWPORT = { width: 1920, height: 1000, deviceScaleFactor: 1 };
const OUT_DIR = 'docs/ui';

(async () => {
  try {
    // docs/ui 비우기 (기존 로직 유지)
    // ...

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      defaultViewport: VIEWPORT,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage();

    // 1) 열기
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });

    // 2) 뷰포트 보정(혹시 모를 기본값 오염 방지)
    await page.setViewport(VIEWPORT);

    // 3) PDF 레이아웃 강제: 여백 0, 페이지 크기 고정
    await page.addStyleTag({
      content: `
        html, body { margin:0; padding:0; background:transparent; overflow:hidden; }
        @page { size: 1920px 1000px; margin: 0; }
        @media print { html, body { margin:0; } }
      `,
    });

    // 4) 스크린샷(참고용)
    const pngPath = path.join(OUT_DIR, 'ui_review.png');
    await page.screenshot({ path: pngPath, captureBeyondViewport: false });

    // 5) PDF: print 엔진에 CSS 페이지사이즈를 따르도록
    const pdfPath = path.join(OUT_DIR, 'ui_review.pdf');
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      preferCSSPageSize: true, // ★ @page size 사용
      pageRanges: '1', // ★ 혹시 2p 이상 나오려 하면 1페이지만
    });

    await browser.close();
    console.log('✅ Saved:', pdfPath, pngPath);
    // cleanupAndExit(0) 호출 (기존 코드)
  } catch (e) {
    console.error('❌ export failed:', e?.message || e);
    // cleanupAndExit(1)
  }
})();
