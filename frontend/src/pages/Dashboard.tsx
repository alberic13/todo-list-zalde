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
import { Bot } from "lucide-react";
import { DashboardAlerts } from "../components/layout/DashboardAlerts";

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
    leaveTask,
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
            message: `Berhasil bergabung ke tugas: "${joinedTask.task.title}"`,
            success: true,
          });
          await refresh();
          setSelectedTaskForChat(joinedTask.task);
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
      await leaveTask(taskId);
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

  const activeTaskToEdit = taskToEdit
    ? tasks.find((t) => t.id === taskToEdit.id) || taskToEdit
    : null;
  const activeTaskForChat = selectedTaskForChat
    ? tasks.find((t) => t.id === selectedTaskForChat.id) || selectedTaskForChat
    : null;

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
        {/* Alerts & Notifications */}
        <DashboardAlerts
          joinNotification={joinNotification}
          onCloseJoinNotification={() => setJoinNotification(null)}
          isSemanticSearch={isSemanticSearch}
          onToggleSemanticSearch={toggleSemanticSearch}
          error={error}
          onRetry={refresh}
        />

        {/* Productivity Stat Cards */}
        <StatOverview stats={stats} />

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
              onLeaveTask={leaveTask}
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
        taskToEdit={activeTaskToEdit}
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
          activeTaskForChat={activeTaskForChat}
          tasks={tasks}
          onSelectTaskForChat={setSelectedTaskForChat}
        />
      </Suspense>
    </div>
  );
};
