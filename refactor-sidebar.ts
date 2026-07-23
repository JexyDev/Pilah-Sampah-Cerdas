import * as fs from 'fs';
const file = 'frontend/src/components/layout/Sidebar/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

const map = {
  'dashboard': 'LayoutDashboard',
  'qr_code_scanner': 'ScanLine',
  'explore': 'Compass',
  'shield': 'Shield',
  'group': 'Users',
  'fact_check': 'ClipboardCheck',
  'delete': 'Trash2',
  'location_on': 'MapPin',
  'verified': 'ShieldCheck',
  'compost': 'Sprout',
  'calendar_today': 'Calendar',
  'category': 'Tags',
  'receipt_long': 'Receipt',
  'stars': 'Star',
  'analytics': 'LineChart',
  'notifications': 'Bell',
  'settings': 'Settings',
  'query_stats': 'BarChart2',
  'tune': 'Sliders',
  'qr_code_2': 'QrCode',
  'assignment': 'FileText'
};

let imports = new Set();
content = content.replace(/icon="([^"]+)"/g, (match, iconName) => {
  const lucideIcon = map[iconName] || 'Circle';
  imports.add(lucideIcon);
  return 'icon={' + lucideIcon + '}';
});

content = content.replace(/interface NavItemProps \{[^}]+\}/m, 'import { LucideIcon } from "lucide-react";\n\ninterface NavItemProps {\n  to: string;\n  icon: LucideIcon;\n  label: string;\n  badge?: number;\n}');

content = content.replace(/<span className="material-symbols-outlined.*">\{icon\}<\/span>/, '<Icon className="mr-3 text-[20px]" size={20} />');
content = content.replace(/const NavItem: React.FC<NavItemProps> = \(\{ to, icon, label, badge \}\) => \(/, 'const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, badge }) => (');

const importStatement = 'import { ' + Array.from(imports).join(', ') + ' } from "lucide-react";\n';
content = content.replace(/import React from "react";/, 'import React from "react";\n' + importStatement);

fs.writeFileSync(file, content);
console.log('Sidebar.tsx refactored!');

