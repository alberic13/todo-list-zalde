import React from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { useAiChat } from "./useAiChat";
import { AiChatMessageItem } from "./AiChatMessageItem";
import type { AiChatTabProps } from "./aiChat.types";

export type { ChatMessage, AiChatTabProps } from "./aiChat.types";

const QUICK_PROMPTS = [
  "Apa tugas paling prioritas yang harus saya selesaikan hari ini?",
  "Kirim ringkasan jadwal hari ini ke WhatsApp",
  "Bantu rencanakan jadwal tugas saya minggu ini.",
];

export const AiChatTab: React.FC<AiChatTabProps> = ({
  onOpenTaskModal,
  clearTrigger,
}) => {
  const {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSend,
    handleShareToWhatsApp,
  } = useAiChat(clearTrigger);

  return (
    <>
      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <AiChatMessageItem
            key={msg.id}
            msg={msg}
            onOpenTaskModal={onOpenTaskModal}
            onShareToWhatsApp={handleShareToWhatsApp}
          />
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
            {QUICK_PROMPTS.map((qp, i) => (
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
  );
};
