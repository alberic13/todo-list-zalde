import React, { useState, useEffect } from "react";
import { Task } from "../../types";
import {
  Bot,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { AiChatTab, ChatMessage } from "./AiChatTab";
import { TaskDiscussionTab } from "./TaskDiscussionTab";

export type { ChatMessage };

export interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModal?: (task: Task) => void;
  activeTab?: "ai" | "task_chat";
  onTabChange?: (tab: "ai" | "task_chat") => void;
  activeTaskForChat?: Task | null;
  tasks?: Task[];
  onSelectTaskForChat?: (task: Task | null) => void;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpenTaskModal,
  activeTab = "ai",
  onTabChange,
  activeTaskForChat,
  tasks = [],
  onSelectTaskForChat,
}) => {
  const [currentTab, setCurrentTab] = useState<"ai" | "task_chat">(activeTab);
  const [isExpanded, setIsExpanded] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);

  // Sync tab when prop changes
  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const handleTabSelect = (tab: "ai" | "task_chat") => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for Mobile */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-40 lg:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel with Theme Blur & Matching Mesh Background */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 border-l border-white/60 shadow-2xl flex flex-col transition-all duration-300 ${
          isExpanded ? "w-full sm:w-[680px]" : "w-full sm:w-[440px]"
        }`}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.75)",
          backgroundImage:
            "radial-gradient(at 0% 0%, hsla(253, 16%, 15%, 0.12) 0, transparent 60%), radial-gradient(at 100% 0%, hsla(339, 49%, 30%, 0.12) 0, transparent 60%), radial-gradient(at 50% 100%, hsla(225, 39%, 30%, 0.08) 0, transparent 60%)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/60 flex items-center justify-between bg-white/40 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 px-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="w-2 h-2 rounded-full bg-[#f5bd4f]" />
              <div className="w-2 h-2 rounded-full bg-[#61c554]" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ml-1">
              {currentTab === "ai" ? (
                <Bot className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                {currentTab === "ai" ? "Zalde AI" : "Diskusi Tugas"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentTab === "ai"
                  ? "Konteks & Prioritas Otomatis"
                  : "Kolaborasi Bersama Tim"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-colors hidden sm:flex cursor-pointer"
              title={isExpanded ? "Perkecil" : "Perlebar"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            {currentTab === "ai" && (
              <button
                onClick={() => setClearTrigger((c) => c + 1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
                title="Bersihkan Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl mx-4 mt-3 shrink-0">
          <button
            type="button"
            onClick={() => handleTabSelect("ai")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === "ai"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>Zalde AI</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect("task_chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === "task_chat"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Diskusi Tugas</span>
            {activeTaskForChat && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: Zalde AI Copilot */}
        {currentTab === "ai" && (
          <AiChatTab
            onOpenTaskModal={onOpenTaskModal}
            clearTrigger={clearTrigger}
          />
        )}

        {/* TAB 2: Diskusi Tugas (Collaboration Chat) */}
        {currentTab === "task_chat" && (
          <TaskDiscussionTab
            activeTaskForChat={activeTaskForChat}
            tasks={tasks}
            onSelectTaskForChat={onSelectTaskForChat}
            isOpen={isOpen}
          />
        )}
      </aside>
    </>
  );
};
