import * as fs from 'fs';

let content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Pengaturan/Pengaturan.tsx', 'utf8');
const pMissing = ['Router', 'RefreshCw', 'Info', 'Key', 'Copy', 'RefreshCcw', 'Webhook', 'Save'];
content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...pMissing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Pengaturan/Pengaturan.tsx', content);

content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/RekapSetoran/RekapSetoran.tsx', 'utf8');
const rMissing = ['Grid', 'Receipt', 'MapPin'];
content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...rMissing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/RekapSetoran/RekapSetoran.tsx', content);

