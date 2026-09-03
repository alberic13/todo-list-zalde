import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import {
  LogOut,
  Search,
  Settings,
} from "lucide-react";

export interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSemanticSearch: boolean;
  onToggleSemanticSearch: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  isSemanticSearch,
  onToggleSemanticSearch,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/60 bg-white/75 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand with Mac dots */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-1 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#f5bd4f]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#61c554]" />
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-black">
                  Todolist-App
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Smart Productivity Suite</p>
            </div>
          </div>
        </div>

        {/* Search Bar in center with Semantic Search Toggle */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={
                isSemanticSearch
                  ? "AI Search aktif: Cari berdasarkan makna / konteks..."
                  : "Cari judul, deskripsi, atau kategori tugas..."
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-24 py-2 text-xs rounded-2xl bg-white/80 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all shadow-sm ${
                isSemanticSearch
                  ? "border-purple-400 focus:ring-2 focus:ring-purple-500/30 shadow-purple-500/10"
                  : "border-slate-200 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              }`}
            />

            {/* Semantic Mode Switch Button */}
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleSemanticSearch}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                  isSemanticSearch
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
                title="Beralih antara Keyword Search & AI Search"
              >
                <span>AI Search</span>
              </button>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="text-xs text-slate-400 hover:text-slate-700 p-1 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* Settings Gear Button (Clean Icon Only) */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Pengaturan Integrasi WhatsApp"
            className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors duration-200 active:scale-95 group"
          >
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </button>

          {/* Subtle separator */}
          <div className="h-5 w-[1px] bg-slate-200/80 mx-0.5" />

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-0.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white/80">
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
