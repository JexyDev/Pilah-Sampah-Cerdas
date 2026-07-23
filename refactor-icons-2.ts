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

  // Use [\s\S]*? to match across newlines
  const regex = /<span\s+className="([^"]*material-symbols-outlined[^"]*)"\s*>([\s\S]*?)<\/span>/g;
  content = content.replace(regex, (match, className, iconStr) => {
    let cleanIconStr = iconStr.trim();
    
    // For animate-spin with no text, replace with Loader2
    if (className.includes('animate-spin') && cleanIconStr === '') {
        cleanIconStr = 'progress_activity';
    } else if (className.includes('animate-spin') && (cleanIconStr === 'autorenew' || cleanIconStr === 'sync')) {
        cleanIconStr = 'progress_activity';
    }

    const lucideName = iconMap[cleanIconStr];
    
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
      } else if (newClass.includes('text-[20px]')) {
         sizeStr = ' size={20}';
         newClass = newClass.replace('text-[20px]', '').trim();
      } else if (newClass.includes('text-[24px]')) {
         sizeStr = ' size={24}';
         newClass = newClass.replace('text-[24px]', '').trim();
      } else if (newClass.includes('text-[28px]')) {
         sizeStr = ' size={28}';
         newClass = newClass.replace('text-[28px]', '').trim();
      } else if (newClass.includes('text-[18px]')) {
         sizeStr = ' size={18}';
         newClass = newClass.replace('text-[18px]', '').trim();
      } else if (newClass.includes('text-[16px]')) {
         sizeStr = ' size={16}';
         newClass = newClass.replace('text-[16px]', '').trim();
      } else if (newClass.includes('text-[15px]')) {
         sizeStr = ' size={15}';
         newClass = newClass.replace('text-[15px]', '').trim();
      } else if (newClass.includes('text-[12px]')) {
         sizeStr = ' size={12}';
         newClass = newClass.replace('text-[12px]', '').trim();
      }
      
      changed = true;
      if (newClass) {
        return '<' + lucideName + ' className="' + newClass + '"' + sizeStr + ' />';
      } else {
        return '<' + lucideName + sizeStr + ' />';
      }
    }
    
    // Ternaries or complex
    return match;
  });

  // Handle some common ternaries manually!
  if (content.includes('{showPassword ? "visibility_off" : "visibility"}')) {
      content = content.replace(/<span\s+className="([^"]*material-symbols-outlined[^"]*)"\s*>\s*\{showPassword \? "visibility_off" : "visibility"\}\s*<\/span>/g, (m, c) => {
         imports.add('EyeOff'); imports.add('Eye');
         let newC = c.replace('material-symbols-outlined', '').trim();
         return '{showPassword ? <EyeOff className="' + newC + '" size={20}/> : <Eye className="' + newC + '" size={20}/>}';
      });
      changed = true;
  }
  
  if (content.includes('{h.points >= 0 ? "add_circle" : "remove_circle"}')) {
      content = content.replace(/<span\s+className=\{([^]*)material-symbols-outlined([^]*)\}\s*>\s*\{h\.points >= 0 \? "add_circle" : "remove_circle"\}\s*<\/span>/g, (m, c1, c2) => {
         imports.add('PlusCircle'); imports.add('MinusCircle');
         let newC = (c1 + c2).trim();
         return '{h.points >= 0 ? <PlusCircle className={"' + newC + '"} size={18}/> : <MinusCircle className={"' + newC + '"} size={18}/>}';
      });
      changed = true;
  }

  if (changed) {
    // Inject import carefully
    let importList = Array.from(imports).filter(i => !content.includes('import { ' + i));
    if (importList.length > 0) {
      if (content.includes('from "lucide-react";')) {
         content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*"lucide-react";/, 'import { , ' + importList.join(', ') + ' } from "lucide-react";');
      } else {
         const importStatement = 'import { ' + importList.join(', ') + ' } from "lucide-react";\n';
         content = importStatement + content;
      }
      fs.writeFileSync(file, content);
      console.log('Refactored: ' + file);
    }
  }
});

