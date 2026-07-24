const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('-tracker.md') || f.endsWith('-report.md'));

let masterContent = '# MASTER STATUS: Konsolidasi Semua Tracker\n\n';

let allIncomplete = [];
let allComplete = [];

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const lines = content.split('\n');
  
  masterContent += `## Dari ${f}\n\n`;
  
  let currentHeader = '';
  lines.forEach(line => {
    if (line.startsWith('#')) {
      currentHeader = line.replace(/^#+\s/, '');
    } else if (line.match(/^\s*-\s*\[( |x|X)\]/)) {
      masterContent += `${line}\n`;
      if (line.match(/^\s*-\s*\[ \]/)) {
        allIncomplete.push({ file: f, section: currentHeader, task: line });
      } else {
        allComplete.push({ file: f, section: currentHeader, task: line });
      }
    }
  });
  masterContent += '\n';
});

masterContent += '# REKAP ITEM BELUM SELESAI (TODO)\n\n';
allIncomplete.forEach(item => {
  masterContent += `**[${item.file}]** ${item.section ? `(${item.section})` : ''}\n${item.task}\n\n`;
});

fs.writeFileSync(path.join(dir, 'MASTER_STATUS.md'), masterContent, 'utf-8');
console.log('MASTER_STATUS.md created successfully.');
