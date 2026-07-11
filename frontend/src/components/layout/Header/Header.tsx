import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 h-[72px] bg-white border-b border-outline-variant px-container-margin flex items-center justify-between z-40">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Selamat datang kembali, Admin 👋</h2>
        <p className="text-body-md text-on-surface-variant font-body-md">Kelola data, pantau aktivitas, dan wujudkan lingkungan yang lebih bersih.</p>
      </div>
      <div className="flex items-center gap-gutter">
        {/* Location Picker */}
        <div className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-lg cursor-pointer hover:bg-surface-container-high transition-all">
          <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
          <span className="text-label-md font-label-md text-on-surface">Kecamatan Coblong</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">keyboard_arrow_down</span>
        </div>
        
        {/* Icons */}
        <div className="flex items-center gap-4">
          <button className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-4 h-4 bg-error text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">8</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all">
            <span className="material-symbols-outlined">apps</span>
          </button>
        </div>
        
        {/* Profile */}
        <div className="flex items-center gap-3 ml-2 border-l border-outline-variant pl-6">
          <div className="text-right">
            <p className="text-label-md font-bold text-on-surface leading-tight">Admin Utama</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Super Admin</p>
          </div>
          <img className="w-10 h-10 rounded-full bg-surface-container-high object-cover" alt="Admin Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGSjKuvGkGdFv56w1NfN-HakfQCsyxejzA2bEnb6WRApOqQyba6-jqw1oUAPclC_Ugqi7fLl8cx1qQkbrn7ArdIy5EhZL68kyS7l6LR9X6fPZbJa2azK88QzLNf0rJduGiVgJwcuy2h9fukt8MurMaryr5XSH5Wd3Z2JiGlxlMsDTUCwx8iZega-Pi8neRzO7ejfFR4hFK4RihNIRrU_DAPuIv4sm_FiJJ5kIRIFUtHjt-UbPbC6BWin2RwfXFo6Nzb0_YLOelJmU2" />
        </div>
      </div>
    </header>
  );
};

export default Header;
