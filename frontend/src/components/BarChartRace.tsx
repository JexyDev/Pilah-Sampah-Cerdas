import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Award } from "lucide-react";

interface KelurahanData {
  name: string;
  color: string;
  logo: string;
  history: number[]; // Scores for Week 1 to 8
}

const KELURAHAN_SEEDS: KelurahanData[] = [
  { name: "Dago", color: "bg-emerald-500", logo: "🌱", history: [65, 78, 85, 92, 98, 105, 115, 128] },
  { name: "Cigadung", color: "bg-blue-500", logo: "♻️", history: [58, 66, 74, 88, 95, 108, 120, 122] },
  { name: "Sadang Serang", color: "bg-amber-500", logo: "🏡", history: [70, 72, 80, 85, 90, 94, 102, 110] },
  { name: "Sekeloa", color: "bg-indigo-500", logo: "✨", history: [50, 62, 68, 75, 84, 98, 105, 118] },
  { name: "Lebak Gede", color: "bg-purple-500", logo: "💧", history: [45, 50, 60, 70, 82, 90, 99, 105] },
];

export const BarChartRace: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSteps = KELURAHAN_SEEDS[0].history.length;

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps]);

  // Map kelurahans to current score and sort
  const currentData = KELURAHAN_SEEDS.map((k) => ({
    name: k.name,
    color: k.color,
    logo: k.logo,
    score: k.history[currentStep],
  })).sort((a, b) => b.score - a.score);

  // Find max score at current step to calculate width percentage
  const maxScore = Math.max(...currentData.map((d) => d.score), 1);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <Award className="text-primary animate-pulse" />
            Persaingan Kebersihan Kelurahan (Bar Chart Race)
          </h3>
          <p className="text-xs text-slate-500">Peringkat akumulasi tonase pilah bersih Kelurahan per minggu</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase transition hover:bg-primary/95"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "Pause" : "Mulai"}
          </button>
          <button
            onClick={handleReset}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="relative h-72 w-full mt-4 flex flex-col justify-between">
        {currentData.map((item, idx) => {
          const widthPct = (item.score / maxScore) * 85; // leave 15% space for labels
          return (
            <div
              key={item.name}
              className="absolute w-full flex items-center transition-all duration-1000 ease-out"
              style={{
                transform: `translateY(${idx * 52}px)`,
                height: "40px",
              }}
            >
              <div className="w-28 text-xs font-bold text-slate-700 truncate pr-2 flex items-center gap-1.5">
                <span className="text-sm">{item.logo}</span>
                <span>{item.name}</span>
              </div>
              <div className="flex-1 bg-slate-50 h-7 rounded-full overflow-hidden relative border border-slate-100">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-3 shadow-inner`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-[10px] font-black text-white drop-shadow-md">
                    {item.score} Ton
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
        <span>Minggu Ke-{currentStep + 1}</span>
        <div className="w-1/2 bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
        <span>Selesai (W8)</span>
      </div>
    </div>
  );
};
