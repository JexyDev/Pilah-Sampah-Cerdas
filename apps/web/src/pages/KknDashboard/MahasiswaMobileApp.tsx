/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Master Mobile App Component for Mahasiswa KKN (React Web Mobile Experience)
 */

import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"beranda" | "presensi" | "logbook" | "proker" | "profil">("beranda");
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [prokerList, setProkerList] = useState<any[]>([]);

  useEffect(() => {
    fetchProkerList();
  }, []);

  const fetchProkerList = async () => {
    try {
      const res = await api.get("/dpl/program-kerja");
      setProkerList(res.data?.data || []);
    } catch {
      // Fallback
    }
  };

  return (
    <IOSSafariGate>
      <MahasiswaMobileShell activeTab={activeTab} onTabChange={setActiveTab}>
        {(tab) => {
          switch (tab) {
            case "beranda":
              return (
                <MahasiswaMobileHome
                  onNavigateTab={setActiveTab}
                  onOpenLogbookModal={() => setIsLogbookModalOpen(true)}
                />
              );
            case "presensi":
              return <MahasiswaPresensiMobile />;
            case "logbook":
              return (
                <MahasiswaLogbookMobile
                  onOpenCreateModal={() => setIsLogbookModalOpen(true)}
                />
              );
            case "proker":
              return <MahasiswaProkerMobile onProkerCreated={fetchProkerList} />;
            case "profil":
              return <MahasiswaProfilMobile />;
            default:
              return (
                <MahasiswaMobileHome
                  onNavigateTab={setActiveTab}
                  onOpenLogbookModal={() => setIsLogbookModalOpen(true)}
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
          // If in logbook tab, page can refresh
        }}
        prokerList={prokerList}
      />
    </IOSSafariGate>
  );
};

export default MahasiswaMobileApp;
