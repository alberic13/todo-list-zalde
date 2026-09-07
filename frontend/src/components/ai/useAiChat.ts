import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";
import type { ChatMessage } from "./aiChat.types";

const WELCOME_MSG: ChatMessage = {
  id: "welcome",
  sender: "ai",
  text: "Halo! Saya **Zalde AI**. Saya dapat melihat konteks seluruh tugas Anda dan membantu merencanakan prioritas harian. Ada yang bisa saya bantu hari ini?",
  timestamp: new Date(),
};

const getStorageKey = (uid?: string) =>
  uid ? `zalde_ai_chat_history_${uid}` : "zalde_ai_chat_history";

const loadStored = (key: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    }
  } catch (e) {
    console.error("Gagal membaca riwayat chat AI:", e);
  }
  return [WELCOME_MSG];
};

export const useAiChat = (clearTrigger?: number) => {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?.id);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStored(storageKey));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadStored(storageKey));
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error("Gagal menyimpan riwayat chat AI:", e);
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      setMessages([{
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: "Riwayat percakapan telah dibersihkan. Ada yang bisa saya bantu selanjutnya?",
        timestamp: new Date(),
      }]);
    }
  }, [clearTrigger]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleShareToWhatsApp = (text: string) => {
    const phone = user?.phoneNumber || localStorage.getItem("zalde_user_wa") || "";
    const waText = text.replace(/\*\*(.*?)\*\*/g, "*$1*").replace(/###\s*(.*)/g, "*$1*");
    const date = new Date().toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const msg = encodeURIComponent(`🚀 *Jadwal Prioritas - Zalde AI*\n📅 ${date}\n\n${waText}\n\n_Dibuat otomatis oleh Zalde Todo AI Suite_`);
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: "user", text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await aiService.chat(text);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: "ai", text: res.response, referencedTasks: res.referencedTasks, timestamp: new Date() },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: "ai", text: `Maaf, kendala AI: ${err.message || "Gagal server"}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, input, setInput, isLoading, messagesEndRef, handleSend, handleShareToWhatsApp };
};
