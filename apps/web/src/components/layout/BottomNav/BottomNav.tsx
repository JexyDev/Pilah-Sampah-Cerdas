/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Map, Database, Users, Menu } from "lucide-react";
import styles from "./BottomNav.module.css";

const BottomNav: React.FC = () => {
  const navItems = [
    { path: "/", label: "Beranda", icon: <LayoutDashboard size={24} /> },
    { path: "/monitoring", label: "Monitor", icon: <Map size={24} /> },
    { path: "/master-data", label: "Data", icon: <Database size={24} /> },
    { path: "/warga-tempat-sampah", label: "Warga", icon: <Users size={24} /> },
    { path: "/lainnya", label: "Lainnya", icon: <Menu size={24} /> },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
