import * as fs from 'fs';
import * as path from 'path';

const toRemove: Record<string, string[]> = {
  'src/components/common/IconRenderer.tsx': ['Recycle'],
  'src/components/layout/Header/Header.tsx': ['AlertTriangle', 'Info', 'X'],
  'src/pages/Dashboard/Dashboard.tsx': ['Plus', 'TrendingDown', 'CalendarDays'],
  'src/pages/SuperAdmin/MasterQrManager.tsx': ['X'],
  'src/routes/AppRoutes.tsx': ['AlertCircle']
};

for (const [filePart, unused] of Object.entries(toRemove)) {
  const file = path.resolve('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend', filePart);
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*["']lucide-react["'];?/, (m, inner) => {
    const existing = inner.split(',').map((s: string) => s.trim()).filter(Boolean);
    const filtered = existing.filter((e: string) => !unused.includes(e));
    if (filtered.length === 0) return '';
    return 'import { ' + filtered.join(', ') + ' } from "lucide-react";';
  });
  
  fs.writeFileSync(file, content);
  console.log('Fixed unused imports in ' + file);
}

// Special case for Monitoring.tsx
const monFile = path.resolve('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Monitoring/Monitoring.tsx');
let monContent = fs.readFileSync(monFile, 'utf8');
monContent = monContent.replace(/let iconName = "storefront";/, '// let iconName = "storefront";');
fs.writeFileSync(monFile, monContent);
console.log('Fixed Monitoring.tsx');
