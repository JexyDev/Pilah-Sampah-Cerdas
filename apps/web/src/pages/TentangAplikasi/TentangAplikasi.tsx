import React from "react";
import { APP_CONFIG } from "../../config/appConfig";

const TentangAplikasi: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white rounded-xl shadow-sm">
      <div className="relative group flex items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-100/60 shadow-sm transition-all duration-300 mb-6 hover:shadow-md">
        <img
          src="/logo.png"
          alt={`${APP_CONFIG.appName} Logo`}
          className="h-28 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <h1 className="text-3xl font-extrabold text-green-700 mb-1">
        {APP_CONFIG.appName}
      </h1>
      <p className="text-sm font-bold text-emerald-600 tracking-wide uppercase mb-3">
        "{APP_CONFIG.tagline}"
      </p>
      <p className="text-gray-500 mb-6 font-medium text-xs">
        Versi {APP_CONFIG.version}
      </p>
      <div className="max-w-2xl text-gray-600 leading-relaxed text-sm">
        <p className="mb-4">
          TrashCare adalah platform manajemen pemilahan sampah cerdas yang
          bertujuan untuk meningkatkan kepatuhan dan efisiensi pengelolaan
          sampah di lingkungan masyarakat.
        </p>
        <p>
          Hak Cipta &copy; {new Date().getFullYear()} PT Makerindo. Seluruh hak
          dilindungi undang-undang.
        </p>
      </div>
    </div>
  );
};

export default TentangAplikasi;
