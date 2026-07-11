import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import BottomNav from '../BottomNav/BottomNav';
import ErrorBoundaryFallback from '../../common/ErrorBoundaryFallback';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        <Topbar />
        
        <main className={styles.pageContent}>
          <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
            <Outlet />
          </ErrorBoundary>
        </main>
        
        <BottomNav />
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default MainLayout;
