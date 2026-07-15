import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

const Pengaturan: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profil' | 'integrasi' | 'database'>('profil');
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile State
  const [profileData, setProfileData] = useState({ name: '', email: '', role: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password State
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

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
          role: response.user.role || 'Admin',
        });
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    try {
      setIsSavingProfile(true);
      setProfileMessage({ type: '', text: '' });
      await authService.updateProfile({ name: profileData.name, email: profileData.email });
      setProfileMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.response?.data?.message || 'Gagal memperbarui profil' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async () => {
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
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Gagal memperbarui sandi' });
    } finally {
      setIsSavingPassword(false);
    }
  };

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
            Profil Admin
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
        {/* Section 1: Profil Admin */}
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
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="relative group cursor-pointer">
                      <div className="w-32 h-32 rounded-full bg-surface-container-low flex items-center justify-center border-2 border-outline-variant/50 group-hover:border-primary transition-colors overflow-hidden">
                         <span className="material-symbols-outlined text-[48px] text-on-surface-variant">person</span>
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white">photo_camera</span>
                      </div>
                    </div>
                    <button className="text-[12px] font-bold text-primary uppercase tracking-wider hover:underline">Ubah Foto Profil</button>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-5">
                    {profileMessage.text && (
                      <div className={`p-3 rounded-lg text-sm ${profileMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {profileMessage.text}
                      </div>
                    )}
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
                          <span className="font-bold">{profileData.role}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Alamat Email</label>
                      <input 
                        className="w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors" 
                        type="email" 
                        value={profileData.email} 
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={handleProfileSubmit}
                        disabled={isSavingProfile}
                        className="bg-primary text-white rounded-lg px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
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
                    className="bg-primary text-white rounded-lg px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
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
