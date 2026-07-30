import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Truck,
  Home,
  Building2,
  GraduationCap,
  Users,
  Award,
  ChevronRight,
  Star,
} from "lucide-react";
import api from "../services/api";

interface LeaderboardItem {
  rank: number;
  name: string;
  subtitle?: string;
  points: number;
}

interface ColumnCardProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  barColor: string;
  items: LeaderboardItem[];
  maxPoints: number;
  linkTo?: string;
}

const ColumnCard: React.FC<ColumnCardProps> = ({
  title,
  icon,
  iconBg,
  barColor,
  items,
  maxPoints,
  linkTo = "/leaderboard",
}) => {
  const displayItems = items.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 h-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-xl ${iconBg} text-white shadow-xs shrink-0`}>
            {icon}
          </div>
          <h5 className="font-bold text-[13px] text-slate-800 tracking-tight truncate" title={title}>
            {title}
          </h5>
        </div>
        <Link
          to={linkTo}
          className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded-lg hover:bg-slate-100 shrink-0"
          title="Lihat Detail"
        >
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Item List evenly distributed */}
      <div className="my-2.5 flex-1 flex flex-col justify-between space-y-1">
        {displayItems.map((item) => {
          const pct = Math.min(100, Math.max(14, (item.points / (maxPoints || 1)) * 100));
          return (
            <div
              key={`${item.rank}-${item.name}`}
              className="flex items-center gap-2 text-[11px] group hover:bg-slate-50/80 px-1.5 py-1 rounded-lg transition-all"
            >
              {/* Rank */}
              <span className="w-4 text-center font-bold text-slate-400 shrink-0 text-[10px] group-hover:text-emerald-600">
                {item.rank}
              </span>

              {/* Name & Subtitle */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate text-[11px] leading-tight group-hover:text-emerald-700">
                  {item.name}
                </p>
                {item.subtitle && (
                  <p className="text-[9px] text-slate-400 truncate leading-none mt-0.5 font-medium">
                    {item.subtitle}
                  </p>
                )}
              </div>

              {/* Bar Indicator */}
              <div className="w-14 shrink-0 flex items-center justify-end">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 opacity-85 group-hover:opacity-100 shadow-xs"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>

              {/* Points */}
              <span className="w-14 text-right font-extrabold text-slate-700 text-[11px] shrink-0 font-mono">
                {item.points.toLocaleString("id-ID")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Card Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] shrink-0">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Real-time
        </span>
        <Link
          to={linkTo}
          className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-0.5"
        >
          Detail <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
};

export const LeaderboardWidget: React.FC = () => {
  // Default Full Mock Datasets (matching screenshot)
  const defaultWarga: LeaderboardItem[] = [
    { rank: 1, name: "Dewi Lestari", subtitle: "RW 06, Kel. Sekeloa", points: 12350 },
    { rank: 2, name: "Budi Hartono", subtitle: "RW 02, Kel. Dago", points: 9870 },
    { rank: 3, name: "Siti Aminah", subtitle: "RW 01, Kel. Sekeloa", points: 8420 },
    { rank: 4, name: "Rizky Maulana", subtitle: "RW 03, Kel. Cibeunying", points: 7560 },
    { rank: 5, name: "Ahmad Fauzi", subtitle: "RW 02, Kel. Sekeloa", points: 7120 },
    { rank: 6, name: "Tuti Handayani", subtitle: "RW 04, Kel. Cibeunying", points: 6780 },
    { rank: 7, name: "Rina Marlina", subtitle: "RW 01, Kel. Dago", points: 6450 },
    { rank: 8, name: "Hendra Wijaya", subtitle: "RW 05, Kel. Cipedes", points: 6230 },
    { rank: 9, name: "Yuniar", subtitle: "RW 08, Kel. Sekeloa", points: 5890 },
    { rank: 10, name: "Agus Setiawan", subtitle: "RW 03, Kel. Cibeunying", points: 5430 },
  ];

  const defaultPetugas: LeaderboardItem[] = [
    { rank: 1, name: "Dodi Kurniawan", subtitle: "Kel. Sekeloa", points: 8620 },
    { rank: 2, name: "Agus Salim", subtitle: "Kel. Dago", points: 7540 },
    { rank: 3, name: "Iwan Setiawan", subtitle: "Kel. Cibeunying", points: 6980 },
    { rank: 4, name: "Asep Saepudin", subtitle: "Kel. Cipedes", points: 6450 },
    { rank: 5, name: "Tedi Hermawan", subtitle: "Kel. Cibeunying", points: 6120 },
    { rank: 6, name: "Ujang Rehman", subtitle: "Kel. Dago", points: 5780 },
    { rank: 7, name: "Rahmat Hidayat", subtitle: "Kel. Sekeloa", points: 5430 },
    { rank: 8, name: "Deni Surya", subtitle: "Kel. Cipedes", points: 5190 },
    { rank: 9, name: "Yayan Sopiyan", subtitle: "Kel. Dago", points: 4860 },
    { rank: 10, name: "Cecep Maulana", subtitle: "Kel. Sekeloa", points: 4520 },
  ];

  const defaultRw: LeaderboardItem[] = [
    { rank: 1, name: "RW 01", subtitle: "Kel. Sekeloa", points: 24560 },
    { rank: 2, name: "RW 02", subtitle: "Kel. Dago", points: 21870 },
    { rank: 3, name: "RW 06", subtitle: "Kel. Sekeloa", points: 19420 },
    { rank: 4, name: "RW 03", subtitle: "Kel. Cibeunying", points: 18230 },
    { rank: 5, name: "RW 05", subtitle: "Kel. Cibeunying", points: 16870 },
    { rank: 6, name: "RW 04", subtitle: "Kel. Cipedes", points: 15430 },
    { rank: 7, name: "RW 07", subtitle: "Kel. Cipedes", points: 13980 },
    { rank: 8, name: "RW 08", subtitle: "Kel. Dago", points: 12570 },
    { rank: 9, name: "RW 09", subtitle: "Kel. Cibeunying", points: 10620 },
    { rank: 10, name: "RW 10", subtitle: "Kel. Cibeunying", points: 9340 },
  ];

  const defaultKelurahan: LeaderboardItem[] = [
    { rank: 1, name: "Kelurahan Sekeloa", points: 56230 },
    { rank: 2, name: "Kelurahan Dago", points: 49700 },
    { rank: 3, name: "Kelurahan Cibeunying", points: 45120 },
    { rank: 4, name: "Kelurahan Cipedes", points: 37800 },
    { rank: 5, name: "Kelurahan Lebakgede", points: 29780 },
    { rank: 6, name: "Kelurahan Sukajadi", points: 28680 },
    { rank: 7, name: "Kelurahan Pasirkaliki", points: 26480 },
    { rank: 8, name: "Kelurahan Tamansari", points: 23160 },
    { rank: 9, name: "Kelurahan Sukapura", points: 20340 },
    { rank: 10, name: "Kelurahan Pasirwangi", points: 18540 },
  ];

  const defaultMahasiswa: LeaderboardItem[] = [
    { rank: 1, name: "Andi Firmansyah", subtitle: "RW 01 / RT 02 (Kel. Sekeloa)", points: 7820 },
    { rank: 2, name: "Bella Saphira", subtitle: "RW 01 / RT 01 (Kel. Dago)", points: 7120 },
    { rank: 3, name: "Ciko Jeriko", subtitle: "RW 02 / RT 01 (Kel. Sekeloa)", points: 6880 },
    { rank: 4, name: "Dinda Aprilia", subtitle: "RW 03 / RT 02 (Kel. Cibeunying)", points: 6230 },
    { rank: 5, name: "Fajar Ramadhan", subtitle: "RW 04 / RT 01 (Kel. Cibeunying)", points: 5940 },
    { rank: 6, name: "Gina Nuraini", subtitle: "RW 05 / RT 02 (Kel. Cipedes)", points: 5780 },
    { rank: 7, name: "Muhammad Rayhan", subtitle: "RW 06 / RT 01 (Kel. Cipedes)", points: 5600 },
    { rank: 8, name: "Nabila Zahran", subtitle: "RW 07 / RT 01 (Kel. Dago)", points: 5210 },
    { rank: 9, name: "Ricki Ardiansyah", subtitle: "RW 08 / RT 01 (Kel. Dago)", points: 4980 },
    { rank: 10, name: "Putri Melati", subtitle: "RW 09 / RT 02 (Kel. Sekeloa)", points: 4750 },
  ];

  const defaultKelompok: LeaderboardItem[] = [
    { rank: 1, name: "Kelompok A", subtitle: "Kel. Sekeloa", points: 29680 },
    { rank: 2, name: "Kelompok B", subtitle: "Kel. Dago", points: 26430 },
    { rank: 3, name: "Kelompok C", subtitle: "Kel. Cibeunying", points: 24150 },
    { rank: 4, name: "Kelompok D", subtitle: "Kel. Cipedes", points: 21760 },
    { rank: 5, name: "Kelompok E", subtitle: "Kel. Dago", points: 20340 },
    { rank: 6, name: "Kelompok F", subtitle: "Kel. Cibeunying", points: 19120 },
    { rank: 7, name: "Kelompok G", subtitle: "Kel. Sekeloa", points: 17350 },
    { rank: 8, name: "Kelompok H", subtitle: "Kel. Cipedes", points: 15820 },
    { rank: 9, name: "Kelompok I", subtitle: "Kel. Dago", points: 14200 },
    { rank: 10, name: "Kelompok J", subtitle: "Kel. Sekeloa", points: 12870 },
  ];

  const defaultDpl: LeaderboardItem[] = [
    { rank: 1, name: "Dr. Ir. Rudi Hermawan, M.T.", points: 9420 },
    { rank: 2, name: "Dr. Siti Rahmawati, M.Si.", points: 8730 },
    { rank: 3, name: "Prof. Dr. Andi Setiawan, M.Sc.", points: 7980 },
    { rank: 4, name: "Dr. Nunik Kurniasih, S.T., M.T.", points: 7120 },
    { rank: 5, name: "Dr. Dodi Supriadi, M.Pd.", points: 6540 },
    { rank: 6, name: "Dr. Yulia Puspitasari, M.Kom.", points: 5980 },
    { rank: 7, name: "Dr. Asep Hidayat, S.E., M.M.", points: 5820 },
    { rank: 8, name: "Dr. Bambang Irawan, M.Sc.", points: 5230 },
    { rank: 9, name: "Dr. Rina Marlina, S.T., M.T.", points: 4890 },
    { rank: 10, name: "Dr. Hendra Wijaya, M.T.", points: 4520 },
  ];

  // Dynamic API state overlay
  const [wargaList, setWargaList] = useState<LeaderboardItem[]>(defaultWarga);
  const [petugasList, setPetugasList] = useState<LeaderboardItem[]>(defaultPetugas);
  const [rwList, setRwList] = useState<LeaderboardItem[]>(defaultRw);
  const [kelurahanList, setKelurahanList] = useState<LeaderboardItem[]>(defaultKelurahan);
  const [mahasiswaList, setMahasiswaList] = useState<LeaderboardItem[]>(defaultMahasiswa);
  const [kelompokList, setKelompokList] = useState<LeaderboardItem[]>(defaultKelompok);
  const [dplList, setDplList] = useState<LeaderboardItem[]>(defaultDpl);

  useEffect(() => {
    fetchLiveLeaderboards();
  }, []);

  const fetchLiveLeaderboards = async () => {
    try {
      const res = await api.get("/gamification/leaderboard");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.citizens && d.citizens.length > 0) {
          const apiWarga = d.citizens.map((c: any, i: number) => ({
            rank: i + 1,
            name: c.name,
            subtitle: c.wilayah || "Sekeloa",
            points: c.totalPoints || 0,
          }));
          setWargaList(apiWarga);
        }
        if (d.pengangkut && d.pengangkut.length > 0) {
          const apiPetugas = d.pengangkut.map((p: any, i: number) => ({
            rank: i + 1,
            name: p.name,
            subtitle: p.wilayah || "Sekeloa",
            points: p.totalPoints || 0,
          }));
          setPetugasList(apiPetugas);
        }
        if (d.rtRw && d.rtRw.length > 0) {
          const apiRw = d.rtRw.map((r: any, i: number) => ({
            rank: i + 1,
            name: r.rtRwName || `RW 0${i + 1}`,
            subtitle: `Kel. ${r.kelurahanName || "Sekeloa"}`,
            points: r.totalPoints || 0,
          }));
          setRwList(apiRw);
        }
        if (d.regions && d.regions.length > 0) {
          const apiKel = d.regions.map((k: any, i: number) => ({
            rank: i + 1,
            name: `Kelurahan ${k.kelurahanName}`,
            points: k.totalPoints || 0,
          }));
          setKelurahanList(apiKel);
        }
      }

      const resKkn = await api.get("/gamification/leaderboard-kkn");
      if (resKkn.data?.success && resKkn.data.data) {
        const d = resKkn.data.data;
        if (d.students && d.students.length > 0) {
          const apiMhs = d.students.map((s: any, i: number) => ({
            rank: i + 1,
            name: s.name,
            subtitle: s.kelompok ? `Kelompok ${s.kelompok}` : "Kel. Sekeloa",
            points: s.finalScore || 0,
          }));
          setMahasiswaList(apiMhs);
        }
        if (d.groups && d.groups.length > 0) {
          const apiGrp = d.groups.map((g: any, i: number) => ({
            rank: i + 1,
            name: g.name,
            subtitle: "Kel. Sekeloa",
            points: g.avgScore || 0,
          }));
          setKelompokList(apiGrp);
        }
        if (d.dpl && d.dpl.length > 0) {
          const apiDpl = d.dpl.map((dp: any, i: number) => ({
            rank: i + 1,
            name: dp.name,
            subtitle: `DPL (${dp.totalGroups || 0} Kelompok)`,
            points: dp.points || 0,
          }));
          setDplList(apiDpl);
        }
      }
    } catch (e) {
      console.warn("Error fetching live leaderboard from API:", e);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* GRUP 1 — Top 10 Warga & Wilayah */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
            <Star size={16} className="fill-current" />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-800 tracking-tight leading-tight">
              Grup 1 — Top 10 Warga & Wilayah
            </h3>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Ranking dan performa warga serta wilayah berdasarkan perolehan poin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
          {/* 1. Top 10 Warga */}
          <ColumnCard
            title="Top 10 Warga"
            icon={<User size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={wargaList}
            maxPoints={wargaList[0]?.points || 12350}
          />

          {/* 2. Top 10 Petugas Residu */}
          <ColumnCard
            title="Top 10 Petugas Residu"
            icon={<Truck size={14} />}
            iconBg="bg-rose-500"
            barColor="#ef4444"
            items={petugasList}
            maxPoints={petugasList[0]?.points || 8620}
          />

          {/* 3. Top 10 RW */}
          <ColumnCard
            title="Top 10 RW"
            icon={<Home size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={rwList}
            maxPoints={rwList[0]?.points || 24560}
          />

          {/* 4. Top 10 Kelurahan */}
          <ColumnCard
            title="Top 10 Kelurahan"
            icon={<Building2 size={14} />}
            iconBg="bg-blue-600"
            barColor="#3b82f6"
            items={kelurahanList}
            maxPoints={kelurahanList[0]?.points || 56230}
          />
        </div>
      </div>

      {/* GRUP 2 — Top 10 Akademik & Pendampingan */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-700 text-white shadow-xs">
            <GraduationCap size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-800 tracking-tight leading-tight">
              Grup 2 — Top 10 Akademik & Pendampingan
            </h3>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Ranking dan performa peserta dari ekosistem pendampingan mahasiswa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
          {/* 1. Top 10 Mahasiswa */}
          <ColumnCard
            title="Top 10 Mahasiswa"
            icon={<GraduationCap size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={mahasiswaList}
            maxPoints={mahasiswaList[0]?.points || 7820}
          />

          {/* 2. Top 10 Kelompok Mahasiswa */}
          <ColumnCard
            title="Top 10 Kelompok Mahasiswa"
            icon={<Users size={14} />}
            iconBg="bg-emerald-600"
            barColor="#10b981"
            items={kelompokList}
            maxPoints={kelompokList[0]?.points || 29680}
          />

          {/* 3. Top 10 Dosen Pendamping Lapangan (DPL) */}
          <ColumnCard
            title="Top 10 Dosen Pendamping Lapangan (DPL)"
            icon={<Award size={14} />}
            iconBg="bg-teal-600"
            barColor="#10b981"
            items={dplList}
            maxPoints={dplList[0]?.points || 9420}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardWidget;
