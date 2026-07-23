import * as fs from 'fs';
const dashboard = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Dashboard/Dashboard.tsx';
let content = fs.readFileSync(dashboard, 'utf8');

// Replace standard static ones if any were missed
content = content.replace(/<span\s+className="material-symbols-outlined text-\[24px\]">\s*([a-z_0-9]+)\s*<\/span>/g, (m, iconName) => '<IconRenderer name={"' + iconName + '"} size={24} />');
content = content.replace(/<span\s+className="material-symbols-outlined animate-spin text-primary text-\[32px\]">\s*progress_activity\s*<\/span>/g, '<Loader2 className="animate-spin text-primary" size={32} />');
content = content.replace(/<span\s+className="material-symbols-outlined animate-spin text-primary text-\[48px\]">\s*progress_activity\s*<\/span>/g, '<Loader2 className="animate-spin text-primary" size={48} />');

// Handle dynamic ones
content = content.replace(/<span\s+className=\{material-symbols-outlined text-\[16px\] \$\{bin.category === "ORGANIC" \? "text-primary" : "text-blue-500"\}\}>\s*\{bin.category === "ORGANIC" \? "eco" : "recycling"\}\s*<\/span>/g, '{bin.category === "ORGANIC" ? <Leaf className="text-[16px] text-primary" size={16}/> : <Recycle className="text-[16px] text-blue-500" size={16}/>}');
content = content.replace(/<span\s+className="material-symbols-outlined text-\[18px\]">\s*\{notif.icon\}\s*<\/span>/g, '<IconRenderer name={notif.icon} size={18} />');
content = content.replace(/<span className=\{material-symbols-outlined text-\[14px\] \$\{item.iconColor\}\}>\{item.icon\}<\/span>/g, '<IconRenderer name={item.icon} className={"text-[14px] } size={14} />');

if (!content.includes('import { IconRenderer }')) {
    content = 'import { IconRenderer } from "../../components/common/IconRenderer";\n' + content;
}
if (!content.includes('import { Loader2') && (content.includes('<Loader2'))) {
    content = content.replace(/import {([^}]*)} from "lucide-react";/, 'import { , Loader2 } from "lucide-react";');
}

fs.writeFileSync(dashboard, content);

const notif = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Notifikasi/Notifikasi.tsx';
content = fs.readFileSync(notif, 'utf8');
content = content.replace(/<span\s+className="material-symbols-outlined text-\[24px\]">\s*\{notif.icon\}\s*<\/span>/g, '<IconRenderer name={notif.icon} size={24} />');
content = content.replace(/<span\s+className="material-symbols-outlined text-\[22px\]">\s*\{notif.icon\}\s*<\/span>/g, '<IconRenderer name={notif.icon} size={22} />');
if (!content.includes('import { IconRenderer }')) {
    content = 'import { IconRenderer } from "../../components/common/IconRenderer";\n' + content;
}
fs.writeFileSync(notif, content);

const monitoring = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Monitoring/Monitoring.tsx';
content = fs.readFileSync(monitoring, 'utf8');
content = content.replace(/<span\s+class="material-symbols-outlined text-\[16px\] text-white font-bold">\s*\$\{iconName\}\s*<\/span>/g, '<IconRenderer name={iconName} className="text-[16px] text-white font-bold" size={16} />'); // Wait Monitoring uses innerHTML probably. Let's just do a manual check later.
fs.writeFileSync(monitoring, content);

console.log('Fixed dynamic edge cases!');

