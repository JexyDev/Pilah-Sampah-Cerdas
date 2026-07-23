import * as fs from 'fs';

let content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/routes/AppRoutes.tsx', 'utf8');
content = content.replace(/<span\s*className="material-symbols-outlined text-primary text-\[64px\]"\s*>\s*error\s*<\/span>/g, '<AlertCircle className="text-primary" size={64} />');
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/routes/AppRoutes.tsx', content);

content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/SuperAdmin/MasterQrManager.tsx', 'utf8');
content = content.replace(/<span\s*className="material-symbols-outlined text-white hover:text-gray-200"\s*>\s*close\s*<\/span>/g, '<X className="text-white hover:text-gray-200" size={24} />');
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/SuperAdmin/MasterQrManager.tsx', content);

content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/components/layout/Header/Header.tsx', 'utf8');
content = content.replace(/<span\s*className=\{material-symbols-outlined text-\[18px\] \$\{n\.title\.includes\("Kritis"\) \? "text-error" : "text-primary"\} mt-0\.5\}\s*>\s*\{n\.title\.includes\("Kritis"\) \? "warning" : "info"\}\s*<\/span>/g, '{n.title.includes("Kritis") ? <AlertTriangle className={"text-[18px] mt-0.5 } size={18}/> : <Info className={"text-[18px] mt-0.5 } size={18}/>}');
content = content.replace(/<span\s*onClick=\{([^}]+)\}\s*className="material-symbols-outlined text-\[20px\] text-on-surface-variant hover:text-primary cursor-pointer"\s*>\s*close\s*<\/span>/g, '<X onClick={} className="text-[20px] text-on-surface-variant hover:text-primary cursor-pointer" size={20} />');
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/components/layout/Header/Header.tsx', content);

content = fs.readFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Dashboard/Dashboard.tsx', 'utf8');
content = content.replace(/<span\s*className="material-symbols-outlined text-\[24px\]"\s*>\s*([a-z_]+)\s*<\/span>/g, (m, icon) => '<IconRenderer name={"' + icon + '"} size={24} />');
content = content.replace(/<span\s*className=\{material-symbols-outlined text-\[16px\] \$\{bin\.category === "ORGANIC" \? "text-primary" : "text-blue-500"\}\}\s*>\s*\{bin\.category === "ORGANIC" \? "eco" : "recycling"\}\s*<\/span>/g, '{bin.category === "ORGANIC" ? <Leaf className="text-[16px] text-primary" size={16}/> : <Recycle className="text-[16px] text-blue-500" size={16}/>}');
content = content.replace(/<span\s*className="material-symbols-outlined text-primary"\s*>\s*add\s*<\/span>/g, '<Plus className="text-primary" size={24} />');
if (!content.includes('import { Plus')) {
   content = content.replace(/import {([^}]*)} from "lucide-react";/, 'import { , Plus } from "lucide-react";');
}
content = content.replace(/<span\s*className="material-symbols-outlined" style=\{\{ fontVariationSettings: "'FILL' 1" \}\}\s*>\s*star\s*<\/span>/g, '<Star className="fill-current" size={24} />');
content = content.replace(/<span\s*className=\{material-symbols-outlined text-\[14px\] \$\{trendUp \? "text-green-600" : "text-red-600"\}\}\s*>\s*\{trendUp \? "trending_up" : "trending_down"\}\s*<\/span>/g, '{trendUp ? <TrendingUp className="text-[14px] text-green-600" size={14}/> : <TrendingDown className="text-[14px] text-red-600" size={14}/>}');
content = content.replace(/<span\s*className="material-symbols-outlined text-primary text-\[48px\] animate-spin"\s*>\s*progress_activity\s*<\/span>/g, '<Loader2 className="text-primary animate-spin" size={48} />');
content = content.replace(/<span\s*className="material-symbols-outlined text-\[14px\]"\s*>\s*calendar_today\s*<\/span>/g, '<CalendarDays size={14} />');
content = content.replace(/<span\s*className="material-symbols-outlined text-yellow-500" style=\{\{ fontVariationSettings: "'FILL' 1" \}\}\s*>\s*emoji_events\s*<\/span>/g, '<Trophy className="text-yellow-500 fill-current" size={24} />');
content = content.replace(/<span\s*className=\{material-symbols-outlined text-\[14px\] \$\{item\.iconColor\}\}\s*>\{item\.icon\}<\/span>/g, '<IconRenderer name={item.icon} className={"text-[14px] } size={14} />');
fs.writeFileSync('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/pages/Dashboard/Dashboard.tsx', content);

console.log('Fixed final instances!');

