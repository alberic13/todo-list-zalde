import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";
import { collaborationService } from "../../services/collaborationService";
import { Task, TaskChatMessage } from "../../types";
import {
  Send,
  Bot,
  User,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Loader2,
  MessageSquare,
  Users,
  Share2,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  referencedTasks?: Task[];
}

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
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<"ai" | "task_chat">(activeTab);

  // Sync tab when prop changes
  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  // AI Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Halo! Saya **Zalde AI**. Saya dapat melihat konteks seluruh tugas Anda dan membantu merencanakan prioritas harian. Ada yang bisa saya bantu hari ini?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Task Collaboration Chat States
  const [taskMessages, setTaskMessages] = useState<TaskChatMessage[]>([]);
  const [taskChatInput, setTaskChatInput] = useState("");
  const [isSendingTaskChat, setIsSendingTaskChat] = useState(false);
  const [isLoadingTaskMessages, setIsLoadingTaskMessages] = useState(false);
  const taskMessagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Apa tugas paling prioritas yang harus saya selesaikan hari ini?",
    "Kirim ringkasan jadwal hari ini ke WhatsApp",
    "Bantu rencanakan jadwal tugas saya minggu ini.",
  ];

  const handleShareToWhatsApp = (text: string) => {
    const savedPhone = user?.phoneNumber || localStorage.getItem("zalde_user_wa") || "";
    const waText = text
      .replace(/\*\*(.*?)\*\*/g, "*$1*")
      .replace(/###\s*(.*)/g, "*$1*")
      .replace(/##\s*(.*)/g, "*$1*")
      .replace(/#\s*(.*)/g, "*$1*");

    const message = encodeURIComponent(
      `🚀 *Jadwal Prioritas - Zalde AI*\n📅 ${new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}\n\n${waText}\n\n_Dibuat otomatis oleh Zalde Todo AI Suite_`
    );

    const waUrl = savedPhone
      ? `https://wa.me/${savedPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(waUrl, "_blank");
  };

  useEffect(() => {
    if (isOpen && currentTab === "ai") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, currentTab]);

  // Polling for Task Chat Messages
  useEffect(() => {
    if (!isOpen || currentTab !== "task_chat" || !activeTaskForChat) return;

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
  }, [isOpen, currentTab, activeTaskForChat?.id]);

  useEffect(() => {
    if (isOpen && currentTab === "task_chat") {
      taskMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [taskMessages, isOpen, currentTab]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await aiService.chat(text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: res.response,
        referencedTasks: res.referencedTasks,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `Maaf, terjadi kendala saat memproses permintaan AI: ${err.message || "Gagal menghubungi server"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
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

  const clearChat = () => {
    if (currentTab === "ai") {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: "ai",
          text: "Riwayat percakapan telah dibersihkan. Ada yang bisa saya bantu selanjutnya?",
          timestamp: new Date(),
        },
      ]);
    }
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
              {currentTab === "ai" ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4 text-indigo-400" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                {currentTab === "ai" ? "Zalde AI" : "Diskusi Tugas"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentTab === "ai" ? "Konteks & Prioritas Otomatis" : "Kolaborasi Bersama Tim"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-colors hidden sm:flex"
              title={isExpanded ? "Perkecil" : "Perlebar"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {currentTab === "ai" && (
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
                title="Bersihkan Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl mx-4 mt-3">
          <button
            type="button"
            onClick={() => {
              setCurrentTab("ai");
              onTabChange?.("ai");
            }}
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
            onClick={() => {
              setCurrentTab("task_chat");
              onTabChange?.("task_chat");
            }}
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

        {/* TAB 1: Zalde AI */}
        {currentTab === "ai" && (
          <>
            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "ai" && (
                    <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 ${
                      msg.sender === "user"
                        ? "bg-slate-900/90 backdrop-blur-xl text-white shadow-md font-medium"
                        : "bg-white/80 backdrop-blur-xl border border-white/90 text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Referenced tasks chip cards */}
                    {msg.referencedTasks && msg.referencedTasks.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Tugas Terkait ({msg.referencedTasks.length}):
                        </p>
                        {msg.referencedTasks.map((rt) => (
                          <div
                            key={rt.id}
                            onClick={() => onOpenTaskModal && onOpenTaskModal(rt)}
                            className="p-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 hover:border-slate-400 flex items-center justify-between cursor-pointer transition-all shadow-sm"
                          >
                            <span className="truncate text-slate-900 font-semibold">{rt.title}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                rt.status === "done"
                                  ? "bg-[#e8f5e9] text-[#2e7d32]"
                                  : rt.status === "in_progress"
                                  ? "bg-[#fff8e1] text-[#f57f17]"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {rt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-1.5 border-t border-slate-200/60">
                      {msg.sender === "ai" ? (
                        <button
                          type="button"
                          onClick={() => handleShareToWhatsApp(msg.text)}
                          title="Kirim ringkasan jadwal ini ke WhatsApp"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition-all active:scale-95"
                        >
                          <svg
                            className="w-3 h-3 fill-current text-emerald-600 shrink-0"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.004 0C5.372 0 0 5.373 0 12c0 2.115.55 4.102 1.517 5.834L0 24l6.338-1.662A11.94 11.94 0 0012.004 24C18.628 24 24 18.627 24 12S18.628 0 12.004 0zm0 22.031c-1.85 0-3.585-.506-5.076-1.385l-.364-.216-3.771.989 1.006-3.676-.237-.377A9.97 9.97 0 012.031 12c0-5.5 4.471-9.969 9.973-9.969 5.502 0 9.969 4.469 9.969 9.969 0 5.502-4.467 9.97-9.969 9.97z" />
                          </svg>
                          <span>Kirim ke WA</span>
                        </button>
                      ) : <div />}

                      <p className="text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {msg.sender === "user" && (
                    <div className="w-7 h-7 rounded-xl bg-white/90 border border-white shadow-sm flex items-center justify-center text-slate-700 shrink-0 mt-0.5 font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 text-xs justify-start items-center animate-in fade-in">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/80 backdrop-blur-xl border border-white/90 text-slate-700 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                    <span className="font-semibold text-slate-700">Zalde AI sedang berpikir...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-[11px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">Saran Pertanyaan:</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(qp)}
                      className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 font-semibold transition-all border border-white/90 shadow-sm cursor-pointer"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3.5 border-t border-white/60 bg-white/40 backdrop-blur-xl flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Tanyakan jadwal, prioritas, atau rekomendasi tugas..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 text-slate-900 placeholder:text-slate-400 text-xs px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white transition-all disabled:opacity-40 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* TAB 2: Diskusi Tugas (Collaboration Chat) */}
        {currentTab === "task_chat" && (
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
                  <button
                    type="button"
                    onClick={async () => {
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
                    }}
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
              <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Pilih Tugas untuk Didiskusikan</h4>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Pilih salah satu tugas dari daftar di bawah ini untuk membuka ruang obrolan tim.
                </p>
                <div className="w-full space-y-2 max-h-72 overflow-y-auto pr-1">
                  {(tasks || []).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTaskForChat?.(t)}
                      className="p-3 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 text-left cursor-pointer transition-all shadow-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{t.title}</p>
                        <p className="text-[10px] text-slate-400 capitalize">Status: {t.status}</p>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl shrink-0 transition-colors"
                      >
                        Buka Diskusi
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Task Discussion Message Thread */}
            {activeTaskForChat && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {taskMessages.length === 0 && !isLoadingTaskMessages ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                      <div className="w-10 h-10 rounded-2xl bg-white/60 border border-white flex items-center justify-center mb-2 shadow-xs">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Belum ada obrolan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mulai percakapan dengan anggota tim kolaborator tugas ini!
                      </p>
                    </div>
                  ) : (
                    taskMessages.map((msg) => {
                      const isMe = msg.userId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 text-xs leading-relaxed ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isMe && (
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-[10px] uppercase">
                              {msg.user?.name?.charAt(0) || "U"}
                            </div>
                          )}

                          <div
                            className={`max-w-[80%] rounded-2xl p-3 shadow-xs ${
                              isMe
                                ? "bg-indigo-600 text-white font-medium"
                                : "bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-800"
                            }`}
                          >
                            {!isMe && (
                              <p className="text-[10px] font-bold text-indigo-600 mb-1">
                                {msg.user?.name || "Kolaborator"}
                              </p>
                            )}
                            <div className="whitespace-pre-wrap break-words text-xs">{msg.content || msg.message}</div>
                            <p
                              className={`text-[9px] mt-1.5 text-right ${
                                isMe ? "text-indigo-200" : "text-slate-400"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          {isMe && (
                            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-[10px] uppercase">
                              {user?.name?.charAt(0) || "S"}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  <div ref={taskMessagesEndRef} />
                </div>

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
        )}
      </aside>
    </>
  );
};
