import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

function getAllFiles(dir, exts = ['.tsx', '.ts', '.css']) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles(srcDir);
const issues = [];

allFiles.forEach(file => {
  if (file.endsWith('.d.ts')) return;
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const fileRel = path.relative(srcDir, file);
    if (fileRel.includes('LandingPage') || fileRel.includes('DownloadPage') || fileRel.includes('Login') || fileRel.includes('Registration')) {
      return;
    }

    // Check for hardcoded bg-white without dark:bg-
    if (line.includes('bg-white') && !line.includes('dark:bg-') && !line.includes('dark:') && !line.includes('//')) {
      const isCardOrContainer = /className=.*bg-white(?!\/0)/.test(line) && !/text-white|bg-emerald|bg-green|bg-blue|bg-rose|bg-amber/.test(line);
      if (isCardOrContainer) {
        issues.push({
          file: fileRel,
          line: idx + 1,
          type: 'bg-white without dark:bg-',
          content: line.trim()
        });
      }
    }

    // Check for text-slate-900 / text-slate-800 / text-gray-900 / text-gray-800 without dark:text-
    if ((line.includes('text-slate-900') || line.includes('text-slate-800') || line.includes('text-gray-900') || line.includes('text-gray-800')) && !line.includes('dark:text-') && !line.includes('dark:')) {
      if (/className=/.test(line)) {
        issues.push({
          file: fileRel,
          line: idx + 1,
          type: 'dark text without dark:text-',
          content: line.trim()
        });
      }
    }

    // Check for hardcoded hover:bg-slate-50 / hover:bg-slate-100 / bg-slate-50 without dark:
    if ((line.includes('hover:bg-slate-50') || line.includes('hover:bg-slate-100') || line.includes('hover:bg-gray-50') || line.includes('hover:bg-gray-100')) && !line.includes('dark:hover:bg-')) {
      if (/className=/.test(line)) {
        issues.push({
          file: fileRel,
          line: idx + 1,
          type: 'hover bg without dark:hover:bg-',
          content: line.trim()
        });
      }
    }
  });
});

console.log(`Total potential issues found: ${issues.length}\n`);
issues.forEach((i, idx) => {
  console.log(`${idx + 1}. [${i.file}:${i.line}] (${i.type}):\n   ${i.content}\n`);
});
