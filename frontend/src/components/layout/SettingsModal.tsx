import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Calendar, Smartphone } from "lucide-react";
import { CalendarTab } from "../settings/CalendarTab";
import { WhatsAppTab } from "../settings/WhatsAppTab";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "calendar" | "whatsapp";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan & Sambungan Kalender"
      description="Sambungkan jadwal tugas ke kalender HP / laptop atau asisten WhatsApp."
      maxWidth="lg"
    >
      {/* Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl mb-5 border border-slate-200/60">
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === "calendar"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kalender (Google / Apple)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("whatsapp")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === "whatsapp"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "calendar" && <CalendarTab onClose={onClose} />}
      {activeTab === "whatsapp" && <WhatsAppTab onClose={onClose} />}
    </Modal>
  );
};
