import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src');
const iconNames = new Set<string>();

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/<span[^>]*material-symbols-outlined[^>]*>([^<]+)<\/span>/g);
  for (const match of matches) {
    iconNames.add(match[1].trim());
  }
});

console.log('Icons found:', Array.from(iconNames));

