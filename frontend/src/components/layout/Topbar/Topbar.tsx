/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from "react";
import { Menu, UserCircle, LogOut } from "lucide-react";
import styles from "./Topbar.module.css";

const Topbar: React.FC = () => {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {/* Placeholder untuk mobile menu toggle di masa depan jika diperlukan */}
        <button className={styles.mobileMenuBtn}>
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Bapak Asep</span>
          <span className={styles.userRole}>Petugas RT</span>
        </div>
        <div className={styles.avatar}>
          <UserCircle size={32} />
        </div>
        <button className={styles.logoutBtn} aria-label="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
