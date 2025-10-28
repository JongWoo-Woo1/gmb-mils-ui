// tools/make-code-snapshot.mjs
// 목적: 코드 트리 + 핵심 텍스트 파일만 모아 docs/ui/code_snapshot.md 생성
// 사용: npm run code:snapshot

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs', 'ui');
const MD_FILE = path.join(OUT_DIR, 'code_snapshot.md');

// 포함/제외 규칙
const INCLUDE_DIRS = ['src', 'tools']; // 필요한 디렉터리만
const INCLUDE_FILES = ['package.json', 'webpack.config.js']; // 단일 파일 화이트리스트
const EXCLUDE_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'docs',
  '.git',
  '.github',
  'assets',
]);
// 파일명 단독 제외
const EXCLUDE_FILE_NAMES = new Set(['package-lock.json']);
// 텍스트 확장자만 허용 (화이트리스트)
const ALLOWED_EXT = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.json',
  '.html',
  '.css',
  '.scss',
  '.md',
  '.yml',
  '.yaml',
]);
// 명시적 바이너리 확장자(혹시 ALLOWED_EXT에 없어도 안전장치)
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.bmp',
  '.webp',
  '.pdf',
  '.zip',
  '.7z',
  '.rar',
  '.gz',
  '.mp4',
  '.mp3',
  '.wav',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
]);

const MAX_FILE_SIZE = 200 * 1024; // 200KB 초과 파일은 스킵
const MAX_LINES_PER_FILE = 800; // 파일당 최대 라인

const sh = (cmd) =>
  execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();

function isDirExcluded(rel) {
  return rel.split(path.sep).some((seg) => EXCLUDE_DIR_NAMES.has(seg));
}
function isFileExcluded(rel) {
  const base = path.basename(rel);
  if (EXCLUDE_FILE_NAMES.has(base)) return true;
  const ext = path.extname(rel).toLowerCase();
  if (BINARY_EXT.has(ext)) return true;
  if (!ALLOWED_EXT.has(ext)) return true; // 화이트리스트 밖이면 제외
  return false;
}

function listFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = path.relative(ROOT, abs);
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (isDirExcluded(rel)) continue;
      listFiles(abs, out);
    } else {
      if (isDirExcluded(path.dirname(rel))) continue;
      if (isFileExcluded(rel)) continue;
      out.push(abs);
    }
  }
  return out;
}

function tree(dir, prefix = '', out = []) {
  let names = fs.readdirSync(dir).sort();
  names = names.filter((name) => {
    const abs = path.join(dir, name);
    const rel = path.relative(ROOT, abs);
    if (fs.statSync(abs).isDirectory()) {
      return !isDirExcluded(rel);
    } else {
      return !isDirExcluded(path.dirname(rel)) && !isFileExcluded(rel);
    }
  });
  names.forEach((name, idx) => {
    const abs = path.join(dir, name);
    const last = idx === names.length - 1;
    const bar = last ? '└─' : '├─';
    out.push(prefix + bar + name);
    if (fs.statSync(abs).isDirectory()) {
      tree(abs, prefix + (last ? '  ' : '│ '), out);
    }
  });
  return out;
}

function safeRead(abs) {
  const st = fs.statSync(abs);
  if (st.size > MAX_FILE_SIZE)
    return { text: null, reason: `skipped: ${st.size} bytes > limit` };
  let txt = fs.readFileSync(abs, 'utf8').replace(/\uFEFF/g, '');
  const lines = txt.split(/\r?\n/);
  if (lines.length > MAX_LINES_PER_FILE) {
    txt =
      lines.slice(0, MAX_LINES_PER_FILE).join('\n') +
      `\n// ... (truncated, ${
        lines.length - MAX_LINES_PER_FILE
      } lines omitted)`;
  }
  return { text: txt, reason: null };
}

// 준비
fs.mkdirSync(OUT_DIR, { recursive: true });

const short = (() => {
  try {
    return sh('git rev-parse --short HEAD');
  } catch {
    return 'working';
  }
})();
const branch = (() => {
  try {
    return sh('git rev-parse --abbrev-ref HEAD');
  } catch {
    return '';
  }
})();
const when = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');

// 디렉터리 트리
const roots = [
  ...INCLUDE_DIRS.filter((d) => fs.existsSync(d)),
  ...INCLUDE_FILES.filter((f) => fs.existsSync(f)),
];
let treeMd = [];
for (const root of roots) {
  const abs = path.resolve(root);
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    const lines = tree(abs);
    if (lines.length) {
      treeMd.push(`\n**${root}/**`);
      treeMd.push('```');
      treeMd.push(lines.join('\n'));
      treeMd.push('```');
    }
  } else if (fs.existsSync(abs)) {
    treeMd.push(`\n**${root}**`);
  }
}
if (treeMd.length === 0) treeMd.push('(no targets)');

// 파일 목록
const files = [];
for (const d of INCLUDE_DIRS)
  if (fs.existsSync(d)) listFiles(path.resolve(d), files);
for (const f of INCLUDE_FILES) {
  const abs = path.resolve(f);
  if (fs.existsSync(abs) && !isFileExcluded(path.relative(ROOT, abs)))
    files.push(abs);
}
files.sort();

// MD 생성
let md = '';
md += `# Code Snapshot\n\n`;
md += `- commit: ${short}  (branch: ${branch})\n`;
md += `- generated: ${when}\n`;
md += `- include: ${INCLUDE_DIRS.join(', ')} + ${INCLUDE_FILES.join(', ')}\n`;
md += `- exclude dirs: ${[...EXCLUDE_DIR_NAMES].join(', ')}\n`;
md += `- exclude files: ${[...EXCLUDE_FILE_NAMES].join(', ')}\n`;
md += `- allow ext: ${[...ALLOWED_EXT].join(
  ', '
)}  (binary & others excluded)\n`;
md += `- limits: file ≤ ${Math.round(
  MAX_FILE_SIZE / 1024
)}KB, ≤ ${MAX_LINES_PER_FILE} lines\n`;

md += `\n## Directory Tree\n`;
md += treeMd.join('\n') + '\n';

md += `\n## Files\n`;
for (const abs of files) {
  const rel = path.relative(ROOT, abs);
  try {
    const { text, reason } = safeRead(abs);
    if (reason) {
      md += `\n### ${rel}\n*(${reason})*\n`;
      continue;
    }
    const ext = path.extname(abs).toLowerCase();
    const lang = ext.startsWith('.') ? ext.slice(1) : '';
    md += `\n### ${rel}\n`;
    md += '```' + lang + '\n' + text.replace(/```/g, '`\\`\\`') + '\n```\n';
  } catch {
    md += `\n### ${rel}\n*(error reading)*\n`;
  }
}

// 저장
fs.writeFileSync(MD_FILE, md, 'utf8');
console.log('✅ code snapshot MD written:', path.relative(ROOT, MD_FILE));
