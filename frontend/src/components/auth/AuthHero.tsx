import React from "react";
import { ArrowRight, Zap, Search, GripHorizontal, RefreshCw, Check } from "lucide-react";

interface AuthHeroProps {
  showForm: boolean;
  onShowForm: () => void;
}

export const AuthHero: React.FC<AuthHeroProps> = ({ showForm, onShowForm }) => {
  return (
    <section 
      className={`absolute top-0 left-0 h-full flex flex-col justify-between px-8 py-6 sm:px-12 sm:py-8 lg:px-16 lg:py-10 bg-[#0A0D17] text-white overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        showForm 
          ? "w-full opacity-0 lg:opacity-100 lg:w-[45%] xl:w-[46%]" 
          : "w-full opacity-100"
      }`}
    >
      {/* Background Ambient Glows */}
      <div aria-hidden="true" className="absolute inset-0 glow-purple pointer-events-none"></div>
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-96 h-96 glow-cyan pointer-events-none"></div>
      
      {/* Top Brand Tag */}
      <div className={`relative z-10 transition-all duration-700 ${showForm ? "" : "w-full flex justify-center"}`}>
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-pill border border-white/10 shadow-lg shadow-black/20 hover:border-white/25 transition-all">
          <div aria-hidden="true" className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-200">Todolist-App</span>
        </div>
      </div>
      
      {/* Center Hero Statement & Interactive Preview */}
      <div className={`relative z-10 my-auto lg:my-0 max-w-2xl transition-all duration-700 ${showForm ? "max-w-xl" : "mx-auto text-center flex flex-col items-center mb-8"}`}>
        <h1 className={`font-extrabold tracking-tight leading-[1.15] mb-4 transition-all duration-700 ${showForm ? "text-4xl sm:text-5xl lg:text-[44px] xl:text-[50px]" : "text-5xl sm:text-6xl lg:text-7xl mt-2"}`}>
          Organisasi tugas <br />
          <span className="text-gradient-accent">lebih cerdas.</span>
        </h1>
        <p className={`text-slate-400 leading-relaxed font-normal transition-all duration-700 ${showForm ? "text-sm sm:text-base mb-6 max-w-md" : "text-lg sm:text-xl max-w-xl mt-4 mb-8"}`}>
          Task management terintegrasi dengan semantic search, drag & drop fleksibel, dan asisten AI kontekstual untuk mempercepat alur kerja tim modern.
        </p>
        
        {/* Wrapper to align Button to the right edge of Badges */}
        <div className={`flex flex-col ${showForm ? "w-full" : "items-center md:items-end w-full max-w-fit mx-auto"}`}>
          
          {/* Feature Badges */}
          <div className={`flex flex-wrap gap-2.5 mb-8 transition-all duration-700 ${showForm ? "" : "justify-center pt-2"}`}>
            {["AI Integrated", "Semantic Search", "Drag & Drop", "Realtime Sync"].map((feat, i) => (
              <span key={i} className={`rounded-lg glass-pill font-medium text-slate-200 flex items-center gap-1.5 hover:bg-white/10 transition-all ${showForm ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}>
                {i === 0 && <Zap className="w-3.5 h-3.5 text-indigo-400" />}
                {i === 1 && <Search className="w-3.5 h-3.5 text-sky-400" />}
                {i === 2 && <GripHorizontal className="w-3.5 h-3.5 text-amber-400" />}
                {i === 3 && <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
                {feat}
              </span>
            ))}
          </div>
          
          {/* Start Button when form is hidden */}
          <div className={`transition-all duration-500 ease-in-out ${showForm ? "opacity-0 translate-y-8 absolute pointer-events-none scale-95 hidden" : "opacity-100 translate-y-0 relative scale-100 delay-200"}`}>
            <button
              onClick={onShowForm}
              className="group relative flex items-center justify-center py-2 transition-all duration-300 hover:scale-[1.05]"
            >
              <span className="whitespace-nowrap overflow-hidden transition-all duration-500 max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:mr-3 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">
                Mulai Sekarang
              </span>
              <ArrowRight className="w-10 h-10 text-slate-300 group-hover:text-white transition-colors duration-300" />
            </button>
          </div>
        </div>

        {/* Floating UI Mockup Card (Only shown when form is visible, or shown always?) */}
        {/* We'll show the mockup card only when the form slides in, to fill the left panel space. */}
        <div className={`transition-all duration-700 ease-in-out ${showForm ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 absolute pointer-events-none scale-95 hidden"}`}>
          <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/50 border border-white/15 max-w-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-200">Sprint Roadmap Prioritas</span>
              </div>
              <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md">8/10 Selesai</span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 mb-2 rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/20 transition group">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-slate-300 line-through">Integrasi OAuth Google & JWT Engine</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Done</span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.08] border border-indigo-500/30 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md border border-indigo-400/60 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div>
                </div>
                <span className="text-xs font-medium text-white">Fine-tuning Asisten Semantic Query</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded">In Review</span>
            </div>
          </div>
        </div>

        <p className={`mt-6 text-sm text-white/40 font-medium transition-all ${showForm ? "hidden" : "opacity-100"}`}>Gratis untuk dicoba. Tanpa kartu kredit.</p>

      </div>
      
      {/* Left Bottom Legal */}
      <footer className={`relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 transition-all ${showForm ? "" : "justify-center gap-8"}`}>
        <span>© 2026 ZALDE PRODUCTIVITY SUITE</span>
      </footer>
    </section>
  );
};
