import React, { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { Navbar } from "../components/layout/Navbar";
import { StatOverview } from "../components/stats/StatOverview";
import { FilterBar } from "../components/tasks/FilterBar";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { TaskModal } from "../components/tasks/TaskModal";
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
    toggleSubtask,
    createCategory,
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultModalStatus, setDefaultModalStatus] = useState<TaskStatus>("todo");
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-20">
      {/* Navbar with Semantic Search toggle */}
      <Navbar
        searchQuery={filters.search || ""}
        onSearchChange={(q) => setFilters({ ...filters, search: q })}
        isSemanticSearch={isSemanticSearch}
        onToggleSemanticSearch={toggleSemanticSearch}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Productivity Stat Cards */}
        <StatOverview stats={stats} />

        {/* Semantic Search Banner Info if active */}
        {isSemanticSearch && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <p className="text-purple-200">
                Mode <strong>AI Search</strong> aktif: Hasil diurutkan berdasarkan makna & relevansi.
              </p>
            </div>
            <button
              onClick={toggleSemanticSearch}
              className="text-[11px] text-purple-300 hover:text-white underline font-semibold shrink-0"
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
      />

      {/* Floating AI Trigger Button */}
      {!isAiDrawerOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            title="Buka Zalde AI"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold shadow-xl shadow-purple-600/30 border border-purple-400/40 hover:scale-105 active:scale-95 transition-all duration-300 group"
          >
            <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="text-xs tracking-wide">Zalde AI</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-400" />
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
