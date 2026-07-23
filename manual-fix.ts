import * as fs from 'fs';

let content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Dashboard/Dashboard.tsx', 'utf8');
const dMissing = ['Wallet', 'Zap', 'Home', 'MapPin', 'Edit', 'Bell', 'RefreshCw', 'Megaphone', 'Trash', 'AlertTriangle', 'Truck', 'Archive', 'Send'];
content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...dMissing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Dashboard/Dashboard.tsx', content);

content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Notifikasi/Notifikasi.tsx', 'utf8');
const nMissing = ['ImageOff', 'RefreshCcw', 'AlertCircle', 'Info', 'CheckCheck', 'Trash2', 'Settings', 'BellOff'];
content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...nMissing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Notifikasi/Notifikasi.tsx', content);

console.log('Done manual fix');

