/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import { ErrorBoundary } from "react-error-boundary";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import ErrorBoundaryFallback from "../../common/ErrorBoundaryFallback";

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="flex bg-surface min-h-screen relative overflow-x-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
      />
      <main
        className={`ml-0 ${
          isCollapsed ? "lg:ml-[84px]" : "lg:ml-[280px]"
        } min-h-screen flex flex-col justify-between flex-1 w-full transition-all duration-300`}
      >
        <div>
          <Header onToggleSidebar={handleToggleSidebar} isCollapsed={isCollapsed} />
          <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
            <div className="p-container-margin">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
        <div className="px-6 pb-4 pt-0">
          <Footer />
        </div>
      </main>

    </div>
  );
};

export default MainLayout;
