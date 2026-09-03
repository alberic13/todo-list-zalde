import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";
import { Task } from "../../types";
import {
  Send,
  Bot,
  User,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Loader2,
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
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpenTaskModal,
}) => {
  const { user } = useAuth();
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

  const quickPrompts = [
    "Apa tugas paling prioritas yang harus saya selesaikan hari ini?",
    "Kirim ringkasan jadwal hari ini ke WhatsApp",
    "Bantu rencanakan jadwal tugas saya minggu ini.",
  ];

  const handleShareToWhatsApp = (text: string) => {
    const savedPhone = user?.phoneNumber || localStorage.getItem("zalde_user_wa") || "";
    // Clean markdown bold for WhatsApp
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
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

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

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: "Riwayat percakapan telah dibersihkan. Ada yang bisa saya bantu selanjutnya?",
        timestamp: new Date(),
      },
    ]);
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
          backgroundColor: "rgba(255, 255, 255, 0.72)",
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
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                Zalde AI
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Konteks & Prioritas Otomatis</p>
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
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
              title="Bersihkan Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
                  className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 font-semibold transition-all border border-white/90 shadow-sm"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
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
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white transition-all disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </>
  );
};
