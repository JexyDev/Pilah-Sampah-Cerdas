import * as fs from 'fs';
const appRoutes = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/routes/AppRoutes.tsx';
let content = fs.readFileSync(appRoutes, 'utf8');
content = content.replace(/<span\s+className="material-symbols-outlined text-primary text-\[64px\]">\s*error\s*<\/span>/g, '<AlertCircle className="text-primary" size={64} />');
content = 'import { AlertCircle } from "lucide-react";\n' + content;
fs.writeFileSync(appRoutes, content);

const masterQr = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/SuperAdmin/MasterQrManager.tsx';
content = fs.readFileSync(masterQr, 'utf8');
content = content.replace(/<span\s+className="material-symbols-outlined text-white hover:text-gray-200">\s*close\s*<\/span>/g, '<X className="text-white hover:text-gray-200" size={24} />');
if (!content.includes('import { X')) {
    content = content.replace(/import {([^}]*)} from "lucide-react";/, 'import { , X } from "lucide-react";');
}
fs.writeFileSync(masterQr, content);

const sidebar = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/components/layout/Sidebar/Sidebar.tsx';
content = fs.readFileSync(sidebar, 'utf8');
content = content.replace(/<span\s+className="material-symbols-outlined text-\[20px\]">\s*logout\s*<\/span>/g, '<LogOut size={20} />');
if (!content.includes('import { LogOut')) {
    content = content.replace(/import {([^}]*)} from "lucide-react";/, 'import { , LogOut } from "lucide-react";');
}
fs.writeFileSync(sidebar, content);

const header = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/components/layout/Header/Header.tsx';
content = fs.readFileSync(header, 'utf8');
content = content.replace(/<span\s*className=\{material-symbols-outlined text-\[18px\] \$\{n\.title\.includes\("Kritis"\) \? "text-error" : "text-primary"\} mt-0\.5\}\s*>\s*\{n\.title\.includes\("Kritis"\) \? "warning" : "info"\}\s*<\/span>/g, '{n.title.includes("Kritis") ? <AlertTriangle className={"text-[18px] mt-0.5 } size={18}/> : <Info className={"text-[18px] mt-0.5 } size={18}/>}');
content = content.replace(/<span\s*onClick=\{([^}]+)\}\s*className="material-symbols-outlined text-\[20px\] text-on-surface-variant hover:text-primary cursor-pointer"\s*>\s*close\s*<\/span>/g, '<X onClick={} className="text-[20px] text-on-surface-variant hover:text-primary cursor-pointer" size={20} />');
fs.writeFileSync(header, content);

console.log('Fixed edge cases!');

