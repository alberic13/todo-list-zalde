import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";
import type { ChatMessage } from "./aiChat.types";

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "ai",
  text: "Halo! Saya **Zalde AI**. Saya dapat melihat konteks seluruh tugas Anda dan membantu merencanakan prioritas harian. Ada yang bisa saya bantu hari ini?",
  timestamp: new Date(),
};

export const useAiChat = (clearTrigger?: number) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: "ai",
          text: "Riwayat percakapan telah dibersihkan. Ada yang bisa saya bantu selanjutnya?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [clearTrigger]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSend,
    handleShareToWhatsApp,
  };
};
