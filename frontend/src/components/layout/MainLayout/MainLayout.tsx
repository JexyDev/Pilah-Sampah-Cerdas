import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import BottomNav from '../BottomNav/BottomNav';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        <Topbar />
        
        <main className={styles.pageContent}>
          <Outlet />
        </main>
        
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;
