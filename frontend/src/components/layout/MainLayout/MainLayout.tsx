/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import ErrorBoundaryFallback from "../../common/ErrorBoundaryFallback";

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-surface min-h-screen relative overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 w-full transition-all duration-300">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
          <div className="p-container-margin">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default MainLayout;
