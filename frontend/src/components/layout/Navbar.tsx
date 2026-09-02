import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import {
  CheckSquare,
  LogOut,
  User as UserIcon,
  Search,
} from "lucide-react";

export interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSemanticSearch: boolean;
  onToggleSemanticSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  isSemanticSearch,
  onToggleSemanticSearch,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Todolist<span className="text-indigo-400">-App</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Productivity Suite</p>
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
              className={`w-full pl-10 pr-28 py-2 text-xs rounded-xl bg-slate-900/90 border text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all ${
                isSemanticSearch
                  ? "border-purple-500/50 focus:ring-2 focus:ring-purple-500/80 shadow-sm shadow-purple-500/10"
                  : "border-slate-700/60 focus:ring-2 focus:ring-indigo-500"
              }`}
            />

            {/* Semantic Mode Switch Button */}
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleSemanticSearch}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  isSemanticSearch
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
                }`}
                title="Beralih antara Keyword Search & AI Search"
              >
                <span>AI Search</span>
              </button>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="text-xs text-slate-400 hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* User Profile & Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
