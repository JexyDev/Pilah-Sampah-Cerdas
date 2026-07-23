import * as fs from 'fs';
import * as path from 'path';

const logOutput = \
src/components/layout/Sidebar/Sidebar.tsx(83,31): error TS2304: Cannot find name 'LayoutDashboard'.
src/components/layout/Sidebar/Sidebar.tsx(86,38): error TS2304: Cannot find name 'ScanLine'.
src/components/layout/Sidebar/Sidebar.tsx(90,43): error TS2304: Cannot find name 'Compass'.
src/components/layout/Sidebar/Sidebar.tsx(94,46): error TS2304: Cannot find name 'Shield'.
src/components/layout/Sidebar/Sidebar.tsx(98,51): error TS2552: Cannot find name 'Users'. Did you mean 'user'?
src/components/layout/Sidebar/Sidebar.tsx(102,57): error TS2304: Cannot find name 'ClipboardCheck'.
src/components/layout/Sidebar/Sidebar.tsx(114,56): error TS2304: Cannot find name 'Trash2'.
src/components/layout/Sidebar/Sidebar.tsx(118,49): error TS2304: Cannot find name 'MapPin'.
src/components/layout/Sidebar/Sidebar.tsx(123,46): error TS2304: Cannot find name 'ShieldCheck'.
src/components/layout/Sidebar/Sidebar.tsx(124,47): error TS2304: Cannot find name 'Sprout'.
src/components/layout/Sidebar/Sidebar.tsx(128,46): error TS2304: Cannot find name 'Calendar'.
src/components/layout/Sidebar/Sidebar.tsx(131,48): error TS2304: Cannot find name 'Tags'.
src/components/layout/Sidebar/Sidebar.tsx(142,50): error TS2304: Cannot find name 'Receipt'.
src/components/layout/Sidebar/Sidebar.tsx(144,41): error TS2304: Cannot find name 'Star'.
src/components/layout/Sidebar/Sidebar.tsx(147,49): error TS2304: Cannot find name 'LineChart'.
src/components/layout/Sidebar/Sidebar.tsx(150,41): error TS2304: Cannot find name 'Bell'.
src/components/layout/Sidebar/Sidebar.tsx(161,47): error TS2304: Cannot find name 'Settings'.
src/components/layout/Sidebar/Sidebar.tsx(168,55): error TS2304: Cannot find name 'BarChart2'.
src/components/layout/Sidebar/Sidebar.tsx(169,53): error TS2304: Cannot find name 'Sliders'.
src/components/layout/Sidebar/Sidebar.tsx(170,55): error TS2304: Cannot find name 'QrCode'.
src/components/layout/Sidebar/Sidebar.tsx(171,51): error TS2304: Cannot find name 'FileText'.
src/pages/JadwalKegiatan/JadwalKegiatan.tsx(191,20): error TS2304: Cannot find name 'ChevronLeft'.
src/pages/JadwalKegiatan/JadwalKegiatan.tsx(203,20): error TS2304: Cannot find name 'ChevronRight'.
src/pages/JadwalKegiatan/JadwalKegiatan.tsx(212,18): error TS2304: Cannot find name 'Plus'.
src/pages/JadwalKegiatan/JadwalKegiatan.tsx(343,24): error TS2304: Cannot find name 'Calendar'.
src/pages/JadwalKegiatan/JadwalKegiatan.tsx(351,24): error TS2304: Cannot find name 'MapPin'.
src/pages/JadwalKegiatan/JadwalKegiatan.tsx(378,20): error TS2304: Cannot find name 'X'.
src/pages/Login/Login.tsx(77,16): error TS2304: Cannot find name 'AlertCircle'.
src/pages/Login/Login.tsx(80,16): error TS2304: Cannot find name 'AlertTriangle'.
src/pages/Login/Login.tsx(109,14): error TS2304: Cannot find name 'X'.
src/pages/Login/Login.tsx(201,16): error TS2304: Cannot find name 'CheckCircle2'.
src/pages/Login/Login.tsx(210,16): error TS2304: Cannot find name 'RefreshCcw'.
src/pages/Login/Login.tsx(231,16): error TS2304: Cannot find name 'Info'.
src/pages/Login/Login.tsx(345,18): error TS2304: Cannot find name 'AlertTriangle'.
src/pages/Login/Login.tsx(390,18): error TS2304: Cannot find name 'AlertTriangle'.
src/pages/Login/Login.tsx(403,18): error TS2304: Cannot find name 'RefreshCcw'.
src/pages/Login/Login.tsx(408,18): error TS2304: Cannot find name 'LogIn'.
src/pages/ManajemenTempatSampah/ManajemenTempatSampah.tsx(301,14): error TS2304: Cannot find name 'Plus'.
src/pages/ManajemenTempatSampah/ManajemenTempatSampah.tsx(308,14): error TS2304: Cannot find name 'Download'.
src/pages/SuperAdmin/MasterQrManager.tsx(141,12): error TS2304: Cannot find name 'QrCode'.
src/pages/SuperAdmin/MasterQrManager.tsx(150,14): error TS2304: Cannot find name 'AlertTriangle'.
src/pages/SuperAdmin/MasterQrManager.tsx(181,26): error TS2304: Cannot find name 'PlayCircle'.
\;

const missingImports: Record<string, Set<string>> = {};

const lines = logOutput.trim().split('\n');
for (const line of lines) {
  let match = line.match(/(src[^\:]+\.tsx).*Cannot find name '([^']+)'/);
  if (!match) {
    match = line.match(/(src[^\:]+\.tsx).*Did you mean '([^']+)'/);
  }
  if (match) {
     let [_, filePart, component] = match;
     if (component.toLowerCase() === 'user') component = 'Users'; // Handle TS2552 Did you mean 'user'?
     const file = path.resolve('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend', filePart);
     if (!missingImports[file]) missingImports[file] = new Set();
     missingImports[file].add(component);
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
  console.log('Fixed TS imports in ' + file);
}

