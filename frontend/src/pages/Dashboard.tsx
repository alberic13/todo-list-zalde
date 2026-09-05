import React, { useState, useCallback, Suspense, lazy } from "react";
import { useTasks } from "../hooks/useTasks";
import { Navbar } from "../components/layout/Navbar";
import { StatOverview } from "../components/stats/StatOverview";
import { FilterBar } from "../components/tasks/FilterBar";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { TaskModal } from "../components/tasks/TaskModal";
import { SettingsModal } from "../components/layout/SettingsModal";

const AiChatDrawer = lazy(() => import("../components/ai/AiChatDrawer").then(m => ({ default: m.AiChatDrawer })));
import { Skeleton } from "../components/ui/Skeleton";
import { Task, TaskStatus } from "../types";
import { Bot, AlertCircle, RefreshCw } from "lucide-react";

export const Dashboard: React.FC = () => {
  const {
    tasks,
    stats,
    categories,
    isLoading,
    error,
    refresh,
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

  const handleOpenCreateTaskWithStatus = useCallback((status: TaskStatus) => {
    setTaskToEdit(null);
    setDefaultModalStatus(status);
    setIsModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  }, []);

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

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-3xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span><strong className="font-bold">Kendala Server:</strong> {error}</span>
            </div>
            <button
              onClick={() => refresh()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shrink-0 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" />
              Coba Lagi
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

        {/* Kanban Board View / Skeleton Loading */}
        <div className="pt-2">
          {isLoading && tasks.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {[1, 2, 3].map((col) => (
                <div
                  key={col}
                  className="rounded-3xl glass-panel p-5 border border-white/80 bg-white/70 min-h-[520px] space-y-4"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80">
                    <Skeleton className="h-5 w-28 rounded-xl" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              onEdit={handleEditTask}
              onDelete={deleteTask}
              onStatusChange={updateStatus}
              onToggleSubtask={toggleSubtask}
              onOpenCreateTaskWithStatus={handleOpenCreateTaskWithStatus}
            />
          )}
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
      <Suspense fallback={null}>
        <AiChatDrawer
          isOpen={isAiDrawerOpen}
          onClose={() => setIsAiDrawerOpen(false)}
          onOpenTaskModal={handleEditTask}
        />
      </Suspense>
    </div>
  );
};
