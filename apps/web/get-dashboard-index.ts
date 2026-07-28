import * as fs from 'fs';
const content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Dashboard/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const Dashboard')) {
    found = true;
  }
  if (found && i < lines.length) {
    console.log(lines[i]);
  }
}
