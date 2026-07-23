import * as fs from 'fs';

let content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/ManajemenTempatSampah/ManajemenTempatSampah.tsx', 'utf8');
const mtMissing = ['Check', 'X', 'History', 'Edit', 'Trash2', 'Map'];
content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...mtMissing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/ManajemenTempatSampah/ManajemenTempatSampah.tsx', content);

content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/ManajemenLokasi/ManajemenLokasi.tsx', 'utf8');
const mlMissing = ['MapPinPlus', 'X'];
content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...mlMissing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/ManajemenLokasi/ManajemenLokasi.tsx', content);

