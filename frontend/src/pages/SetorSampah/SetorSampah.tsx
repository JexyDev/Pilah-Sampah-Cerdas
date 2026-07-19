/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, QrCode, CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { predictWaste } from '../../services/aiService';

type Step = 
  | 'INTRO' 
  | 'CAMERA_PERMISSION_GUIDE' 
  | 'TAKE_PHOTO' 
  | 'REVIEW_PHOTO' 
  | 'AI_PROCESSING' 
  | 'AI_RESULT' 
  | 'SCAN_QR' 
  | 'SUBMITTING' 
  | 'SUCCESS' 
  | 'ERROR';

type PermissionState = 'PENDING' | 'GRANTED' | 'DENIED' | 'NOT_SUPPORTED';

export default function SetorSampah() {
  const [step, setStep] = useState<Step>('INTRO');
  const [permissionState, setPermissionState] = useState<PermissionState>('PENDING');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<{ jenis_sampah: string; estimasi_volume: number; confidence?: number; quotaRemaining?: number } | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Geolocation
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  // Bins for simulation / fallback lists
  const [availableBins, setAvailableBins] = useState<any[]>([]);
  const [selectedSimulatedBin, setSelectedSimulatedBin] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrVideoRef = useRef<HTMLVideoElement>(null);
  
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const codeReader = useRef(new BrowserQRCodeReader());
  const [scanControls, setScanControls] = useState<any>(null);

  // Load bins and fetch user location
  useEffect(() => {
    fetchAvailableBins();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.warn('Geolocation error:', err.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchAvailableBins = async () => {
    try {
      const res = await api.get('/bins/my-bins');
      if (res.data?.success) {
        setAvailableBins(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bins:', err);
    }
  };

  // Start direct WebRTC camera for taking waste photo
  const startWasteCamera = async () => {
    try {
      setStep('INTRO'); // Maintain state in UI but display loading
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      setCameraStream(stream);
      setPermissionState('GRANTED');
      setStep('TAKE_PHOTO');
    } catch (error: any) {
      console.error('Direct camera access failed:', error);
      stopCamera();
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('DENIED');
        setStep('CAMERA_PERMISSION_GUIDE');
      } else {
        setPermissionState('NOT_SUPPORTED');
        setStep('CAMERA_PERMISSION_GUIDE');
      }
    }
  };

  // Attach stream to video tag once stream state updates
  useEffect(() => {
    if (step === 'TAKE_PHOTO' && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.error('Play video error:', e));
    }
  }, [step, cameraStream]);

  // Capture frame from the video stream
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured_waste.jpg', { type: 'image/jpeg' });
            setPreviewUrl(URL.createObjectURL(file));
            setCapturedFile(file);
            stopCamera();
            setStep('REVIEW_PHOTO');
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleFallbackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      setCapturedFile(file);
      setStep('REVIEW_PHOTO');
    }
  };

  // Compress & Detect Waste via Backend AI Service
  const runAiDetection = async () => {
    if (!capturedFile) return;

    try {
      setStep('AI_PROCESSING');
      
      // Image compression to max 1MB
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(capturedFile, options);
      
      // Call backend via the predictive service wrapper
      const result = await predictWaste(compressedFile);
      setAiResult(result);
      setStep('AI_RESULT');
      toast.success('Analisis AI selesai!');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Gagal menganalisis gambar. Silakan coba lagi.';
      setErrorMessage(msg);
      setStep('ERROR');
    }
  };

  // WebRTC QR Scanner Startup
  const startQRScanner = async () => {
    setStep('SCAN_QR');
    try {
      // Small timeout to allow video tag to mount
      setTimeout(async () => {
        if (qrVideoRef.current) {
          const controls = await codeReader.current.decodeFromVideoDevice(
            undefined, 
            qrVideoRef.current, 
            (result, err, controls) => {
              if (result) {
                controls.stop();
                submitTransaction(result.getText());
              }
              if (err && !(err.name === 'NotFoundException')) {
                console.error('QR Decode error:', err);
              }
            }
          );
          setScanControls(controls);
        }
      }, 300);
    } catch (error) {
      console.error('QR camera access failed:', error);
      toast.error('Tidak dapat mengakses kamera untuk scan QR. Menggunakan fallback simulasi.');
    }
  };

  const stopQRScanner = () => {
    if (scanControls) {
      scanControls.stop();
      setScanControls(null);
    }
  };

  // Submit scan transaction to backend
  const submitTransaction = async (qrCodeText: string) => {
    stopQRScanner();
    setStep('SUBMITTING');
    try {
      // 1. Fetch household ID
      const householdsReq = await api.get('/households/me');
      const households = householdsReq.data.data;
      if (!households || households.length === 0) {
        throw new Error('Anda belum terdaftar dalam KK manapun. Silakan lengkapi profil KK Anda terlebih dahulu.');
      }
      const householdId = households[0].id;

      // 2. Scan request payload
      const payload = {
        householdId,
        qrCode: qrCodeText,
        detectedType: aiResult?.jenis_sampah || 'ORGANIC',
        estimatedVolume: aiResult?.estimasi_volume || 1.5,
        userLat: coords.lat,
        userLng: coords.lng
      };

      const response = await api.post('/bins/scan', payload);
      setTransactionData(response.data.data);
      setStep('SUCCESS');
      toast.success('Pintu tong sampah berhasil terbuka!');
    } catch (error: any) {
      console.error('Transaction failed:', error);
      const msg = error.response?.data?.message || error.message || 'Gagal memproses setoran sampah.';
      setErrorMessage(msg);
      setStep('ERROR');
    }
  };

  const resetFlow = () => {
    stopCamera();
    stopQRScanner();
    setPreviewUrl(null);
    setCapturedFile(null);
    setAiResult(null);
    setTransactionData(null);
    setSelectedSimulatedBin('');
    setStep('INTRO');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col items-center pt-6 px-4 pb-24">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between mb-6">
        <button 
          onClick={resetFlow}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-md font-bold text-slate-800 tracking-tight">Setor Sampah Cerdas</h1>
        <div className="w-10"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 w-full flex-grow flex flex-col justify-between min-h-[500px]">
        
        {/* STEP 1: INTRO */}
        {step === 'INTRO' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center py-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100 shadow-sm animate-pulse">
              <Camera size={38} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Ambil Foto & Scan Tong</h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-8">
              Pilah sampah Anda secara cerdas. Pindai foto sampah Anda dengan AI, lalu scan QR pada tong sampah fisik untuk membuka pintu tong.
            </p>

            <div className="w-full space-y-3">
              <button 
                onClick={startWasteCamera}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md shadow-green-600/10 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <Camera size={16} />
                Buka Kamera Perangkat
              </button>

              <div className="flex items-center my-3">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">ATAU</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFallbackFileSelect}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <Upload size={16} className="text-slate-500" />
                Unggah File / Galeri
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CAMERA PERMISSION GUIDE */}
        {step === 'CAMERA_PERMISSION_GUIDE' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center py-4">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm">
              <AlertTriangle size={32} />
            </div>
            
            {permissionState === 'DENIED' ? (
              <>
                <h3 className="text-base font-bold text-slate-800 mb-2">Akses Kamera Ditolak</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-xs">
                  Situs ini tidak diizinkan mengakses kamera. Silakan buka pengaturan browser Anda, aktifkan izin kamera untuk situs ini, lalu coba lagi.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-[11px] leading-relaxed text-slate-600 w-full mb-6 space-y-1">
                  <p className="font-bold text-slate-700 mb-1">Cara Aktifkan:</p>
                  <p>1. Klik ikon gembok/pengaturan di sebelah kiri URL situs browser Anda.</p>
                  <p>2. Cari opsi <strong>Kamera</strong> dan pilih <strong>Izinkan (Allow)</strong>.</p>
                  <p>3. Muat ulang halaman dan tekan tombol Coba Lagi di bawah.</p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-800 mb-2">Perangkat Tidak Mendukung</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-xs">
                  Browser atau perangkat Anda tidak mendukung akses kamera langsung. Silakan gunakan metode unggah file/galeri.
                </p>
              </>
            )}

            <div className="w-full space-y-3">
              {permissionState === 'DENIED' && (
                <button 
                  onClick={startWasteCamera}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  Coba Buka Kamera Lagi
                </button>
              )}
              
              <button 
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider"
              >
                Gunakan Unggah File
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TAKE PHOTO */}
        {step === 'TAKE_PHOTO' && (
          <div className="flex flex-col flex-grow">
            <h3 className="text-sm font-bold text-slate-800 mb-3 text-center">Posisikan Sampah dalam Bingkai</h3>
            
            {/* Direct Camera Viewport */}
            <div className="w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner flex items-center justify-center">
              <video 
                ref={videoRef} 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              
              {/* Styled guide frame overlay */}
              <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-8 h-8 border-t-4 border-l-4 border-green-500 absolute top-0 left-0"></div>
                <div className="w-8 h-8 border-t-4 border-r-4 border-green-500 absolute top-0 right-0"></div>
                <div className="w-8 h-8 border-b-4 border-l-4 border-green-500 absolute bottom-0 left-0"></div>
                <div className="w-8 h-8 border-b-4 border-r-4 border-green-500 absolute bottom-0 right-0"></div>
                
                <span className="text-[10px] bg-black/60 px-3 py-1 rounded-full text-white/90 font-bold uppercase tracking-wider text-center">
                  Kamera AI Aktif
                </span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-6 mt-6">
              <button 
                onClick={() => {
                  stopCamera();
                  setStep('INTRO');
                }}
                className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shadow-sm cursor-pointer"
              >
                <XCircle size={20} />
              </button>

              {/* Styled Shutter button */}
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-transform active:scale-90 border-4 border-white shadow-lg cursor-pointer"
              >
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </button>

              <div className="w-12"></div> {/* Spacer balance */}
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW PHOTO */}
        {step === 'REVIEW_PHOTO' && previewUrl && (
          <div className="flex flex-col flex-grow items-center justify-between">
            <div className="w-full text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800">Verifikasi Foto Sampah</h3>
              <p className="text-[11px] text-slate-500">Pastikan sampah terlihat jelas dan tidak buram sebelum dianalisis.</p>
            </div>

            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 shadow-md my-4">
              <img src={previewUrl} alt="Preview Sampah" className="w-full h-full object-cover" />
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={runAiDetection}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md shadow-green-600/10 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <CheckCircle size={16} />
                Gunakan Foto Ini
              </button>

              <button 
                onClick={() => {
                  setPreviewUrl(null);
                  setCapturedFile(null);
                  if (permissionState === 'GRANTED') {
                    startWasteCamera();
                  } else {
                    setStep('INTRO');
                  }
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <RefreshCw size={16} />
                Foto Ulang
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: AI PROCESSING */}
        {step === 'AI_PROCESSING' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center py-6">
            <div className="relative w-28 h-28 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center mb-6">
              {previewUrl && (
                <>
                  <img src={previewUrl} alt="Analyzing" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-x-0 h-1 bg-green-500 shadow-lg animate-bounce" style={{ top: '50%' }}></div>
                </>
              )}
            </div>
            
            <Loader2 size={36} className="text-green-600 animate-spin mb-3" />
            <h3 className="text-base font-bold text-slate-800">Menjalankan Visi Komputer AI...</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
              Memilah jenis sampah (Organik/Anorganik) dan mengestimasi volume secara otomatis melalui cloud queue.
            </p>
          </div>
        )}

        {/* STEP 6: AI RESULT */}
        {step === 'AI_RESULT' && aiResult && previewUrl && (
          <div className="flex flex-col flex-grow items-center justify-between">
            <div className="w-full text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800">Analisis Deteksi AI Selesai</h3>
              <p className="text-[11px] text-slate-500">Hasil klasifikasi gambar sampah berhasil diidentifikasi.</p>
            </div>

            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm my-4">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="w-full space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kategori Sampah</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                  aiResult.jenis_sampah === 'ORGANIC' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {aiResult.jenis_sampah === 'ORGANIC' ? '🌱 Organik' : '♻️ Anorganik'}
                </span>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 text-xs font-bold text-slate-700 mt-2">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Estimasi Vol</span>
                    <span>{aiResult.estimasi_volume} Liter</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Akurasi</span>
                    <span>{aiResult.confidence ? `${Math.round(aiResult.confidence * 100)}%` : '96%'}</span>
                  </div>
                </div>
              </div>

              {aiResult.quotaRemaining !== undefined && (
                <div className="text-[10px] text-slate-400 text-center font-semibold">
                  Sisa Kuota AI Hari Ini: {aiResult.quotaRemaining} / 50 Request
                </div>
              )}

              <button 
                onClick={startQRScanner}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md shadow-green-600/10 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <QrCode size={16} />
                Scan QR Tong Sampah
              </button>
              
              <button 
                onClick={resetFlow}
                className="w-full text-slate-500 hover:text-slate-700 font-bold py-2 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer"
              >
                Batalkan / Ulangi
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: SCAN_QR */}
        {step === 'SCAN_QR' && (
          <div className="flex flex-col flex-grow items-center justify-between">
            <div className="text-center space-y-1 w-full">
              <h3 className="text-base font-bold text-slate-800">Scan QR Code Tong</h3>
              <p className="text-[11px] text-slate-500">Arahkan kamera perangkat Anda pada QR Code yang tertempel di tong sampah.</p>
            </div>

            {/* Video preview viewport */}
            <div className="w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden relative my-4 border border-slate-800 shadow-inner flex items-center justify-center">
              <video ref={qrVideoRef} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-10 border-2 border-green-500 opacity-60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-6 h-6 border-t-4 border-l-4 border-green-500 absolute top-0 left-0"></div>
                <div className="w-6 h-6 border-t-4 border-r-4 border-green-500 absolute top-0 right-0"></div>
                <div className="w-6 h-6 border-b-4 border-l-4 border-green-500 absolute bottom-0 left-0"></div>
                <div className="w-6 h-6 border-b-4 border-r-4 border-green-500 absolute bottom-0 right-0"></div>
              </div>
            </div>

            <div className="w-full space-y-4">
              {/* Simulated QR Fallback for Testing */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Simulasi Tanpa Scan QR (Debug / Testing)</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 text-xs border border-slate-200 rounded-lg p-2 bg-white font-medium"
                    value={selectedSimulatedBin}
                    onChange={(e) => setSelectedSimulatedBin(e.target.value)}
                  >
                    <option value="">-- Pilih Tong Sampah RT Anda --</option>
                    {availableBins.map((bin) => (
                      <option key={bin.id} value={bin.qrCode}>
                        Tong {bin.category === 'ORGANIC' ? 'Organik' : 'Anorganik'} ({bin.qrCode})
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedSimulatedBin}
                    onClick={() => {
                      stopQRScanner();
                      submitTransaction(selectedSimulatedBin);
                    }}
                    className="bg-primary hover:bg-primary/95 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Setor
                  </button>
                </div>
                
                {selectedSimulatedBin && aiResult && (
                  (() => {
                    const binDetails = availableBins.find(b => b.qrCode === selectedSimulatedBin);
                    const binType = binDetails?.category;
                    const trashType = aiResult.jenis_sampah;
                    if (binType && binType !== trashType) {
                      return (
                        <div className="flex gap-1.5 items-center text-[9px] text-red-600 font-bold p-1 bg-red-50 border border-red-100 rounded">
                          <AlertTriangle size={12} />
                          <span>Peringatan: Tipe tong ({binType}) dan sampah ({trashType}) tidak cocok!</span>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>

              <button 
                onClick={() => {
                  stopQRScanner();
                  setStep('AI_RESULT');
                }}
                className="w-full text-slate-500 hover:text-slate-700 font-bold py-2 rounded-xl transition-colors text-xs uppercase tracking-wider text-center cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: SUBMITTING */}
        {step === 'SUBMITTING' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center py-6">
            <Loader2 size={48} className="text-green-600 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-800">Memproses Setoran Sampah...</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
              Mengirimkan log timbangan sampah, menghitung poin, dan mencocokkan data RT/RW Anda.
            </p>
          </div>
        )}

        {/* STEP 9: SUCCESS */}
        {step === 'SUCCESS' && transactionData && (
          <div className="flex flex-col flex-grow items-center justify-between py-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center text-green-500 mb-5 shadow-sm shadow-green-100">
                <CheckCircle size={36} />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">Setoran Sampah Berhasil!</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-xs">
                Pintu tong sampah fisik telah terbuka. Silakan masukkan sampah Anda.
              </p>
            </div>

            <div className="w-full bg-green-50 border border-green-100 rounded-2xl p-5 my-6 text-xs space-y-3 font-semibold text-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-green-200/50">
                <span className="text-slate-500">Berat Timbangan</span>
                <span className="font-bold text-slate-800">{transactionData.weightKg} Kg</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-200/50">
                <span className="text-slate-500">Hadiah Poin</span>
                <span className="text-green-700 font-extrabold text-sm">+{transactionData.pointsAwarded} Poin</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estimasi Saldo</span>
                <span className="text-green-700 font-extrabold text-sm">+Rp {(transactionData.pointsAwarded * 100).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button 
              onClick={resetFlow}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md shadow-green-600/10 text-xs uppercase tracking-wider cursor-pointer"
            >
              Selesai & Setor Lagi
            </button>
          </div>
        )}

        {/* STEP 10: ERROR */}
        {step === 'ERROR' && (
          <div className="flex flex-col flex-grow items-center justify-between py-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-500 mb-5 shadow-sm shadow-red-100">
                <XCircle size={36} />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">Setoran Gagal</h2>
              <p className="text-xs text-red-600 leading-relaxed mt-2 p-3 bg-red-50 rounded-xl border border-red-100 max-w-xs font-semibold">
                {errorMessage}
              </p>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={resetFlow}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-green-600/10"
              >
                Coba Ulang Dari Awal
              </button>
              
              <button 
                onClick={() => {
                  if (aiResult) {
                    setStep('AI_RESULT');
                  } else {
                    setStep('INTRO');
                  }
                }}
                className="w-full text-slate-500 hover:text-slate-700 font-bold py-2 rounded-xl transition-colors text-xs uppercase tracking-wider text-center cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
