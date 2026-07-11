import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Database, MapPin, Users, Trophy, BrainCircuit, Bell } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/monitoring', label: 'Live Monitoring', icon: <Map size={20} /> },
    { path: '/master-data', label: 'Master Data', icon: <Database size={20} /> },
    { path: '/peta', label: 'Peta Wilayah', icon: <MapPin size={20} /> },
    { path: '/warga-tong', label: 'Data Warga & Tong', icon: <Users size={20} /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={20} /> },
    { path: '/evaluasi-ai', label: 'Evaluasi AI', icon: <BrainCircuit size={20} /> },
    { path: '/notifikasi', label: 'Notifikasi', icon: <Bell size={20} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>🍃</div>
        <div className={styles.logoText}>
          <h2>Pilah Sampah</h2>
          <p>Kecamatan Coblong</p>
        </div>
      </div>
      
      <nav className={styles.navMenu}>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
