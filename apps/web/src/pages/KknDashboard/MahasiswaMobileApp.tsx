/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Master Mobile App Component for Mahasiswa KKN (React Web Mobile Experience)
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { IOSSafariGate } from "../../components/common/IOSSafariGate";
import { MahasiswaMobileShell } from "../../components/layout/MahasiswaMobileShell/MahasiswaMobileShell";
import { MahasiswaMobileHome } from "./MahasiswaMobileHome";
import { MahasiswaPresensiMobile } from "./MahasiswaPresensiMobile";
import { MahasiswaLogbookMobile } from "./MahasiswaLogbookMobile";
import { MahasiswaProkerMobile } from "./MahasiswaProkerMobile";
import { MahasiswaProfilMobile } from "./MahasiswaProfilMobile";
import { MahasiswaLogbookFormModal } from "./MahasiswaLogbookFormModal";
import api from "../../utils/api";

export const MahasiswaMobileApp: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as "beranda" | "presensi" | "logbook" | "proker" | "profil" | null;
  const requestedAction = searchParams.get("action");

  const [activeTab, setActiveTab] = useState<"beranda" | "presensi" | "logbook" | "proker" | "profil">(
    requestedTab && ["beranda", "presensi", "logbook", "proker", "profil"].includes(requestedTab)
      ? requestedTab
      : "beranda"
  );
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(requestedAction === "create-logbook" || searchParams.get("create") === "1");
  const [logbookRefreshTrigger, setLogbookRefreshTrigger] = useState(0);
  const [prokerList, setProkerList] = useState<any[]>([]);

  useEffect(() => {
    fetchProkerList();
  }, []);

  // Sync state if URL query params change
  useEffect(() => {
    if (requestedTab && ["beranda", "presensi", "logbook", "proker", "profil"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
    if (requestedAction === "create-logbook" || searchParams.get("create") === "1") {
      setIsLogbookModalOpen(true);
    }
  }, [requestedTab, requestedAction, searchParams]);

  const handleTabChange = (newTab: "beranda" | "presensi" | "logbook" | "proker" | "profil") => {
    setActiveTab(newTab);
    // Sync to URL search params cleanly without reload
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", newTab);
    nextParams.delete("action");
    nextParams.delete("create");
    setSearchParams(nextParams, { replace: true });
  };

  const fetchProkerList = async () => {
    try {
      const res = await api.get("/kkn/program-kerja");
      setProkerList(res.data?.data || []);
    } catch {
      // Fallback
    }
  };

  return (
    <IOSSafariGate>
      <MahasiswaMobileShell activeTab={activeTab} onTabChange={handleTabChange}>
        {(tab) => {
          switch (tab) {
            case "beranda":
              return (
                <MahasiswaMobileHome
                  onNavigateTab={handleTabChange}
                  onOpenLogbookModal={() => setIsLogbookModalOpen(true)}
                  refreshTrigger={logbookRefreshTrigger}
                />
              );
            case "presensi":
              return <MahasiswaPresensiMobile />;
            case "logbook":
              return (
                <MahasiswaLogbookMobile
                  onOpenCreateModal={() => setIsLogbookModalOpen(true)}
                  refreshTrigger={logbookRefreshTrigger}
                />
              );
            case "proker":
              return <MahasiswaProkerMobile onProkerCreated={fetchProkerList} />;
            case "profil":
              return <MahasiswaProfilMobile />;
            default:
              return (
                <MahasiswaMobileHome
                  onNavigateTab={handleTabChange}
                  onOpenLogbookModal={() => setIsLogbookModalOpen(true)}
                  refreshTrigger={logbookRefreshTrigger}
                />
              );
          }
        }}
      </MahasiswaMobileShell>

      {/* Global Logbook Modal */}
      <MahasiswaLogbookFormModal
        isOpen={isLogbookModalOpen}
        onClose={() => setIsLogbookModalOpen(false)}
        onSuccess={() => {
          setLogbookRefreshTrigger((prev) => prev + 1);
        }}
        prokerList={prokerList}
      />
    </IOSSafariGate>
  );
};

export default MahasiswaMobileApp;
