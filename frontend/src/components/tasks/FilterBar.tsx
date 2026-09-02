import React from "react";
import { Category, TaskFilters } from "../../types";
import { Filter, ArrowUpDown, Sparkles, Calendar } from "lucide-react";

export interface FilterBarProps {
  filters: TaskFilters;
  onFilterChange: (filters: TaskFilters) => void;
  categories: Category[];
  isSemanticSearch?: boolean;
  onToggleSemanticSearch?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  categories,
  isSemanticSearch = false,
  onToggleSemanticSearch,
}) => {
  const statusTabs = [
    { key: "all", label: "Semua" },
    { key: "todo", label: "Belum Mulai" },
    { key: "in_progress", label: "Berjalan" },
    { key: "done", label: "Selesai" },
  ];

  const todayJakarta = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-3">
      {/* Mobile search bar if on small screen */}
      <div className="md:hidden flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={isSemanticSearch ? "AI Search aktif: Cari berdasarkan makna / konteks..." : "Cari tugas..."}
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-2xl bg-white/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm"
          />
        </div>
        {onToggleSemanticSearch && (
          <button
            onClick={onToggleSemanticSearch}
            className={`p-2 rounded-2xl text-xs font-bold border transition-all ${
              isSemanticSearch
                ? "bg-slate-900 text-white border-slate-800 shadow-sm"
                : "bg-white text-slate-600 border-slate-200"
            }`}
            title="Toggle AI Search"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Top Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/80 card-shadow overflow-x-auto max-w-full">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange({ ...filters, status: tab.key })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filters.status === tab.key
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdowns (Date Badge, Priority & Sort) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Today Date Badge (Asia/Jakarta) */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 font-semibold shrink-0 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{todayJakarta}</span>
          </div>

          {/* Priority Select */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={filters.priority || "all"}
              onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
              className="pl-8 pr-7 py-1.5 rounded-2xl bg-white/90 border border-slate-200/80 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer appearance-none shadow-sm"
            >
              <option value="all">Semua Prioritas</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 Tinggi</option>
              <option value="medium">🔵 Sedang</option>
              <option value="low">⚪ Rendah</option>
            </select>
          </div>

          {/* Sort Select */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={`${filters.sortBy || "createdAt"}-${filters.sortOrder || "desc"}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-") as [any, any];
                onFilterChange({ ...filters, sortBy, sortOrder });
              }}
              className="pl-8 pr-7 py-1.5 rounded-2xl bg-white/90 border border-slate-200/80 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer appearance-none shadow-sm"
            >
              <option value="createdAt-desc">Terbaru</option>
              <option value="dueDate-asc">Deadline Terdekat</option>
              <option value="priority-desc">Prioritas Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Row */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-bold shrink-0 uppercase tracking-wider">Kategori:</span>
          <button
            onClick={() => onFilterChange({ ...filters, categoryId: "all" })}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
              filters.categoryId === "all" || !filters.categoryId
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => {
            const isSelected = filters.categoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ ...filters, categoryId: cat.id })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                  isSelected
                    ? "text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900 bg-white/80 border-slate-200 shadow-sm"
                }`}
                style={
                  isSelected
                    ? { backgroundColor: `${cat.colorHex}25`, borderColor: cat.colorHex, color: "#0f172a" }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.colorHex }}
                />
                {cat.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
