import * as fs from 'fs';

let content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/src/services/dashboardService.ts', 'utf8');

const replacement = 'wilayah !== "Sistem Pusat" &&\n      wilayah !== "Area KKN Dago" &&\n      wilayah !== "Dinas Lingkungan Hidup";';

content = content.replace(/wilayah !== "Sistem Pusat" &&\s*wilayah !== "Area KKN Dago";/g, replacement);

fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/src/services/dashboardService.ts', content);
console.log('Fixed dashboardService.ts');
