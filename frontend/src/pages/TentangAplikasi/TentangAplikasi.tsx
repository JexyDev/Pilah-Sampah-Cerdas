import React from "react";
import { APP_CONFIG } from "../../config/appConfig";

const TentangAplikasi: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white rounded-xl shadow-sm">
      <img
        src="/logo.png"
        alt={`${APP_CONFIG.appName} Logo`}
        className="w-32 h-32 mb-6 object-contain"
      />
      <h1 className="text-3xl font-extrabold text-green-700 mb-2">
        {APP_CONFIG.appName}
      </h1>
      <p className="text-gray-500 mb-6 font-medium">
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
