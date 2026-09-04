const fs = require('fs');
const content = fs.readFileSync('/home/acef-kiki/Documents/Work/Makerindo-Code/berseka/main/apps/web/src/pages/MonitoringAbsen/MonitoringAbsen.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('activeSchedule')) {
        console.log(`${i+1}: ${line}`);
    }
});
