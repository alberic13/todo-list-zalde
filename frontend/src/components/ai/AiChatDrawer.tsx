import React, { useState, useRef, useEffect } from "react";
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
  CheckCircle2,
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
  
  ];

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
        text: "Percakapan dibersihkan. Apa yang ingin Anda tanyakan seputar tugas Anda sekarang?",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-3xl glass-panel shadow-2xl border border-purple-500/40 bg-slate-950/95 flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-5 ${
        isExpanded
          ? "w-[90vw] sm:w-[640px] h-[80vh]"
          : "w-[90vw] sm:w-[420px] h-[540px]"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-400/40">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white">Zalde AI</h3>
            </div>
            <p className="text-[10px] text-slate-400">Asisten Pintar Produktivitas Tugas Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Bersihkan chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors hidden sm:block"
            title={isExpanded ? "Perkecil" : "Perbesar"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Tutup drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-purple-600/30 text-purple-300 border border-purple-500/30"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "glass-card border border-slate-700/60 bg-slate-900/90 text-slate-200 rounded-tl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Referenced Tasks Chip List */}
              {msg.referencedTasks && msg.referencedTasks.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
                  <p className="text-[10px] font-semibold text-purple-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tugas Terkait (RAG Context):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.referencedTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onOpenTaskModal?.(t)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/30 truncate max-w-[200px] transition-colors"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span className="block text-[9px] text-slate-400 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading / Thinking Indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="glass-card rounded-2xl p-3 text-xs text-slate-300 border border-purple-500/30 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Memproses konteks tugas & berpikir...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[11px] text-left px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-purple-900/30 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 transition-all leading-tight"
            >
              💡 {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/80 rounded-b-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Tanyakan jadwal, prioritas, atau rekomendasi kerja..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder:text-slate-500 text-xs px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-600/30 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
