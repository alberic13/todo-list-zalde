import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useTasks } from "../hooks/useTasks";
import { Navbar } from "../components/layout/Navbar";
import { StatOverview } from "../components/stats/StatOverview";
import { FilterBar } from "../components/tasks/FilterBar";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { TaskModal } from "../components/tasks/TaskModal";
import { SettingsModal } from "../components/layout/SettingsModal";
import { collaborationService } from "../services/collaborationService";

const AiChatDrawer = lazy(() => import("../components/ai/AiChatDrawer").then(m => ({ default: m.AiChatDrawer })));
import { Skeleton } from "../components/ui/Skeleton";
import { Task, TaskStatus } from "../types";
import { CreateTaskPayload, UpdateTaskPayload } from "../services/taskService";
import { Bot, AlertCircle, RefreshCw, Users, CheckCircle2 } from "lucide-react";

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
    deleteCategory,
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultModalStatus, setDefaultModalStatus] = useState<TaskStatus>("todo");
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTaskForChat, setSelectedTaskForChat] = useState<Task | null>(null);
  const [chatDrawerTab, setChatDrawerTab] = useState<"ai" | "task_chat">("ai");
  const [joinNotification, setJoinNotification] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  // Auto-join via invite link (?join=CODE or pending localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get("join");
    const pendingCode = codeFromUrl || localStorage.getItem("zalde_pending_join");

    if (pendingCode) {
      localStorage.removeItem("zalde_pending_join");
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      collaborationService
        .joinTask(pendingCode)
        .then(async (joinedTask) => {
          setJoinNotification({
            message: `Berhasil bergabung ke tugas: "${joinedTask.title}"`,
            success: true,
          });
          await refresh();
          setSelectedTaskForChat(joinedTask);
          setChatDrawerTab("task_chat");
          setIsAiDrawerOpen(true);
          setTimeout(() => setJoinNotification(null), 6000);
        })
        .catch((err: any) => {
          setJoinNotification({
            message: err?.message || "Gagal bergabung ke tugas. Link mungkin tidak valid.",
            success: false,
          });
          setTimeout(() => setJoinNotification(null), 6000);
        });
    }
  }, [refresh]);

  const handleOpenCreateTaskWithStatus = useCallback((status: TaskStatus) => {
    setTaskToEdit(null);
    setDefaultModalStatus(status);
    setIsModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  }, []);

  const handleOpenTaskChat = useCallback((task: Task) => {
    setSelectedTaskForChat(task);
    setChatDrawerTab("task_chat");
    setIsAiDrawerOpen(true);
  }, []);

  const handleLeaveTask = async (taskId: string) => {
    try {
      await collaborationService.removeCollaborator(taskId, "me");
      await refresh();
    } catch (err: any) {
      console.error("Gagal meninggalkan tugas:", err);
    }
  };

  const handleModalSubmit = async (payload: CreateTaskPayload | UpdateTaskPayload) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, payload as UpdateTaskPayload);
    } else {
      await createTask(payload as CreateTaskPayload);
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
        {/* Join Notification Alert */}
        {joinNotification && (
          <div
            className={`p-4 rounded-3xl border text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-sm ${
              joinNotification.success
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                : "bg-rose-50/90 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {joinNotification.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{joinNotification.message}</span>
            </div>
            <button
              onClick={() => setJoinNotification(null)}
              className="text-xs font-bold underline opacity-70 hover:opacity-100 shrink-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

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
              onOpenChat={handleOpenTaskChat}
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
        onDeleteCategory={deleteCategory}
        onToggleSubtask={toggleSubtask}
        onAddSubtask={addSubtask}
        onDeleteSubtask={deleteSubtask}
        onLeaveTask={handleLeaveTask}
        onOpenChat={handleOpenTaskChat}
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
            onClick={() => {
              setChatDrawerTab("ai");
              setIsAiDrawerOpen(true);
            }}
            title="Buka Zalde AI"
            className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-2xl text-slate-900 font-extrabold shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/90 hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
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

      {/* Floating AI & Team Chat Drawer */}
      <Suspense fallback={null}>
        <AiChatDrawer
          isOpen={isAiDrawerOpen}
          onClose={() => setIsAiDrawerOpen(false)}
          onOpenTaskModal={handleEditTask}
          activeTab={chatDrawerTab}
          onTabChange={setChatDrawerTab}
          activeTaskForChat={selectedTaskForChat}
          tasks={tasks}
          onSelectTaskForChat={setSelectedTaskForChat}
        />
      </Suspense>
    </div>
  );
};
