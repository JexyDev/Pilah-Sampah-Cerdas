import { Edit, CheckCircle2, RefreshCw, AlertTriangle, Save } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

interface SystemConfig {
  key: string;
  value: string;
  tipe: string;
  deskripsi: string;
}

export const ManageConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [newValue, setNewValue] = useState<string>("");
  const [escalationDays, setEscalationDays] = useState<number>(3);
  const [workflowLevels, setWorkflowLevels] = useState<string[]>(["RW", "ADMIN_DLH"]);

  const fetchConfigs = async () => {
    try {
      const res = await api.get("/configs");
      if (res.data.success) {
        setConfigs(res.data.data);
        
        // Parse workflow configs if exists
        const workflow = res.data.data.find((c: any) => c.key === "workflow_escalation_facilities");
        if (workflow) {
          try {
            const parsed = JSON.parse(workflow.value);
            setEscalationDays(parsed.escalationDays || 3);
            setWorkflowLevels(parsed.levels || ["RW", "ADMIN_DLH"]);
          } catch (e) {
            console.error("Gagal parsing konfigurasi workflow");
          }
        }
      }
    } catch (error) {
      console.error("Gagal memuat konfigurasi:", error);
      toast.error("Gagal memuat sistem parameter");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleUpdateConfig = async (key: string, value: string) => {
    try {
      const res = await api.post(
        "/configs",
        { key, value }
      );
      if (res.data.success) {
        toast.success("Konfigurasi berhasil disimpan");
        fetchConfigs();
        setSelectedConfig(null);
      }
    } catch (error) {
      console.error("Gagal memperbarui konfigurasi:", error);
      toast.error("Gagal menyimpan konfigurasi");
    }
  };

  const handleSaveWorkflow = async () => {
    const value = JSON.stringify({
      escalationDays,
      levels: workflowLevels,
    });
    await handleUpdateConfig("workflow_escalation_facilities", value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Rule Engine & Parameter Sistem</h1>
        <p className="text-sm text-gray-500 mt-1">Konfigurasi formula gamifikasi, threshold AI, dan alur eskalasi otomatis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Parameter Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Daftar Parameter System</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Nama Kunci (Key)</th>
                  <th className="px-6 py-3">Nilai Konfigurasi</th>
                  <th className="px-6 py-3">Deskripsi</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {configs.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-primary font-bold">{c.key}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate">{c.value}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{c.deskripsi || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedConfig(c);
                          setNewValue(c.value);
                        }}
                        className="text-primary hover:text-primary-dark font-semibold text-xs flex items-center gap-1 ml-auto"
                      >
                        <Edit size={16} />
                        Ubah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Parameter Panel / Workflow Designer */}
        <div className="space-y-6">
          {/* Edit Parameter Panel */}
          {selectedConfig && (
            <div className="bg-white p-6 rounded-2xl border border-primary/20 shadow-md space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary">Edit Parameter</span>
                <h3 className="text-sm font-extrabold text-gray-900 font-mono mt-1">{selectedConfig.key}</h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Nilai Parameter</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedConfig(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleUpdateConfig(selectedConfig.key, newValue)}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          )}

          {/* Escalation Workflow Configurator */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Approval Berjenjang Otomatis</h3>
              <p className="text-xs text-gray-500 mt-1">Atur eskalasi otomatis pengajuan fasilitas warga.</p>
            </div>

            {/* Config Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Waktu Eskalasi (Hari)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={escalationDays}
                  onChange={(e) => setEscalationDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
                <span className="text-[10px] text-gray-400">Jumlah hari sebelum eskalasi ke hierarki atasnya otomatis dipicu</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Hierarki Tingkat Approval</label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                    <span>1. Input (Mahasiswa)</span>
                    <CheckCircle2 className="text-green-500" size={16} />
                  </div>
                  <div className="w-0.5 h-3 bg-gray-300 ml-2"></div>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                    <span>2. Reviewer (RW)</span>
                    <RefreshCw className="text-blue-500" size={16} />
                  </div>
                  <div className="w-0.5 h-3 bg-gray-300 ml-2"></div>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                    <span>3. Escalated (Admin DLH)</span>
                    <AlertTriangle className="text-purple-500" size={16} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveWorkflow}
                className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={18} />
                Simpan Alur Workflow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
