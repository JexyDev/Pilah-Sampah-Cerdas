# Laporan Bug & Solusi Backend: Durasi Presensi Melompat Jauh

## 🐞 Penjelasan Bug
Bug "durasi aktual melompat jauh (contoh: tiba-tiba 7 Jam 43 Menit) padahal baru masuk" disebabkan oleh logika `pingLocation` di backend yang secara tidak sengaja membaca durasi dari jadwal di hari sebelumnya yang tersangkut (status `TERJEDA`).

Secara detail:
1. Saat aplikasi mobile mengirim ping lokasi, backend melooping semua `activeSchedules` (bisa termasuk jadwal hari ini dan jadwal kemarin yang statusnya belum selesai).
2. Di dalam loop `pingLocation`, backend menghitung durasi live untuk masing-masing jadwal menggunakan fungsi `calculateLiveInZoneMinutes()`.
3. Hasil akhir `inZoneMinutes` yang dikirim kembali ke aplikasi mobile diambil menggunakan `Math.max(inZoneMinutes, durationInZone)` dari **semua jadwal aktif**. 
4. Jika ada jadwal kemarin yang belum di-checkout (berstatus `TERJEDA`) dengan durasi tersimpan sangat besar (contoh 463 menit / 7 Jam 43 menit), maka `Math.max` akan mengambil nilai raksasa tersebut.
5. Aplikasi mobile menerima nilai 463 menit dari backend, lalu langsung menimpa timer lokalnya dan menampilkan "Hadir & Memenuhi" karena menganggap durasi target (mis. 240 menit) sudah terlampaui.
6. Saat mahasiswa menekan "Selesai Kegiatan", aplikasi mobile mengirimkan angka 463 menit ini kembali ke backend, sehingga data yang rusak tersimpan ke database untuk sesi hari ini.

Selain itu, variabel `currentScheduleId` yang dikembalikan dari `pingLocation` kadang-kadang memprioritaskan jadwal yang salah jika mahasiswa memiliki beberapa jadwal aktif di rentang waktu yang berdekatan.

---

## 🛠️ Perintah untuk Tim Backend
Tolong sampaikan instruksi ini ke tim backend agar mereka menerapkan perbaikan berikut pada file `main/apps/api/src/services/kknAttendanceService.ts`.

### 1. Perbaikan pada penentuan `currentScheduleId` (Baris ~577)

**Sebelumnya:**
```typescript
    let currentScheduleId = activeSchedules.length > 0 ? activeSchedules[0].id : null;
    if (!currentScheduleId) {
      const activeAtt = await prisma.activityAttendance.findFirst({
        where: {
          studentId: userId,
          status: { in: ["BERLANGSUNG", "TERJEDA"] },
        },
      });
      if (activeAtt) {
        currentScheduleId = activeAtt.scheduleId;
      }
    }
```

**Ubah menjadi:**
```typescript
    let currentScheduleId = null;
    
    // 1. Cari attendance aktif yang sedang dijalankan user (BERLANGSUNG atau TERJEDA)
    const activeAtt = await prisma.activityAttendance.findFirst({
      where: {
        studentId: userId,
        status: { in: ["BERLANGSUNG", "TERJEDA"] },
      },
      orderBy: { attendedAt: "desc" }
    });
    
    if (activeAtt) {
      currentScheduleId = activeAtt.scheduleId;
    } else if (activeSchedules.length > 0) {
      // 2. Jika tidak ada yang sedang berjalan, pastikan memprioritaskan jadwal HARI INI
      const todaySch = activeSchedules.find(s => {
        const d = new Date(s.date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return d === todayWibStrPing;
      });
      currentScheduleId = todaySch ? todaySch.id : activeSchedules[0].id;
    }
```

### 2. Perbaikan pada kalkulasi akumulasi `inZoneMinutes` (Baris ~573)

Untuk mencegah backend mencampuradukkan durasi jadwal hari ini dengan jadwal masa lalu yang tersangkut.

**Sebelumnya:**
```typescript
          } // penutup blok update
          inZoneMinutes = Math.max(inZoneMinutes, durationInZone);
        }
      }
    }
```

**Ubah menjadi:**
```typescript
          }

          // Hanya ambil durasi jika sesuai dengan schedule yang sedang dikerjakan saat ini
          // atau jika belum ada sesi aktif, hindari penggabungan silang (cross-merging)
          if (activeAtt && activeAtt.scheduleId === sch.id) {
            inZoneMinutes = durationInZone;
          } else if (!activeAtt) {
            inZoneMinutes = Math.max(inZoneMinutes, durationInZone);
          }
        }
      }
    }
```

*(Catatan: pastikan variabel `activeAtt` yang dibuat di perbaikan nomor 1 dipindahkan deklarasinya **ke atas loop `for (const sch of activeSchedules)`** agar bisa digunakan di dalam loop ini).*

### 3. Perbaikan Auto-Checkout `mulaiKegiatan` (Baris ~3025)

Bantu memastikan sesi `TERJEDA` dari hari sebelumnya juga ikut tertutup secara otomatis saat mahasiswa menekan tombol mulai kegiatan baru di hari ini.

**Sebelumnya:**
```typescript
    const activeOtherSession = await prisma.activityAttendance.findFirst({
      where: {
        studentId: studentUserId,
        scheduleId: { not: scheduleId },
        checkOutAt: null,
        status: "BERLANGSUNG",
      },
    });
```

**Ubah menjadi:**
```typescript
    const activeOtherSession = await prisma.activityAttendance.findFirst({
      where: {
        studentId: studentUserId,
        scheduleId: { not: scheduleId },
        checkOutAt: null,
        status: { in: ["BERLANGSUNG", "TERJEDA", "DI_ZONA", "DALAM_RADIUS"] },
      },
    });
```
