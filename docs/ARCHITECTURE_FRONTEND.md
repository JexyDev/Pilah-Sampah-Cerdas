# ARCHITECTURE_FRONTEND.md — apps/frontend

> Tech stack: React + Vite (sesuaikan jika beda, misal Next.js) + TypeScript
> Pola: Feature-based architecture + separation of concerns (UI, state, API terpisah jelas)

---

## 1. Struktur Folder (WAJIB)

```
apps/frontend/
├── src/
│   ├── app/                        # Setup aplikasi: routing, providers global
│   │   ├── routes/
│   │   │   └── AppRouter.tsx
│   │   ├── providers/
│   │   │   └── AppProviders.tsx     # QueryClient, Theme, Auth context, dll
│   │   └── App.tsx
│   │
│   ├── features/                    # Setiap fitur = 1 folder mandiri
│   │   └── schedule/
│   │       ├── components/          # Komponen UI khusus fitur ini
│   │       │   ├── ScheduleCard.tsx
│   │       │   └── ScheduleForm.tsx
│   │       ├── hooks/                # Custom hooks khusus fitur
│   │       │   └── useSchedule.ts
│   │       ├── api/                  # Fungsi pemanggil API (fetch/axios)
│   │       │   └── scheduleApi.ts
│   │       ├── types/
│   │       │   └── schedule.types.ts
│   │       └── index.ts              # Export publik fitur ini
│   │
│   ├── shared/                       # Dipakai lintas fitur
│   │   ├── components/               # Button, Modal, Input, dll (design system)
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── constants/
│   │
│   ├── lib/                          # Konfigurasi library eksternal
│   │   ├── axios.ts                  # instance axios + interceptor
│   │   └── queryClient.ts            # React Query config
│   │
│   ├── layouts/
│   │   └── MainLayout.tsx
│   │
│   └── assets/
│       ├── images/
│       └── styles/
│
├── public/
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 2. Prinsip Utama

1. **Feature-based, bukan type-based.** Jangan buat folder besar `components/`, `hooks/`, `api/` berisi campur semua fitur — kelompokkan per fitur di `features/`.
2. **Komponen UI tidak boleh langsung fetch API.** Alurnya: `Component` → `custom hook` → `api function` → axios instance.
3. **State server (data dari API) dan state UI (misal: modal terbuka/tertutup) dipisah:**
   - State server → React Query / TanStack Query
   - State UI lokal → `useState`/`useReducer`
   - State global lintas fitur (jika perlu) → Zustand/Context, letakkan di `shared/` atau `app/providers`
4. **Tidak ada logic bisnis/kalkulasi kompleks di dalam JSX.** Ekstrak ke custom hook atau util function.
5. **Komponen `shared/components` harus generic** (tidak tahu soal fitur spesifik seperti "schedule"), supaya reusable di fitur manapun.

---

## 3. Konvensi Penamaan

| Elemen | Konvensi | Contoh |
|--------|----------|--------|
| Komponen | PascalCase | `ScheduleCard.tsx` |
| Custom hook | camelCase, prefix `use` | `useSchedule.ts` |
| Fungsi API | camelCase, suffix jelas | `fetchSchedules()`, `createSchedule()` |
| Folder fitur | kebab-case/lowercase | `features/schedule` |
| Type/Interface | PascalCase, suffix jelas | `ScheduleResponse`, `ScheduleFormValues` |

---

## 4. Standar Pemanggilan API

```ts
// features/schedule/api/scheduleApi.ts
import { axiosInstance } from '@/lib/axios';
import type { ScheduleResponse } from '../types/schedule.types';

export const scheduleApi = {
  getActive: async (): Promise<ScheduleResponse> => {
    const { data } = await axiosInstance.get('/schedules/active');
    return data.data; // ambil dari .data karena backend selalu bungkus { success, data }
  },
};
```

```ts
// features/schedule/hooks/useSchedule.ts
import { useQuery } from '@tanstack/react-query';
import { scheduleApi } from '../api/scheduleApi';

export const useActiveSchedule = () =>
  useQuery({
    queryKey: ['schedule', 'active'],
    queryFn: scheduleApi.getActive,
  });
```

**Aturan:** komponen hanya memanggil `useActiveSchedule()`, tidak pernah memanggil `scheduleApi` atau `axios` langsung.

---

## 5. Error & Loading Handling (WAJIB di Setiap Fitur yang Fetch Data)

Setiap komponen yang menampilkan data dari API wajib menangani 3 kondisi eksplisit:
```tsx
if (isLoading) return <LoadingState />;
if (isError) return <ErrorState message={error.message} />;
if (!data || data.length === 0) return <EmptyState />;
return <ScheduleList data={data} />;
```
Tidak boleh ada komponen yang langsung asumsikan data selalu ada.

---

## 6. Checklist Sebelum Menambah Fitur Frontend Baru

```
[ ] Folder fitur baru dibuat di features/<nama-fitur>
[ ] Komponen tidak fetch API langsung (lewat custom hook)
[ ] Loading, error, dan empty state ditangani di UI
[ ] Tidak ada style inline berantakan (pakai design system di shared/components)
[ ] Type/interface data API didefinisikan jelas (tidak pakai `any`)
[ ] Sudah dites manual: normal, data kosong, koneksi lambat/gagal
```

---

## 7. Portal Web Monitoring & Autentikasi Role

### 7.1 Form Login Universal (No HP +62)
- Seluruh 9 Role (Super Admin, Admin DLH, Camat, Lurah, RW, DPL, Mahasiswa KKN, Petugas Residu, Warga) melakukan autentikasi melalui **Input Nomor Telepon (+62)** dan **OTP WhatsApp / Kredensial Password**.
- NIM (Mahasiswa) dan NIP (DPL) dapat ditampilkan pada Profil User / Badge UI.

### 7.2 Cakupan Dashboard Web (`apps/web`)
1. **DPL (Dosen Pembimbing Lapangan):** Dashboard monitoring progres mahasiswa KKN bimbingan, verifikasi logbook, dan statistik dampingan warga.
2. **Petugas Residu:** Portal Web Monitoring timbulan residu, log hasil timbangan manual, dan monitoring pengaduan/eskalasi penjemputan.
3. **Admin DLH & Camat & Lurah:** Portal Web Monitoring (Read-Only) berbasis scoping wilayah (Kota, Kecamatan, Kelurahan) + Modal Approval Diskrepansi AI khusus DLH.
4. **RW & Mahasiswa KKN:** Portal pengelolaan aktivasi tempat sampah (QR Bins) & pendaftaran warga.
5. **Super Admin:** Master data management (Bulk KKN/DPL, configurator sistem, audit log).

