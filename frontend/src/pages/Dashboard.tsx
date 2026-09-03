import React, { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { Navbar } from "../components/layout/Navbar";
import { StatOverview } from "../components/stats/StatOverview";
import { FilterBar } from "../components/tasks/FilterBar";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { TaskModal } from "../components/tasks/TaskModal";
import { SettingsModal } from "../components/layout/SettingsModal";
import { AiChatDrawer } from "../components/ai/AiChatDrawer";
import { Task, TaskStatus } from "../types";
import { Bot } from "lucide-react";

export const Dashboard: React.FC = () => {
  const {
    tasks,
    stats,
    categories,
    isSemanticSearch,
    toggleSemanticSearch,
    filters,
    setFilters,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    createCategory,
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultModalStatus, setDefaultModalStatus] = useState<TaskStatus>("todo");
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenCreateTaskWithStatus = (status: TaskStatus) => {
    setTaskToEdit(null);
    setDefaultModalStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload: any) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, payload);
    } else {
      await createTask(payload);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col selection:bg-slate-900 selection:text-white pb-20">
      {/* Navbar with Semantic Search toggle */}
      <Navbar
        searchQuery={filters.search || ""}
        onSearchChange={(q) => setFilters({ ...filters, search: q })}
        isSemanticSearch={isSemanticSearch}
        onToggleSemanticSearch={toggleSemanticSearch}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Productivity Stat Cards */}
        <StatOverview stats={stats} />

        {/* Semantic Search Banner Info if active */}
        {isSemanticSearch && (
          <div className="p-4 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 card-shadow flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <p className="text-slate-800 font-medium">
                Mode <strong className="font-bold text-slate-900">AI Search</strong> aktif: Hasil diurutkan berdasarkan makna & relevansi.
              </p>
            </div>
            <button
              onClick={toggleSemanticSearch}
              className="text-[11px] text-indigo-600 hover:text-indigo-900 underline font-bold shrink-0"
            >
              Kembali ke Keyword
            </button>
          </div>
        )}

        {/* Filter Bar & Controls */}
        <div className="pt-2">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            isSemanticSearch={isSemanticSearch}
            onToggleSemanticSearch={toggleSemanticSearch}
          />
        </div>

        {/* Kanban Board View */}
        <div className="pt-2">
          <KanbanBoard
            tasks={tasks}
            onEdit={handleEditTask}
            onDelete={deleteTask}
            onStatusChange={updateStatus}
            onToggleSubtask={toggleSubtask}
            onOpenCreateTaskWithStatus={handleOpenCreateTaskWithStatus}
          />
        </div>
      </main>

      {/* Task Create / Edit Modal with AI Breakdown */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultStatus={defaultModalStatus}
        categories={categories}
        onSubmit={handleModalSubmit}
        onAddCategory={createCategory}
        onToggleSubtask={toggleSubtask}
        onAddSubtask={addSubtask}
        onDeleteSubtask={deleteSubtask}
      />

      {/* WhatsApp Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Floating AI Trigger Button */}
      {!isAiDrawerOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            title="Buka Zalde AI"
            className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-2xl text-slate-900 font-extrabold shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/90 hover:scale-105 active:scale-95 transition-all duration-300 group"
          >
            <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform text-indigo-600" />
            <span className="text-xs tracking-wide text-slate-900">Zalde AI</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
          </button>
        </div>
      )}

      {/* Floating AI Drawer */}
      <AiChatDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onOpenTaskModal={handleEditTask}
      />
    </div>
  );
};
