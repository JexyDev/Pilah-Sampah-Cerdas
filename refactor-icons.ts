import * as fs from 'fs';
import * as path from 'path';

const iconMap: Record<string, string> = {
  'logout': 'LogOut',
  'stars': 'Star',
  'trending_up': 'TrendingUp',
  'trending_down': 'TrendingDown',
  'payments': 'Banknote',
  'account_balance_wallet': 'Wallet',
  'eco': 'Leaf',
  'local_drink': 'GlassWater',
  'bolt': 'Zap',
  'home': 'Home',
  'location_on': 'MapPin',
  'edit': 'Edit',
  'notifications': 'Bell',
  'sync': 'RefreshCw',
  'campaign': 'Megaphone',
  'delete_sweep': 'Trash',
  'warning': 'AlertTriangle',
  'local_shipping': 'Truck',
  'history': 'History',
  'archive': 'Archive',
  'report': 'AlertOctagon',
  'close': 'X',
  'autorenew': 'RefreshCcw',
  'send': 'Send',
  'add_circle': 'PlusCircle',
  'remove_circle': 'MinusCircle',
  'how_to_reg': 'UserCheck',
  'account_balance': 'Building2',
  'recycling': 'Recycle',
  'error': 'AlertCircle',
  'visibility': 'Eye',
  'visibility_off': 'EyeOff',
  'emoji_events': 'Trophy',
  'sensors': 'Radio',
  'dns': 'Server',
  'psychology': 'BrainCircuit',
  'analytics': 'LineChart',
  'bar_chart': 'BarChart',
  'chevron_left': 'ChevronLeft',
  'chevron_right': 'ChevronRight',
  'add': 'Plus',
  'schedule': 'Clock',
  'event': 'Calendar',
  'event_available': 'CalendarCheck',
  'calendar_today': 'CalendarDays',
  'delete': 'Trash2',
  'picture_as_pdf': 'FileText',
  'grid_on': 'Grid',
  'download': 'Download',
  'more_vert': 'MoreVertical',
  'memory': 'Cpu',
  'hub': 'Network',
  'swap_vert': 'ArrowUpDown',
  'wifi_off': 'WifiOff',
  'check_circle': 'CheckCircle2',
  'info': 'Info',
  'person': 'User',
  'lock': 'Lock',
  'login': 'LogIn',
  'add_location_alt': 'MapPinPlus',
  'expand_more': 'ChevronDown',
  'search': 'Search',
  'progress_activity': 'Loader2',
  'person_add': 'UserPlus',
  'admin_panel_settings': 'ShieldAlert',
  'engineering': 'HardHat',
  'check': 'Check',
  'map': 'Map',
  'menu_book': 'BookOpen',
  'notifications_active': 'BellRing',
  'image_not_supported': 'ImageOff',
  'done_all': 'CheckCheck',
  'settings': 'Settings',
  'notifications_off': 'BellOff',
  'photo_camera': 'Camera',
  'router': 'Router',
  'key': 'Key',
  'content_copy': 'Copy',
  'webhook': 'Webhook',
  'save': 'Save',
  'cleaning_services': 'Brush',
  'leaderboard': 'BarChart3',
  'search_off': 'SearchX',
  'receipt_long': 'Receipt',
  'qr_code_2': 'QrCode',
  'play_circle': 'PlayCircle',
  'verified_user': 'ShieldCheck',
  'forest': 'Trees',
  'scale': 'Scale',
  'construction': 'Hammer'
};

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') && !file.includes('Sidebar.tsx') && !file.includes('Header.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/frontend/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  let imports = new Set<string>();

  // Simple string icons
  const regex = /<span\s+className="([^"]*material-symbols-outlined[^"]*)"\s*>([a-z_0-9]+)<\/span>/g;
  content = content.replace(regex, (match, className, iconStr) => {
    const lucideName = iconMap[iconStr.trim()];
    if (lucideName) {
      imports.add(lucideName);
      let newClass = className.replace('material-symbols-outlined', '').trim();
      let sizeStr = '';
      const sizeMatch = newClass.match(/text-\[([0-9]+)px\]/);
      if (sizeMatch) {
         sizeStr = ' size={' + sizeMatch[1] + '}';
         newClass = newClass.replace(/text-\[[0-9]+px\]/, '').trim();
      } else if (newClass.includes('text-xl')) {
         sizeStr = ' size={20}';
         newClass = newClass.replace('text-xl', '').trim();
      } else if (newClass.includes('text-2xl')) {
         sizeStr = ' size={24}';
         newClass = newClass.replace('text-2xl', '').trim();
      } else if (newClass.includes('text-3xl')) {
         sizeStr = ' size={28}';
         newClass = newClass.replace('text-3xl', '').trim();
      } else if (newClass.includes('text-4xl')) {
         sizeStr = ' size={32}';
         newClass = newClass.replace('text-4xl', '').trim();
      } else if (newClass.includes('text-[64px]')) {
         sizeStr = ' size={64}';
         newClass = newClass.replace('text-[64px]', '').trim();
      } else if (newClass.includes('text-sm')) {
         sizeStr = ' size={14}';
         newClass = newClass.replace('text-sm', '').trim();
      } else if (newClass.includes('text-[32px]')) {
         sizeStr = ' size={32}';
         newClass = newClass.replace('text-[32px]', '').trim();
      }
      
      changed = true;
      if (newClass) {
        return '<' + lucideName + ' className="' + newClass + '"' + sizeStr + ' />';
      } else {
        return '<' + lucideName + sizeStr + ' />';
      }
    }
    return match;
  });

  if (changed) {
    const importStatement = 'import { ' + Array.from(imports).join(', ') + ' } from "lucide-react";\n';
    content = importStatement + content;
    fs.writeFileSync(file, content);
    console.log('Refactored: ' + file);
  }
});

