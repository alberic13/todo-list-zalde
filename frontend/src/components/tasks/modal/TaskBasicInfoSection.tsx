import React from "react";
import { Input } from "../../ui/Input";

export interface TaskBasicInfoSectionProps {
  isOwner: boolean;
  title: string;
  description: string;
  onChangeTitle: (title: string) => void;
  onChangeDescription: (description: string) => void;
}

export const TaskBasicInfoSection: React.FC<TaskBasicInfoSectionProps> = ({
  isOwner,
  title,
  description,
  onChangeTitle,
  onChangeDescription,
}) => {
  return (
    <>
      {/* Title */}
      <Input
        label="Judul Tugas *"
        placeholder="Misal: Buat mockup desain Figma halaman checkout"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        required
        autoFocus={isOwner}
        disabled={!isOwner}
      />

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">
          Deskripsi (Opsional)
        </label>
        <textarea
          rows={3}
          placeholder="Tambahkan catatan detail tugas..."
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          disabled={!isOwner}
          className={`w-full rounded-xl border text-sm px-3.5 py-2.5 transition-all resize-none shadow-sm ${
            !isOwner
              ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          }`}
        />
      </div>
    </>
  );
};
