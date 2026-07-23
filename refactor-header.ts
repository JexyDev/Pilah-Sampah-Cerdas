import * as fs from 'fs';
const file = 'c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src/components/layout/Header/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  { match: /<span className="material-symbols-outlined text-primary text-\[20px\]">location_on<\/span>/g, replace: '<MapPin className="text-primary" size={20} />' },
  { match: /<span className="material-symbols-outlined text-on-surface-variant text-\[18px\]">\s*keyboard_arrow_down\s*<\/span>/g, replace: '<ChevronDown className="text-on-surface-variant" size={18} />' },
  { match: /<span className="material-symbols-outlined text-\[22px\]">notifications<\/span>/g, replace: '<Bell size={22} />' },
  { match: /<span\s*className=\{material-symbols-outlined text-\[18px\] \$\{n\.title\.includes\("Kritis"\) \? "text-error" : "text-primary"\} mt-0\.5\}\s*>\s*\{n\.title\.includes\("Kritis"\) \? "warning" : "info"\}\s*<\/span>/g, replace: '{n.title.includes("Kritis") ? <AlertTriangle className={"text-[18px] mt-0.5 } size={18}/> : <Info className={"text-[18px] mt-0.5 } size={18}/>}' },
  { match: /<span className="material-symbols-outlined text-\[22px\]">apps<\/span>/g, replace: '<LayoutGrid size={22} />' },
  { match: /<span className="material-symbols-outlined text-primary text-\[24px\]">\s*redeem\s*<\/span>/g, replace: '<Gift className="text-primary" size={24} />' },
  { match: /<span className="material-symbols-outlined text-green-600 text-\[24px\]">\s*chat_bubble\s*<\/span>/g, replace: '<MessageSquare className="text-green-600" size={24} />' },
  { match: /<span className="material-symbols-outlined text-blue-600 text-\[24px\]">\s*menu_book\s*<\/span>/g, replace: '<BookOpen className="text-blue-600" size={24} />' },
  { match: /<span className="material-symbols-outlined text-\[18px\]">settings<\/span>/g, replace: '<Settings size={18} />' },
  { match: /<span className="material-symbols-outlined text-\[18px\]">logout<\/span>/g, replace: '<LogOut size={18} />' },
  { match: /<span\s*onClick=\{([^}]+)\}\s*className="material-symbols-outlined text-\[20px\] text-on-surface-variant hover:text-primary cursor-pointer"\s*>\s*close\s*<\/span>/g, replace: '<X onClick={} className="text-[20px] text-on-surface-variant hover:text-primary cursor-pointer" size={20} />' },
  { match: /<span className="material-symbols-outlined text-\[18px\]">account_balance_wallet<\/span>/g, replace: '<Wallet size={18} />' },
  { match: /<span className="material-symbols-outlined text-primary text-\[20px\]">\s*menu_book\s*<\/span>/g, replace: '<BookOpen className="text-primary" size={20} />' },
  { match: /<span className="material-symbols-outlined text-\[16px\]">eco<\/span>/g, replace: '<Leaf size={16} />' },
  { match: /<span className="material-symbols-outlined text-\[16px\]">local_drink<\/span>/g, replace: '<GlassWater size={16} />' },
];

replacements.forEach(r => content = content.replace(r.match, r.replace));

content = 'import { MapPin, ChevronDown, Bell, AlertTriangle, Info, LayoutGrid, Gift, MessageSquare, BookOpen, Settings, LogOut, X, Wallet, Leaf, GlassWater } from "lucide-react";\n' + content;

fs.writeFileSync(file, content);
console.log('Header.tsx refactored');

