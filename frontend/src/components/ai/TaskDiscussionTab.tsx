import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { collaborationService } from "../../services/collaborationService";
import { Task, TaskChatMessage } from "../../types";
import { Send, Share2, ArrowLeft } from "lucide-react";
import { TaskDiscussionSelector } from "./discussion/TaskDiscussionSelector";
import { TaskDiscussionMessageList } from "./discussion/TaskDiscussionMessageList";

export interface TaskDiscussionTabProps {
  activeTaskForChat?: Task | null;
  tasks?: Task[];
  onSelectTaskForChat?: (task: Task | null) => void;
  isOpen: boolean;
}

export const TaskDiscussionTab: React.FC<TaskDiscussionTabProps> = ({
  activeTaskForChat,
  tasks = [],
  onSelectTaskForChat,
  isOpen,
}) => {
  const { user } = useAuth();
  const [taskMessages, setTaskMessages] = useState<TaskChatMessage[]>([]);
  const [taskChatInput, setTaskChatInput] = useState("");
  const [isSendingTaskChat, setIsSendingTaskChat] = useState(false);
  const [isLoadingTaskMessages, setIsLoadingTaskMessages] = useState(false);
  const taskMessagesEndRef = useRef<HTMLDivElement>(null);

  // Polling for Task Chat Messages
  useEffect(() => {
    if (!isOpen || !activeTaskForChat) return;

    let isSubscribed = true;
    const fetchMsgs = async () => {
      try {
        const msgs = await collaborationService.getMessages(activeTaskForChat.id);
        if (isSubscribed) {
          setTaskMessages(msgs);
        }
      } catch (err) {
        console.error("Gagal memuat pesan diskusi:", err);
      }
    };

    setIsLoadingTaskMessages(true);
    fetchMsgs().finally(() => {
      if (isSubscribed) setIsLoadingTaskMessages(false);
    });

    const timer = setInterval(fetchMsgs, 2500);
    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, [isOpen, activeTaskForChat?.id]);

  useEffect(() => {
    taskMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [taskMessages]);

  const handleCopyInviteLink = async () => {
    if (!activeTaskForChat) return;
    try {
      let code = activeTaskForChat.inviteCode;
      if (!code) {
        const res = await collaborationService.getInviteCode(activeTaskForChat.id);
        code = res.inviteCode;
      }
      const url = collaborationService.buildInviteUrl(code);
      await navigator.clipboard.writeText(url);
      alert("Link undangan kolaborasi berhasil disalin ke clipboard!");
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  const handleSendTaskChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTaskForChat || !taskChatInput.trim() || isSendingTaskChat) return;
    const content = taskChatInput.trim();
    setTaskChatInput("");
    setIsSendingTaskChat(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: TaskChatMessage = {
      id: tempId,
      taskId: activeTaskForChat.id,
      userId: user?.id || "me",
      content,
      message: content,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || "me",
        name: user?.name || "Saya",
        email: user?.email || "",
      },
    };
    setTaskMessages((prev) => [...prev, optimisticMsg]);

    try {
      const realMsg = await collaborationService.sendMessage(activeTaskForChat.id, content);
      setTaskMessages((prev) => prev.map((m) => (m.id === tempId ? realMsg : m)));
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      setTaskMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSendingTaskChat(false);
    }
  };

  return (
    <>
      {/* Active Task Mini Bar or Task Selector */}
      {activeTaskForChat ? (
        <div className="px-4 py-2.5 border-b border-white/60 bg-white/30 backdrop-blur-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate" title={activeTaskForChat.title}>
                {activeTaskForChat.title}
              </p>
              <p className="text-[10px] text-slate-400">
                {activeTaskForChat.isOwner === false ? "Kolaborator" : "Pemilik Tugas"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onSelectTaskForChat && (
              <button
                type="button"
                onClick={() => onSelectTaskForChat(null)}
                title="Kembali ke pilih tugas untuk didiskusikan"
                className="inline-flex items-center justify-center p-1.5 rounded-xl border border-slate-200/80 bg-slate-100/70 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyInviteLink}
              title="Salin Link Undangan Kolaborasi"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-1 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3 h-3 text-indigo-600" />
              <span>Undang</span>
            </button>

            {tasks && tasks.length > 1 && onSelectTaskForChat && (
              <select
                value={activeTaskForChat.id}
                onChange={(e) => {
                  const found = tasks.find((t) => t.id === e.target.value);
                  if (found) onSelectTaskForChat(found);
                }}
                className="text-[11px] bg-white/90 border border-slate-200 rounded-xl px-2 py-1 font-semibold text-slate-700 max-w-[130px] truncate cursor-pointer shadow-xs"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ) : (
        <TaskDiscussionSelector
          tasks={tasks}
          onSelectTask={onSelectTaskForChat}
        />
      )}

      {/* Task Discussion Message Thread */}
      {activeTaskForChat && (
        <>
          <TaskDiscussionMessageList
            taskMessages={taskMessages}
            isLoading={isLoadingTaskMessages}
            currentUserId={user?.id}
            messagesEndRef={taskMessagesEndRef}
          />

          {/* Task Chat Input Form */}
          <form
            onSubmit={handleSendTaskChat}
            className="p-3.5 border-t border-white/60 bg-white/40 backdrop-blur-xl flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Kirim pesan untuk tugas "${activeTaskForChat.title}"...`}
              value={taskChatInput}
              onChange={(e) => setTaskChatInput(e.target.value)}
              disabled={isSendingTaskChat}
              className="flex-1 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 text-slate-900 placeholder:text-slate-400 text-xs px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={!taskChatInput.trim() || isSendingTaskChat}
              className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </>
  );
};
