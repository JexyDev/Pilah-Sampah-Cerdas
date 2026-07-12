import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore, UserRole } from '../../../store/useAuthStore';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 rounded-r-xl transition-all text-[13px] ${
        isActive
          ? 'bg-secondary-fixed text-on-secondary-fixed-variant border-l-4 border-secondary font-bold'
          : 'text-on-surface-variant hover:bg-surface-container-high'
      }`
    }
  >
    <span className="material-symbols-outlined mr-3 text-[20px]">{icon}</span>
    <span className="flex-1">{label}</span>
    {badge !== undefined && (
      <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
  </NavLink>
);

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar sistem');
    navigate('/login');
  };

  const currentRole = user?.peran || 'WARGA';

  // Role based helper
  const hasAccess = (allowed: UserRole[]) => allowed.includes(currentRole);

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col z-50">
      {/* Brand Header */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-primary">
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-primary leading-tight">Pilah Sampah Cerdas</h1>
            <p className="text-[10px] text-on-surface-variant leading-tight">Sampah Terdata, Lingkungan Tertata</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#bccabc transparent' }}>
        <NavItem to="/" icon="dashboard" label="Dashboard" />
        
        {hasAccess(['ADMIN']) && (
          <NavItem to="/manajemen-pengguna" icon="group" label="Manajemen Pengguna" />
        )}
        
        {hasAccess(['ADMIN', 'PETUGAS_KELURAHAN', 'PETUGAS_RW', 'PETUGAS_RT']) && (
          <NavItem to="/manajemen-tempat-sampah" icon="delete" label="Manajemen Tempat Sampah" />
        )}
        
        {hasAccess(['ADMIN', 'PETUGAS_KELURAHAN']) && (
          <NavItem to="/manajemen-lokasi" icon="location_on" label="Manajemen Lokasi" />
        )}
        
        <NavItem to="/jadwal-kegiatan" icon="calendar_today" label="Jadwal Kegiatan" />
        
        {hasAccess(['ADMIN', 'PETUGAS_KELURAHAN']) && (
          <NavItem to="/kategori-sampah" icon="category" label="Kategori Sampah" />
        )}
        
        {hasAccess(['ADMIN', 'PETUGAS_KELURAHAN', 'PETUGAS_RW', 'PETUGAS_RT']) && (
          <NavItem to="/rekap-setoran" icon="receipt_long" label="Rekap Setoran" />
        )}
        
        <NavItem to="/poin-warga" icon="stars" label="Poin Warga" />
        
        {hasAccess(['ADMIN']) && (
          <NavItem to="/laporan-analitik" icon="analytics" label="Laporan & Analitik" />
        )}
        
        <NavItem to="/notifikasi" icon="notifications" label="Notifikasi" badge={8} />
        
        {hasAccess(['ADMIN', 'PETUGAS_KELURAHAN']) && (
          <NavItem to="/pengaturan" icon="settings" label="Pengaturan" />
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-outline-variant bg-surface-container-low">
        <div className="bg-primary/10 p-3 rounded-xl mb-4 text-center">
          <p className="text-[11px] text-primary font-bold">Bersama memilah sampah, bersama jaga bumi.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${user?.avatarBg || 'bg-blue-100'} ${user?.avatarColor || 'text-blue-700'} flex items-center justify-center font-bold text-xs shadow-sm border border-outline-variant/20 flex-shrink-0`}>
            {user?.avatar || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[12px] text-on-surface font-bold truncate">{user?.nama || 'Pengguna'}</p>
            <p className="text-[10px] text-on-surface-variant truncate font-semibold">{user?.peran?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="ml-auto text-on-surface-variant hover:text-error transition-colors flex-shrink-0" title="Keluar Sistem">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
