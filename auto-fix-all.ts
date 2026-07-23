import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let output = '';
try {
  output = execSync('npx eslint src --ext .ts,.tsx --format compact', { encoding: 'utf8', stdio: 'pipe' });
} catch (e: any) {
  output = e.stdout || '';
}

const missingImports: Record<string, Set<string>> = {};

const lines = output.split('\n');
for (let line of lines) {
  if (line.includes('is not defined')) {
     const match = line.match(/(src[^\:]+\.tsx).*'([^']+)' is not defined/);
     if (match) {
        let [_, filePart, component] = match;
        const file = path.resolve('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend', filePart);
        if (!missingImports[file]) missingImports[file] = new Set();
        missingImports[file].add(component);
     }
  }
}

for (const file of Object.keys(missingImports)) {
  let content = fs.readFileSync(file, 'utf8');
  const toImport = Array.from(missingImports[file]);
  
  if (content.includes('from "lucide-react";')) {
     content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
         const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
         const newImports = Array.from(new Set([...existing, ...toImport]));
         return 'import { ' + newImports.join(', ') + ' } from "lucide-react";';
     });
  } else {
     content = 'import { ' + toImport.join(', ') + ' } from "lucide-react";\n' + content;
  }
  
  fs.writeFileSync(file, content);
  console.log('Fixed missing imports in ' + file);
}

