import React, { useState, useRef } from 'react';
import { Camera, Upload, QrCode, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import { predictWaste } from '../../services/aiService';
import { setorSampah } from '../../services/transactionService';

type Step = 'CAMERA_PERMISSION' | 'TAKE_PHOTO' | 'AI_PROCESSING' | 'AI_RESULT' | 'SCAN_QR' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';

export default function SetorSampah() {
  const [step, setStep] = useState<Step>('TAKE_PHOTO');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ jenis_sampah: string, estimasi_volume: number } | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserQRCodeReader());
  const [scanControls, setScanControls] = useState<any>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    try {
      setStep('AI_PROCESSING');
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      setPreviewUrl(URL.createObjectURL(compressedFile));

      // Call AI Mock
      const result = await predictWaste(compressedFile);
      setAiResult(result);
      setStep('AI_RESULT');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memproses gambar');
      setStep('TAKE_PHOTO');
    }
  };

  const startQRScanner = async () => {
    setStep('SCAN_QR');
    try {
      if (videoRef.current) {
        const controls = await codeReader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
          if (result) {
            controls.stop();
            submitTransaction(result.getText());
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.error(err);
          }
        });
        setScanControls(controls);
      }
    } catch (error) {
      console.error(error);
      toast.error('Tidak dapat mengakses kamera');
    }
  };

  const stopScanner = () => {
    if (scanControls) {
      scanControls.stop();
    }
  };

  const submitTransaction = async (scannedQr: string) => {
    setStep('SUBMITTING');
    try {
      // Dummy user id
      const payload = {
        user_id: 'USR-12345',
        qr_data: scannedQr,
        jenis_sampah: aiResult?.jenis_sampah || 'ORGANIC',
        volume: aiResult?.estimasi_volume || 1
      };
      const response = await setorSampah(payload);
      setTransactionData(response.data);
      setStep('SUCCESS');
    } catch (error: any) {
      setErrorMessage(error.message || 'Gagal menyetor sampah');
      setStep('ERROR');
    }
  };

  const resetFlow = () => {
    stopScanner();
    setPreviewUrl(null);
    setAiResult(null);
    setStep('TAKE_PHOTO');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col items-center pt-8 px-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Setor Sampah Cerdas</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full flex-grow flex flex-col">
        
        {step === 'TAKE_PHOTO' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center">
            <div className="bg-green-50 p-6 rounded-full mb-6">
              <Camera size={48} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ambil Foto Sampah</h2>
            <p className="text-gray-500 mb-8 text-sm">Foto sampah Anda agar AI kami dapat menganalisis jenis dan estimasi volumenya.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Unggah / Buka Kamera
            </button>
          </div>
        )}

        {step === 'AI_PROCESSING' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center">
            <Loader2 size={48} className="text-green-600 animate-spin mb-4" />
            <h2 className="text-lg font-medium text-gray-800">Menganalisis Sampah...</h2>
            <p className="text-gray-500 text-sm mt-2">AI sedang mengecek foto Anda</p>
          </div>
        )}

        {step === 'AI_RESULT' && aiResult && previewUrl && (
          <div className="flex flex-col items-center justify-center flex-grow">
            <img src={previewUrl} alt="Preview" className="w-48 h-48 object-cover rounded-xl shadow-sm mb-6 border-2 border-gray-100" />
            
            <div className="bg-gray-50 rounded-xl p-4 w-full mb-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Hasil Deteksi AI</p>
              <div className="text-xl font-bold text-gray-800 mb-1">
                {aiResult.jenis_sampah === 'ORGANIC' ? '🌱 Organik' : '♻️ Anorganik'}
              </div>
              <p className="text-gray-600 font-medium">Vol: {aiResult.estimasi_volume} Liter</p>
            </div>

            <button 
              onClick={startQRScanner}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <QrCode size={20} />
              Lanjut Scan QR Tong
            </button>
            <button 
              onClick={resetFlow}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 font-medium py-2 px-6 rounded-xl transition-colors"
            >
              Foto Ulang
            </button>
          </div>
        )}

        {step === 'SCAN_QR' && (
          <div className="flex flex-col items-center flex-grow text-center">
            <h2 className="text-lg font-semibold mb-2">Scan QR Tong Sampah</h2>
            <p className="text-gray-500 text-sm mb-6">Arahkan kamera ke QR Code di tong sampah</p>
            
            <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden relative mb-6">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-green-500 opacity-50 m-8 rounded-lg pointer-events-none"></div>
            </div>

            <button 
              onClick={() => {
                stopScanner();
                setStep('AI_RESULT');
              }}
              className="mt-auto text-gray-500 hover:text-gray-700 font-medium py-2"
            >
              Kembali
            </button>
            
            {/* Fallback for testing on desktop without QR */}
            <div className="mt-8 text-xs text-gray-400">
              <p>Tombol dummy untuk testing:</p>
              <button onClick={() => {
                stopScanner();
                // dummy encrypted payload {"bin_id":"BIN-123"}
                // base64 of {"bin_id":"BIN-123"} is eyJiaW5faWQiOiJCSU4tMTIzIn0=
                submitTransaction('eyJiaW5faWQiOiJCSU4tMTIzIn0=');
              }} className="underline">Simulasi Scan Berhasil</button>
            </div>
          </div>
        )}

        {step === 'SUBMITTING' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center">
            <Loader2 size={48} className="text-green-600 animate-spin mb-4" />
            <h2 className="text-lg font-medium text-gray-800">Menyetor Sampah...</h2>
          </div>
        )}

        {step === 'SUCCESS' && transactionData && (
          <div className="flex flex-col items-center justify-center flex-grow text-center">
            <CheckCircle size={64} className="text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Setoran Berhasil!</h2>
            <p className="text-gray-500 mb-6">Terima kasih telah memilah sampah.</p>
            
            <div className="bg-green-50 border border-green-100 rounded-xl p-5 w-full mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Poin Didapat</span>
                <span className="text-xl font-bold text-green-600">+{transactionData.poin_didapat}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Poin</span>
                <span className="font-semibold text-gray-800">{transactionData.total_poin_user}</span>
              </div>
            </div>

            <button 
              onClick={resetFlow}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Selesai
            </button>
          </div>
        )}

        {step === 'ERROR' && (
          <div className="flex flex-col items-center justify-center flex-grow text-center">
            <XCircle size={64} className="text-red-500 mb-6" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Setoran Gagal</h2>
            <p className="text-gray-600 mb-8">{errorMessage}</p>

            <button 
              onClick={resetFlow}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
