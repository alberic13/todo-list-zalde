import React from "react";
import { ArrowRight, Zap, Search, GripHorizontal, RefreshCw, Check, Mail, Calendar } from "lucide-react";

interface AuthHeroProps {
  showForm: boolean;
  onShowForm: () => void;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const HERO_FEATURES = [
  { label: "AI Integrated", icon: Zap, color: "text-indigo-400" },
  { label: "Semantic Search", icon: Search, color: "text-sky-400" },
  { label: "Drag & Drop", icon: GripHorizontal, color: "text-amber-400" },
  { label: "Realtime Sync", icon: RefreshCw, color: "text-emerald-400" },
  { label: "Auto Notif Email H-3", icon: Mail, color: "text-rose-400" },
  { label: "Google, Apple & Outlook Cal", icon: Calendar, color: "text-blue-400" },
  { label: "SSO Google", icon: GoogleIcon, color: "" },
];

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
          <div className={`flex flex-wrap gap-1.5 sm:gap-2 mb-6 transition-all duration-700 ${showForm ? "gap-1.5 mb-3" : "justify-center max-w-2xl pt-1"}`}>
            {HERO_FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <span 
                  key={i} 
                  className={`rounded-lg glass-pill font-medium text-slate-200 flex items-center gap-1.5 hover:bg-white/10 transition-all border border-white/10 ${
                    showForm 
                      ? "px-2 py-0.5 text-[10.5px]" 
                      : "px-2.5 py-1 text-[11px] sm:text-[11.5px]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${feat.color} shrink-0`} />
                  <span>{feat.label}</span>
                </span>
              );
            })}
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
