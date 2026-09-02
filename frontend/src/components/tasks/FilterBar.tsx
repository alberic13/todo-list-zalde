import React from "react";
import { Category, TaskFilters } from "../../types";
import { Filter, ArrowUpDown, Sparkles } from "lucide-react";

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

  return (
    <div className="space-y-3">
      {/* Mobile search bar if on small screen */}
      <div className="md:hidden flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={isSemanticSearch ? "✨ Semantic Search..." : "Cari tugas..."}
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        {onToggleSemanticSearch && (
          <button
            onClick={onToggleSemanticSearch}
            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
              isSemanticSearch
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
            title="Toggle Semantic Search"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Top Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800/90 overflow-x-auto max-w-full">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange({ ...filters, status: tab.key })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                filters.status === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdowns (Priority & Sort) */}
        <div className="flex items-center gap-2">
          {/* Priority Select */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={filters.priority || "all"}
              onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
              className="pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
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
              className="pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
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
          <span className="text-slate-500 text-[11px] font-medium shrink-0">Kategori:</span>
          <button
            onClick={() => onFilterChange({ ...filters, categoryId: "all" })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
              filters.categoryId === "all" || !filters.categoryId
                ? "bg-slate-700 text-white"
                : "bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800"
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                  isSelected
                    ? "text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 bg-slate-900/70 border-slate-800"
                }`}
                style={
                  isSelected
                    ? { backgroundColor: `${cat.colorHex}30`, borderColor: cat.colorHex, color: cat.colorHex }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
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
