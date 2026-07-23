import * as fs from 'fs';
const file = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Dashboard/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const missing = ['PlusCircle', 'X', 'RefreshCcw', 'UserCheck', 'Star', 'Banknote', 'Loader2', 'Building2', 'Recycle', 'AlertCircle', 'Eye', 'Trophy', 'History', 'Radio', 'Server', 'BrainCircuit', 'LineChart', 'BarChart', 'Leaf', 'TrendingUp', 'TrendingDown', 'CalendarDays'];

content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, (m, inner) => {
    const existing = inner.split(',').map(s => s.trim()).filter(Boolean);
    const set = new Set([...existing, ...missing]);
    return 'import { ' + Array.from(set).join(', ') + ' } from "lucide-react";';
});

fs.writeFileSync(file, content);

