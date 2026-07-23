import * as fs from 'fs';
const output = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/lint-output.txt', 'utf8');

const missingImports: Record<string, Set<string>> = {};

const lines = output.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('react(jsx-no-undef)')) {
    const match = line.match(/'([^']+)' is not defined/);
    if (match) {
      const component = match[1];
      // Get filename from the next few lines
      for (let j = 1; j <= 2; j++) {
        if (lines[i+j] && lines[i+j].includes(',-[src/')) {
           const fileMatch = lines[i+j].match(/,-\[src\/([^:]+):/);
           if (fileMatch) {
             const file = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/' + fileMatch[1];
             if (!missingImports[file]) missingImports[file] = new Set();
             missingImports[file].add(component);
             break;
           }
        }
      }
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

