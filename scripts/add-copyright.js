import fs from 'fs';
import path from 'path';

const copyrightHeader = `/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */\n`;

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (['node_modules', 'dist', 'build', '.git', '.github', '.agents', '.dart_tool'].includes(file)) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

function addHeaderToFiles(dirs) {
  let count = 0;
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      continue;
    }
    
    const files = getFiles(dir);
    for (const file of files) {
      const ext = path.extname(file);
      if (!['.ts', '.tsx', '.js', '.jsx', '.dart'].includes(ext)) continue;
      
      if (file.endsWith('.d.ts') || file.includes('vite.config') || file.includes('eslint.config')) continue;

      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('Developed by: Jeremy Darrell')) {
        let updated = content;
        
        // Handle developed by
        if (content.includes('Developed by: Jeremy Darrell\r\n') && !content.includes('Muhammad Habil Putrawan')) {
          updated = updated.replace('Developed by: Jeremy Darrell\r\n', 'Developed by: Jeremy Darrell & Muhammad Habil Putrawan\r\n');
        } else if (content.includes('Developed by: Jeremy Darrell\n') && !content.includes('Muhammad Habil Putrawan')) {
          updated = updated.replace('Developed by: Jeremy Darrell\n', 'Developed by: Jeremy Darrell & Muhammad Habil Putrawan\n');
        }
        
        // Handle copyright notice
        if (content.includes('Copyright (c) 2026 Jeremy Darrell. All rights reserved.')) {
          updated = updated.replace('Copyright (c) 2026 Jeremy Darrell. All rights reserved.', 'Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.');
        }
        
        // Handle PT placeholder
        if (content.includes('[Nama PT]')) {
          updated = updated.replace('[Nama PT]', 'PT Makerindo');
        }
        
        if (updated !== content) {
          fs.writeFileSync(file, updated, 'utf8');
          console.log(`Updated attribution in: ${file}`);
          count++;
        }
        continue;
      }
      
      let newContent = '';
      if (content.startsWith('"use strict"') || content.startsWith("'use strict'")) {
        const lines = content.split('\n');
        lines[0] = lines[0] + '\n\n' + copyrightHeader;
        newContent = lines.join('\n');
      } else if (content.startsWith('#!')) {
        const lines = content.split('\n');
        lines[0] = lines[0] + '\n\n' + copyrightHeader;
        newContent = lines.join('\n');
      } else {
        newContent = copyrightHeader + '\n' + content;
      }
      
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Added header to: ${file}`);
      count++;
    }
  }
  console.log(`Total files updated: ${count}`);
}

addHeaderToFiles(['src', 'frontend/src', 'mobile/lib']);
