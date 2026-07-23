import * as fs from 'fs';

let content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/ManajemenPengguna/ManajemenPengguna.tsx', 'utf8');
const mpMissing = ['UserPlus', 'Download', 'User', 'Edit', 'Trash2', 'X'];
content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...mpMissing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/ManajemenPengguna/ManajemenPengguna.tsx', content);

