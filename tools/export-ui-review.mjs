// tools/export-ui-review.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const SHORT = execSync('git rev-parse --short HEAD').toString().trim();
const OUT_DIR = 'docs/ui';
const URL = 'file://' + process.cwd().replace(/\\/g, '/') + '/gallery.html'; // 너의 미리보기 페이지(1920x1000)

await fs.promises.mkdir(OUT_DIR, { recursive: true });
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  // 또는 Edge:
  // executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
});
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.emulateMediaType('screen');

// 최신본 PNG + 버전 넘버 PDF 둘 다 저장
await page.screenshot({ path: `${OUT_DIR}/ui_review_latest.png` });
await page.pdf({
  path: `${OUT_DIR}/ui_review_${SHORT}.pdf`,
  width: '1920px',
  height: '1000px',
  printBackground: true,
});

await browser.close();

// 인덱스 Markdown도 갱신(선택)
const md = `# UI Review Snapshot (1920×1000)\n\n- commit: ${SHORT}\n\n![latest](./ui_review_latest.png)\n\n[Open PDF for this commit](./ui_review_${SHORT}.pdf)\n`;
await fs.promises.writeFile(`${OUT_DIR}/index.md`, md);
console.log(
  'Saved:',
  `${OUT_DIR}/ui_review_${SHORT}.pdf`,
  `${OUT_DIR}/ui_review_latest.png`
);
