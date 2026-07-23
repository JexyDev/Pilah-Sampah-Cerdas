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
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/import\s*\{\s*,\s*/g, 'import { ');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed ' + file);
  }
});

