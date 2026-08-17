import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search, Loader2, Eye, Edit3 } from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import EditSurveiModal from "./EditSurveiModal";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

interface DataSurveiKknProps {
  type?: "BASELINE" | "ENDLINE";
}

export default function DataSurveiKkn({ type: propType }: DataSurveiKknProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const isEndline =
    propType === "ENDLINE" ||
    location.pathname.includes("endline") ||
    searchParams.get("type")?.toUpperCase() === "ENDLINE" ||
    searchParams.get("tipe")?.toUpperCase() === "ENDLINE";

  const [surveys, setSurveys] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEditKelurahanId, setSelectedEditKelurahanId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const limit = 10;

  const fetchSurveys = async (page: number, search: string = "") => {
    setIsLoading(true);
    try {
      if (isEndline) {
        const response = await api.get(`/evaluasi-dampak/endline`);
        if (response.data.success && Array.isArray(response.data.data)) {
          let data = response.data.data;
          if (search) {
            data = data.filter((d: any) =>
              (d.namaKelurahan || "").toLowerCase().includes(search.toLowerCase())
            );
          }
          const total = data.length;
          const totalPages = Math.ceil(total / limit) || 1;
          const paginated = data.slice((page - 1) * limit, page * limit);
          setSurveys(paginated);
          setMeta({ page, limit, total, totalPages });
        }
      } else {
        const response = await api.get(`/survei-kkn`, {
          params: { page, limit, search },
        });
        if (response.data.success) {
          setSurveys(response.data.data);
          setMeta(response.data.meta);
        }
      }
    } catch (error: any) {
      console.error(error);
      showToast.error(error.response?.data?.message || "Gagal memuat data survei");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchSurveys(1, searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, isEndline]);

  useEffect(() => {
    if (!searchQuery) {
      fetchSurveys(currentPage, "");
    }
  }, [currentPage, isEndline]);

  const handleOpenDetail = (kelurahanId: number) => {
    navigate(`/superUser/data-survei-kkn/${kelurahanId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isEndline ? "Data Survei Endline" : "Data Survei Baseline"}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border ${
                isEndline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {isEndline ? "🟢 Survei Akhir (Endline)" : "🔵 Survei Awal (Baseline)"}
            </span>
          </div>
          <p className="text-slate-500 mt-2 font-medium">
            {isEndline
              ? "Manajemen data hasil survei evaluasi akhir (Endline) pemilahan sampah dan dampak program pasca-kegiatan KKN."
              : "Manajemen data hasil survei kondisi awal (Baseline) pemilahan sampah dan profil kelurahan oleh mahasiswa KKN."}
          </p>
        </div>

        {/* Search & Actions */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Cari berdasarkan nama kelurahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] focus:border-transparent transition-all font-medium text-slate-700 placeholder-slate-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
          <div className="flex gap-3">
            <div className="bg-[#009966]/10 text-[#009966] px-4 py-2 rounded-xl font-bold text-sm border border-[#009966]/20">
              Total Data: {meta?.total || 0} Kelurahan
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kelurahan</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kecamatan</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal Survei</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Enumerator</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Jml RW/RT</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && surveys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Loader2 className="animate-spin text-[#009966] mx-auto mb-3" size={32} />
                      <span className="text-slate-500 font-medium">Memuat data survei...</span>
                    </td>
                  </tr>
                ) : surveys.length === 0 ? (
                  <EmptyTableState
                    colSpan={7}
                    entityName={isEndline ? "Survei Endline" : "Survei Baseline"}
                    isSearch={!!searchQuery}
                    searchQuery={searchQuery}
                    onResetSearch={() => setSearchQuery("")}
                  />
                ) : (
                  surveys.map((survey, index) => (
                    <tr key={survey.kelurahanId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-800 text-[15px]">{survey.namaKelurahan}</span>
                        {survey._count?.keyPlayers > 0 && (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                              {survey._count.keyPlayers} Aktor Tersimpan
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">{survey.kecamatan || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {survey.tanggalSurvei ? new Date(survey.tanggalSurvei).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{survey.enumerator || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded border border-slate-200">
                            RW: {survey.jumlahRw || 0}
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded border border-slate-200">
                            RT: {survey.jumlahRt || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(user?.peran === "SUPER_USER" || user?.peran === "PANITIA_TASKFORCE") && (
                            <button
                              onClick={() => {
                                setSelectedEditKelurahanId(survey.kelurahanId);
                                setIsEditModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all font-bold text-xs cursor-pointer shadow-2xs"
                              title="Edit Data Survei"
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(survey.kelurahanId)}
                            className="inline-flex items-center gap-1.5 bg-white border-2 border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:border-[#009966] hover:text-[#009966] transition-all font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            <Eye size={14} /> Lihat Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta && meta.total > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={meta.totalPages || 1}
              totalItems={meta.total}
              itemsPerPage={limit}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </div>

      {/* Edit Survei Modal */}
      {selectedEditKelurahanId && (
        <EditSurveiModal
          isOpen={isEditModalOpen}
          kelurahanId={selectedEditKelurahanId}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEditKelurahanId(null);
          }}
          onSuccess={() => {
            fetchSurveys(currentPage, searchQuery);
          }}
        />
      )}
    </div>
  );
}
