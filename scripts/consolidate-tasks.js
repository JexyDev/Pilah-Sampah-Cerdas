import fs from 'fs';
import path from 'path';

const trackers = [
  'bugfix-tracker.md',
  'polish-tracker.md',
  'warga-ux-tracker.md',
  'login-validation-tracker.md',
  'progress-tracker.md'
];

const tasks = [];
let bugCounter = 1;
let polCounter = 1;
let wrgCounter = 1;
let valCounter = 1;
let prgCounter = 1;

trackers.forEach(filename => {
  const filePath = path.resolve(filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${filename} not found, skipping.`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let currentModule = 'Umum';

  lines.forEach(line => {
    // Detect module headers (e.g. ## DASHBOARD)
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      currentModule = headerMatch[1].trim();
      return;
    }

    // Detect list items: - [ ] or - [x]
    const taskMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (taskMatch) {
      const isDone = taskMatch[1].toLowerCase() === 'x';
      const fullText = taskMatch[2].trim();
      
      // Determine prefix based on file
      let prefix = 'TASK';
      let num = 0;
      if (filename.includes('bugfix')) {
        prefix = 'BUG';
        num = bugCounter++;
      } else if (filename.includes('polish')) {
        prefix = 'POL';
        num = polCounter++;
      } else if (filename.includes('warga')) {
        prefix = 'WRG';
        num = wrgCounter++;
      } else if (filename.includes('login')) {
        prefix = 'VAL';
        num = valCounter++;
      } else {
        prefix = 'PRG';
        num = prgCounter++;
      }

      const id = `${prefix}-${String(num).padStart(3, '0')}`;
      
      // Extract title as first 40 chars or until a separator
      let title = fullText.split('—')[0].split('(')[0].split(':')[0].trim();
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }

      tasks.push({
        id,
        title,
        description: fullText,
        module: currentModule,
        source_file: filename,
        status: isDone ? 'done' : 'todo',
        trello_card_id: null,
        last_commit: null
      });
    }
  });
});

fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2), 'utf-8');
console.log(`Successfully generated tasks.json with ${tasks.length} tasks.`);
