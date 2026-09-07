import React, { useState } from "react";
import { Category } from "../../../types";
import { Button } from "../../ui/Button";
import { Tag, Trash2 } from "lucide-react";

interface TaskCategorySectionProps {
  categories: Category[];
  categoryId: string;
  onChangeCategory: (id: string) => void;
  onAddCategory: (name: string, colorHex?: string) => Promise<Category>;
  onDeleteCategory?: (id: string) => Promise<void>;
  disabled?: boolean;
}

export const TaskCategorySection: React.FC<TaskCategorySectionProps> = ({
  categories = [],
  categoryId,
  onChangeCategory,
  onAddCategory,
  onDeleteCategory,
  disabled = false,
}) => {
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await onAddCategory(newCatName.trim(), newCatColor);
      onChangeCategory(created.id);
      setNewCatName("");
      setShowAddCat(false);
    } catch (err) {
      console.error("Gagal membuat kategori:", err);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Kategori
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowAddCat(!showAddCat)}
            className="text-[11px] text-indigo-600 hover:underline font-bold"
          >
            + Kategori Baru
          </button>
        )}
      </div>

      <div className="relative flex items-center group">
        <select
          value={categoryId}
          onChange={(e) => onChangeCategory(e.target.value)}
          disabled={disabled}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm pl-3.5 pr-16 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer shadow-sm font-semibold appearance-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
        >
          <option value="">Tanpa Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {categoryId && onDeleteCategory && !disabled && (
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              if (confirm('Hapus kategori ini? Semua task dengan kategori ini akan menjadi "Tanpa Kategori".')) {
                await onDeleteCategory(categoryId);
                onChangeCategory("");
              }
            }}
            className="absolute right-8.5 z-10 flex items-center justify-center text-rose-500 hover:text-rose-600 bg-rose-50/90 hover:bg-rose-100 p-1 rounded-lg transition-all shadow-xs"
            title="Hapus Kategori"
            aria-label="Hapus Kategori"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showAddCat && !disabled && (
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-2 animate-in fade-in duration-150 mt-2">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-600" /> Tambah Kategori
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nama kategori..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-medium"
            />
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer p-0"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCategory}
              disabled={!newCatName.trim()}
            >
              Simpan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
