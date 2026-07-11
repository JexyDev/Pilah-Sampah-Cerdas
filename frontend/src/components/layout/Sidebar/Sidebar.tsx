import React from 'react';
import { NavLink } from 'react-router-dom';

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
        <NavItem to="/manajemen-pengguna" icon="group" label="Manajemen Pengguna" />
        <NavItem to="/manajemen-tempat-sampah" icon="delete" label="Manajemen Tempat Sampah" />
        <NavItem to="/manajemen-lokasi" icon="location_on" label="Manajemen Lokasi" />
        <NavItem to="/jadwal-kegiatan" icon="calendar_today" label="Jadwal Kegiatan" />
        <NavItem to="/kategori-sampah" icon="category" label="Kategori Sampah" />
        <NavItem to="/rekap-setoran" icon="receipt_long" label="Rekap Setoran" />
        <NavItem to="/poin-warga" icon="stars" label="Poin Warga" />
        <NavItem to="/laporan-analitik" icon="analytics" label="Laporan & Analitik" />
        <NavItem to="/notifikasi" icon="notifications" label="Notifikasi" badge={8} />
        <NavItem to="/pengaturan" icon="settings" label="Pengaturan" />
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-outline-variant bg-surface-container-low">
        <div className="bg-primary/10 p-3 rounded-xl mb-4 text-center">
          <p className="text-[11px] text-primary font-bold">Bersama memilah sampah, bersama jaga bumi.</p>
        </div>
        <div className="flex items-center gap-3">
          <img
            className="w-10 h-10 rounded-full border-2 border-primary object-cover flex-shrink-0"
            alt="Admin Avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZiuSPCKMK_7jtK3JGOHdjROV1TJUvGNS4aHbXzifHIsaWx1m1TrA9GFjiSBbIR8wfCWE-HfbR6IA3eZKvyd5G2NGutYsC4FXUzmzVWAxzNGHSPrvXdq_o3OsrPwTncqfcsUoVIRjLAvbbIrCRTz8D_kG0ti1klXAC0UT1B9OIftf2Lxoxz0QQ-_UiObt9Oq4zF2HdA-_0Yj-QkFDaoO47PMIq9NTvF502TLXNNiu0U_zhxYVBe5PImzLPJae_QrfHRUEoZOrClfEP"
          />
          <div className="overflow-hidden flex-1">
            <p className="text-[12px] text-on-surface font-bold truncate">Admin Utama</p>
            <p className="text-[10px] text-on-surface-variant">Super Admin</p>
          </div>
          <button className="ml-auto text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
