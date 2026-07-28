import React from 'react';
import { Info, AlertTriangle, CheckCheck, Bell, MessageSquare, ShieldCheck, MapPin, Trash2, ShieldAlert, Star, Leaf, Recycle as RecycleIcon, Gift, Wallet, GlassWater, Loader2, PlayCircle, Scale, LayoutDashboard, Settings, User } from "lucide-react";

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className, size = 24 }) => {
  const iconProps = { className, size };
  switch (name?.toLowerCase()) {
    case 'info': return <Info {...iconProps} />;
    case 'warning': return <AlertTriangle {...iconProps} />;
    case 'error': return <AlertTriangle {...iconProps} />;
    case 'done_all': return <CheckCheck {...iconProps} />;
    case 'notifications': return <Bell {...iconProps} />;
    case 'chat_bubble': return <MessageSquare {...iconProps} />;
    case 'verified_user': return <ShieldCheck {...iconProps} />;
    case 'location_on': return <MapPin {...iconProps} />;
    case 'recycling': return <RecycleIcon {...iconProps} />;
    case 'delete_sweep': return <Trash2 {...iconProps} />;
    case 'admin_panel_settings': return <ShieldAlert {...iconProps} />;
    case 'stars': return <Star {...iconProps} />;
    case 'eco': return <Leaf {...iconProps} />;
    case 'local_drink': return <GlassWater {...iconProps} />;
    case 'redeem': return <Gift {...iconProps} />;
    case 'account_balance_wallet': return <Wallet {...iconProps} />;
    case 'progress_activity': return <Loader2 {...iconProps} />;
    case 'play_circle': return <PlayCircle {...iconProps} />;
    case 'scale': return <Scale {...iconProps} />;
    case 'dashboard': return <LayoutDashboard {...iconProps} />;
    case 'settings': return <Settings {...iconProps} />;
    case 'person': return <User {...iconProps} />;
    default: return <Bell {...iconProps} />; // fallback
  }
};

