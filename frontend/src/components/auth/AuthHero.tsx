import React from "react";
import { ArrowRight } from "lucide-react";
import { BrandDots } from "../ui/BrandDots";

interface AuthHeroProps {
  showForm: boolean;
  onShowForm: () => void;
}

const FEATURES = ["AI integrated", "Semantic Search", "Drag & Drop", "Realtime Sync"];

export const AuthHero: React.FC<AuthHeroProps> = ({ showForm, onShowForm }) => {
  return (
    <div 
      className={`absolute inset-0 z-10 flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-20 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        showForm 
          ? "opacity-0 lg:opacity-100 lg:-translate-x-[27.5%] xl:-translate-x-[26%]" 
          : "opacity-100 translate-x-0"
      }`}
    >
      {/* Top: Brand mark */}
      <div className="w-full flex justify-center">
        <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
          <BrandDots className="gap-2" />
          <span className="text-white/80 text-xs font-semibold ml-3 tracking-wide">Todolist-App</span>
        </div>
      </div>

      {/* Center: Hero text */}
      <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center">
        <h2 className={`font-black text-white leading-[1.1] tracking-tight transition-all duration-700 ease-out ${showForm ? "text-4xl xl:text-5xl" : "text-5xl sm:text-6xl lg:text-7xl"}`}>
          Organisasi tugas
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 auth-gradient-shimmer">
            lebih cerdas.
          </span>
        </h2>
        
        <p className={`text-white/60 leading-relaxed transition-all duration-700 mt-6 ${showForm ? "text-sm max-w-sm" : "text-lg sm:text-xl max-w-2xl"}`}>
          task management dengan semantic search, Drag and Drop, dan asisten AI - produktivitas kontekstual.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 pt-6 justify-center">
          {FEATURES.map((text) => (
            <div 
              key={text} 
              className={`inline-flex items-center font-medium text-white/70 bg-white/5 border border-white/10 rounded-full auth-pill-glow transition-all duration-700 ${showForm ? "px-3 py-1.5 text-[11px]" : "px-5 py-2.5 text-sm"}`}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Start Button */}
        <div className={`pt-12 transition-all duration-500 ease-in-out ${showForm ? "opacity-0 translate-y-8 absolute pointer-events-none scale-95" : "opacity-100 translate-y-0 relative scale-100 delay-200"}`}>
          <button
            onClick={onShowForm}
            className="group relative inline-flex items-center justify-center gap-4 px-6 py-3 rounded-full font-bold text-lg overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(255,255,255,0.1)] hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02]"
          >
            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 group-hover:from-purple-200 group-hover:via-pink-200 group-hover:to-amber-200 transition-all ml-2">
              Mulai Sekarang
            </span>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg shadow-pink-500/25 group-hover:translate-x-1 group-hover:shadow-pink-500/40 transition-all duration-300">
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
          <p className="mt-6 text-sm text-white/40 font-medium">Gratis untuk dicoba. Tanpa kartu kredit.</p>
        </div>
      </div>

      {/* Bottom: Subtle decorative text */}
      <div className="w-full flex justify-center pb-4">
        <p className="text-white/25 text-[11px] font-bold tracking-widest uppercase">
          © 2026 Zalde Productivity Suite
        </p>
      </div>
    </div>
  );
};
