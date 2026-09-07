import React, { useState } from "react";
import { Button } from "../../ui/Button";
import { Plus, Check, Trash2 } from "lucide-react";

export interface LocalSubtaskItem {
  id?: string;
  title: string;
  isCompleted: boolean;
}

interface TaskSubtasksSectionProps {
  subtasks: LocalSubtaskItem[];
  onAddSubtask: (title: string) => Promise<void> | void;
  onToggleSubtask: (item: LocalSubtaskItem, index: number) => Promise<void> | void;
  onRemoveSubtask: (item: LocalSubtaskItem, index: number) => Promise<void> | void;
}

export const TaskSubtasksSection: React.FC<TaskSubtasksSectionProps> = ({
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
}) => {
  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  const handleAdd = async () => {
    const trimmed = newSubtaskInput.trim();
    if (!trimmed) return;
    await onAddSubtask(trimmed);
    setNewSubtaskInput("");
  };

  const completedCount = (subtasks || []).filter((s) => s?.isCompleted).length;
  const totalCount = (subtasks || []).length;

  return (
    <div className="space-y-2 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Subtasks Checklist ({completedCount}/{totalCount})
        </label>
        {totalCount > 0 && (
          <span className="text-[11px] text-slate-400 font-medium">
            {Math.round((completedCount / totalCount) * 100)}% selesai
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Tambah subtask manual (tekan enter)..."
          value={newSubtaskInput}
          onChange={(e) => setNewSubtaskInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="flex-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={!newSubtaskInput.trim()}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {totalCount > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mt-2">
          {subtasks.map((st, i) => (
            <div
              key={st.id || `subtask-${i}`}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-all group"
            >
              <div
                onClick={() => onToggleSubtask(st, i)}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    st.isCompleted
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {st.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={`truncate font-medium transition-all ${
                    st.isCompleted
                      ? "line-through text-slate-400 font-normal"
                      : "text-slate-800"
                  }`}
                >
                  {st.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onRemoveSubtask(st, i)}
                title="Hapus subtask"
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
