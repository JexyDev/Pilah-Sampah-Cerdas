import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';

const Pengaturan: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profil' | 'integrasi' | 'database'>('profil');
  const [isLoading, setIsLoading] = useState(true);
  
  const { user: storeUser, updateUser: updateStoreUser } = useAuthStore();

  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    address: '',
    fotoProfil: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password State
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Upload Photo State
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response: any = await authService.getCurrentUser();
      if (response && response.user) {
        setProfileData({
          name: response.user.name || '',
          email: response.user.email || '',
          role: response.user.role || 'Warga',
          phone: response.user.phone || '',
          address: response.user.address || '',
          fotoProfil: response.user.fotoProfil || '',
        });
        
        // Ensure local store user state is in sync with latest DB data
        updateStoreUser({
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          address: response.user.address,
          fotoProfil: response.user.fotoProfil,
        });
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      toast.error("Gagal memuat profil dari server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!profileData.name.trim()) {
      setProfileMessage({ type: 'error', text: 'Nama lengkap wajib diisi' });
      toast.error('Nama wajib diisi');
      return;
    }
    if (!profileData.email.trim()) {
      setProfileMessage({ type: 'error', text: 'Alamat email wajib diisi' });
      toast.error('Email wajib diisi');
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileMessage({ type: '', text: '' });
      await authService.updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        fotoProfil: profileData.fotoProfil
      });

      // Update state locally in store immediately
      updateStoreUser({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address
      });

      setProfileMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      toast.success('Profil berhasil diperbarui!');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Gagal memperbarui profil';
      setProfileMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordData.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Sandi lama wajib diisi' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Sandi baru minimal 6 karakter' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi sandi tidak cocok' });
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordMessage({ type: '', text: '' });
      await authService.updatePassword({ 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      setPasswordMessage({ type: 'success', text: 'Sandi berhasil diperbarui!' });
      toast.success('Kata sandi berhasil diperbarui!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Gagal memperbarui sandi';
      setPasswordMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Profile Picture Helpers
  const getProfilePhotoUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const host = baseUrl.replace('/api/v1', '');
    return `${host}${path}`;
  };

  const handleFileChange = async (file: File) => {
    // Validate File Size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }

    // Validate File Format (JPG, PNG, WEBP)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.");
      return;
    }

    try {
      setIsUploading(true);
      const result = await authService.uploadAvatar(file);
      if (result.success && result.data?.fotoProfil) {
        const path = result.data.fotoProfil;
        setProfileData(prev => ({ ...prev, fotoProfil: path }));
        updateStoreUser({ fotoProfil: path });
        toast.success("Foto profil berhasil diperbarui!");
      } else {
        toast.error("Gagal mengunggah foto profil.");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Gagal mengunggah foto profil.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const initials = profileData.name
    ? profileData.name.substring(0, 2).toUpperCase()
    : 'U';

  const avatarUrl = getProfilePhotoUrl(profileData.fotoProfil);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-on-surface">Pengaturan Sistem</h2>
        <p className="text-[14px] text-on-surface-variant mt-1">Kelola preferensi akun, integrasi layanan, dan manajemen basis data.</p>
      </div>

      {/* Custom Tab Navigation */}
      <div className="border-b border-outline-variant/30 mb-2">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8 overflow-x-auto">
          <button 
            className={`whitespace-nowrap py-4 px-1 border-b-2 text-[12px] uppercase tracking-wider transition-colors duration-200 ${activeTab === 'profil' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant font-bold hover:text-on-surface hover:border-outline-variant/50'}`}
            onClick={() => setActiveTab('profil')}
          >
            Profil Akun
          </button>
          <button 
            className={`whitespace-nowrap py-4 px-1 border-b-2 text-[12px] uppercase tracking-wider transition-colors duration-200 ${activeTab === 'integrasi' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant font-bold hover:text-on-surface hover:border-outline-variant/50'}`}
            onClick={() => setActiveTab('integrasi')}
          >
            Integrasi API
          </button>
          <button 
            className={`whitespace-nowrap py-4 px-1 border-b-2 text-[12px] uppercase tracking-wider transition-colors duration-200 ${activeTab === 'database' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant font-bold hover:text-on-surface hover:border-outline-variant/50'}`}
            onClick={() => setActiveTab('database')}
          >
            Database Management
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="flex-1">
        {/* Section 1: Profil Akun */}
        {activeTab === 'profil' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 p-6">
              <h3 className="text-[20px] font-bold text-on-surface mb-6">Informasi Pribadi</h3>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-surface-container-high rounded w-20 mb-4"></div>
                  <div className="h-10 bg-surface-container-high rounded"></div>
                  <div className="h-10 bg-surface-container-high rounded"></div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8">
                  
                  {/* DRAG AND DROP AVATAR UPLOAD */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative group cursor-pointer w-32 h-32 rounded-full flex items-center justify-center border-2 border-dashed transition-all overflow-hidden bg-surface-container-lowest ${
                        dragOver ? 'border-primary bg-primary/5 scale-105' : 'border-outline-variant/70 group-hover:border-primary'
                      }`}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center text-primary gap-1">
                          <span className="material-symbols-outlined animate-spin text-[32px]">autorenew</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider">Mengunggah</span>
                        </div>
                      ) : avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" 
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-2xl ${storeUser?.avatarBg || 'bg-blue-100'} ${storeUser?.avatarColor || 'text-blue-700'}`}>
                          {initials}
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
                        <span className="material-symbols-outlined text-white text-[24px] mb-1">photo_camera</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Ubah Foto</span>
                      </div>
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} 
                    />
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[12px] font-bold text-primary uppercase tracking-wider hover:underline"
                    >
                      Ubah Foto Profil
                    </button>
                    <p className="text-[10px] text-on-surface-variant font-medium text-center max-w-[150px] leading-relaxed">
                      JPG, PNG, WEBP. Maks 2MB. Drag & drop file juga bisa dilakukan.
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-5">
                    {profileMessage.text && (
                      <div className={`p-3 rounded-lg text-sm ${profileMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {profileMessage.text}
                      </div>
                    )}
                    
                    {/* Row 1: Nama Lengkap & Peran */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nama Lengkap</label>
                        <input 
                          className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                          type="text" 
                          value={profileData.name} 
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Peran Akses</label>
                        <div className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] bg-surface-container-low text-on-surface flex items-center h-[42px] cursor-not-allowed">
                          <span className="font-bold uppercase tracking-wider text-[11px] text-on-surface-variant">{profileData.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Email & No. HP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Alamat Email</label>
                        <input 
                          className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                          type="email" 
                          value={profileData.email} 
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nomor HP</label>
                        <input 
                          className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                          type="tel" 
                          placeholder="contoh: 081234567890"
                          value={profileData.phone} 
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Row 3: Alamat Rumah */}
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Alamat Tinggal / Wilayah Tugas</label>
                      <textarea 
                        className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors min-h-[80px]" 
                        placeholder="Masukkan alamat lengkap (Nama Jalan, Blok, RT/RW, Kelurahan)..."
                        value={profileData.address} 
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={handleProfileSubmit}
                        disabled={isSavingProfile}
                        className="bg-primary text-white rounded-lg px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                        {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 p-6">
              <h3 className="text-[20px] font-bold text-on-surface mb-6">Keamanan Akun</h3>
              <div className="space-y-5 max-w-lg">
                {passwordMessage.text && (
                  <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {passwordMessage.text}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Kata Sandi Saat Ini</label>
                  <input 
                    className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                    placeholder="••••••••" 
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Kata Sandi Baru</label>
                  <input 
                    className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                    placeholder="Minimal 6 karakter" 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Konfirmasi Kata Sandi Baru</label>
                  <input 
                    className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                    placeholder="Ulangi kata sandi baru" 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handlePasswordSubmit}
                    disabled={isSavingPassword}
                    className="bg-primary text-white rounded-lg px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                    {isSavingPassword ? 'Menyimpan...' : 'Perbarui Sandi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Integrasi API */}
        {activeTab === 'integrasi' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <span className="material-symbols-outlined text-blue-600 text-[28px]">router</span>
                <div>
                  <h3 className="text-[20px] font-bold text-on-surface">Ngrok Port Tunnel</h3>
                  <p className="text-[14px] text-on-surface-variant mt-1">Konfigurasi forwarding URL untuk akses lokal.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Forwarding URL Saat Ini</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 rounded-lg border border-outline-variant/50 px-3 py-2 font-mono text-[14px] bg-surface-container-lowest text-on-surface-variant cursor-not-allowed" 
                      readOnly 
                      type="text" 
                      value="https://a1b2-34-56-78-90.ngrok-free.app" 
                    />
                    <button className="px-4 py-2 border border-outline-variant/50 rounded-lg text-on-surface text-[12px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">sync</span>
                      Perbarui
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-blue-600 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Gunakan URL ini untuk endpoint aplikasi seluler.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <span className="material-symbols-outlined text-blue-600 text-[28px]">key</span>
                <div>
                  <h3 className="text-[20px] font-bold text-on-surface">API Token Generator</h3>
                  <p className="text-[14px] text-on-surface-variant mt-1">Kredensial untuk autentikasi pihak ketiga.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Bearer Token M2M</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 rounded-lg border border-outline-variant/50 px-3 py-2 font-mono text-[14px] bg-surface-container-lowest text-on-surface-variant" 
                      readOnly 
                      type="password" 
                      value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                    />
                    <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-blue-200 transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      Salin
                    </button>
                  </div>
                </div>
                <button className="text-red-500 text-[12px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1 mt-2">
                  <span className="material-symbols-outlined text-[16px]">autorenew</span>
                  Revoke & Generate Token Baru
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                <span className="material-symbols-outlined text-blue-600 text-[28px]">webhook</span>
                <div>
                  <h3 className="text-[20px] font-bold text-on-surface">Webhook Receiver</h3>
                  <p className="text-[14px] text-on-surface-variant mt-1">Terima notifikasi real-time dari sensor smart bin.</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Endpoint URL</label>
                  <input 
                    className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                    placeholder="https://domain-anda.com/api/v1/webhook" 
                    type="url" 
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input 
                    className="rounded text-primary focus:ring-primary h-4 w-4 border-outline-variant/50" 
                    id="webhookActive" 
                    type="checkbox" 
                  />
                  <label className="text-[14px] text-on-surface" htmlFor="webhookActive">
                    Aktifkan pengiriman payload webhook
                  </label>
                </div>
                <div className="pt-4 flex justify-end">
                  <button className="bg-primary text-white rounded-lg px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm">
                    Simpan Konfigurasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Database Management */}
        {activeTab === 'database' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-red-50/50 rounded-xl shadow-sm border border-red-500/20 p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-red-500 text-[32px] mt-1">warning</span>
                <div className="flex-1">
                  <h3 className="text-[20px] font-bold text-on-surface mb-2">Area Berbahaya</h3>
                  <p className="text-[14px] text-on-surface-variant mb-6">
                    Tindakan di bagian ini dapat memengaruhi integritas data sistem dan kinerja aplikasi. Lakukan dengan hati-hati dan pastikan Anda memiliki wewenang untuk mengeksekusinya.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Action 1 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-outline-variant/50 gap-4">
                      <div>
                        <p className="text-[14px] font-bold text-on-surface">Backup Database Manual</p>
                        <p className="text-[12px] text-on-surface-variant mt-1">Buat salinan data terbaru dalam format .sql.gz.</p>
                      </div>
                      <button className="bg-primary text-white rounded-lg px-6 py-2 text-[12px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Buat Backup Database
                      </button>
                    </div>
                    
                    {/* Action 2 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-outline-variant/50 gap-4">
                      <div>
                        <p className="text-[14px] font-bold text-on-surface">Optimasi Sistem</p>
                        <p className="text-[12px] text-on-surface-variant mt-1">Bersihkan cache aplikasi dan memori sementara.</p>
                      </div>
                      <button className="border border-outline-variant/50 text-on-surface rounded-lg px-6 py-2 text-[12px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors whitespace-nowrap flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
                        Bersihkan Cache System
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pengaturan;
