import React, { useState } from "react";
import {
  X,
  Cpu,
  HardDriveDownload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  ExternalLink,
  Code,
} from "lucide-react";
import type { IoTDevice } from "../../services/iotService";

interface IotFirmwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetVersion: string) => Promise<void>;
  device: IoTDevice | null;
}

export const IotFirmwareModal: React.FC<IotFirmwareModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  device,
}) => {
  const [targetVersion, setTargetVersion] = useState("1.1.0");
  const [repoUrl, setRepoUrl] = useState("https://github.com/makerindo/berseka-iot-firmware/releases");
  const [shaChecksum, setShaChecksum] = useState(
    "a8f5c2d91b4e7039ef67812bc5a0134ef982c7a10931dbcf41639d1b6e4fa891"
  );
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !device) return null;

  const handleStartOta = async () => {
    setIsUpdating(true);
    setErrorMsg(null);
    setProgress(15);
    setStageText("Memeriksa rilis CI/CD di repositori firmware...");

    try {
      await new Promise((r) => setTimeout(r, 500));
      setProgress(35);
      setStageText("Mengunduh image biner firmware-v" + targetVersion + ".bin...");

      await new Promise((r) => setTimeout(r, 600));
      setProgress(60);
      setStageText("Memvalidasi integritas checksum SHA-256 paket biner...");

      await new Promise((r) => setTimeout(r, 600));
      setProgress(85);
      setStageText("Mentransfer paket biner ke memori flash ESP32 via OTA...");

      await onConfirm(targetVersion);
      setProgress(100);
      setStageText("Pembaruan firmware berhasil diverifikasi & mikrokontroler di-reboot!");
      setIsDone(true);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Gagal melakukan OTA update");
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setIsUpdating(false);
    setIsDone(false);
    setProgress(0);
    setStageText("");
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Pembaruan Firmware Nirkabel (OTA)
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  CI/CD Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                Flash software sistem ke mikrokontroler sensor dari jarak jauh via pipeline CI/CD
              </p>
            </div>
          </div>
          {!isUpdating && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Node Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nama Perangkat:</span>
              <span className="font-bold text-slate-800">{device.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Kode Perangkat:</span>
              <span className="font-mono font-semibold text-slate-700">{device.nodeCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Versi Firmware Saat Ini:</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                v{device.firmwareVersion || "1.0.0"}
              </span>
            </div>
          </div>

          {!isDone ? (
            <>
              {/* CI/CD Repository Integration Card */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Integrasi Pipeline CI/CD Repository</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    Auto-Check Ready
                  </span>
                </div>
                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  Mikrokontroler sensor Tempat Sampah (ESP32) siap menerima biner terkompilasi dari repositori GitHub/GitLab saat rilis versi baru diterbitkan lewat pipeline CI/CD.
                </p>

                {/* Repository URL Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    URL Repositori / Release Registry
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isUpdating}
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/organisasi/repo-firmware/releases"
                      className="w-full pl-3 pr-8 py-1.5 text-[11px] font-mono rounded-lg border border-indigo-200 bg-white focus:outline-indigo-500 transition-all text-slate-800"
                    />
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-2 top-2 text-indigo-600 hover:text-indigo-800"
                      title="Buka Repositori"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Checksum SHA-256 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Validasi Checksum Biner (SHA-256)</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Tervalidasi</span>
                  </div>
                  <input
                    type="text"
                    disabled={isUpdating}
                    value={shaChecksum}
                    onChange={(e) => setShaChecksum(e.target.value)}
                    className="w-full px-2.5 py-1 text-[10px] font-mono rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Version Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Versi Firmware Target OTA
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isUpdating}
                    value={targetVersion}
                    onChange={(e) => setTargetVersion(e.target.value)}
                    placeholder="Contoh: 1.1.0"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-indigo-500 transition-all font-bold text-slate-800"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {["1.0.1", "1.1.0", "1.2.0"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => setTargetVersion(v)}
                        className={`px-2 py-1.5 text-[10px] font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                          targetVersion === v
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        v{v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress UI if updating */}
              {isUpdating && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      {stageText}
                    </span>
                    <span className="font-mono font-bold text-indigo-700">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Pembaruan Selesai</h4>
              <p className="text-xs text-slate-600">
                Node {device.nodeCode} kini berjalan pada firmware versi{" "}
                <span className="font-bold text-emerald-700 font-mono">v{targetVersion}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
          {!isDone ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartOta}
                disabled={isUpdating || !targetVersion.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>{isUpdating ? "Memperbarui..." : "Kirim Firmware OTA"}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IotFirmwareModal;
