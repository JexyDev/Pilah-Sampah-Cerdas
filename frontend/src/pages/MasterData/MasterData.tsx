/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import { Loader2, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { useMasterDataStore } from "../../store/useMasterDataStore";
import styles from "./MasterData.module.css";

const MasterData: React.FC = () => {
  const { users, bins, isLoading, error, fetchMasterData, deleteUser, deleteBin } =
    useMasterDataStore();
  const [activeTab, setActiveTab] = useState<"users" | "bins">("users");

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus ${name}?`)) {
      try {
        await deleteUser(id);
        toast.success(`Berhasil menghapus ${name}`);
      } catch (e: any) {
        toast.error("Gagal menghapus user");
      }
    }
  };

  const handleDeleteBin = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus ${name}?`)) {
      try {
        await deleteBin(id);
        toast.success(`Berhasil menghapus ${name}`);
      } catch (e: any) {
        toast.error("Gagal menghapus tong sampah");
      }
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} color="var(--primary-green)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
        <button className={styles.btnPrimary} onClick={fetchMasterData}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Master Data</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "users" ? styles.active : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Data Warga & Staff
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "bins" ? styles.active : ""}`}
          onClick={() => setActiveTab("bins")}
        >
          Data Tong Sampah
        </button>
      </div>

      <div className={styles.tableContainer}>
        {activeTab === "users" && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Role</th>
                <th>Poin</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td>{u.totalPoin}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        title="Edit"
                        onClick={() => toast("Fitur Edit belum tersedia")}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        title="Hapus"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "bins" && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Tong</th>
                <th>Kapasitas Max (L)</th>
                <th>Volume (L)</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.qrCode}</td>
                  <td>{b.maxCapacityLiter}</td>
                  <td>{b.currentVolumeLiter}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[b.status]}`}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        title="Edit"
                        onClick={() => toast("Fitur Edit belum tersedia")}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        title="Hapus"
                        onClick={() => handleDeleteBin(b.id, b.qrCode)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MasterData;
