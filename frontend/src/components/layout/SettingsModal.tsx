import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import {
  Check,
  Smartphone,
  ShieldCheck,
  Loader2,
  Calendar,
  Copy,
  RefreshCw,
  ExternalLink,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { calendarService } from "../../services/calendarService";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "whatsapp" | "calendar";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("whatsapp");

  // WhatsApp state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar sync state
  const [calendarPath, setCalendarPath] = useState<string>("");
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize WhatsApp number
      const initialPhone = user?.phoneNumber || localStorage.getItem("zalde_user_wa") || "";
      setPhoneNumber(initialPhone);
      setIsSaved(false);
      setError(null);
      setCalendarError(null);

      // Load calendar token
      loadCalendarToken();
    }
  }, [isOpen, user?.phoneNumber]);

  const loadCalendarToken = async () => {
    try {
      setIsCalendarLoading(true);
      const data = await calendarService.getCalendarToken();
      setCalendarPath(data.path);
    } catch (err: any) {
      setCalendarError(err.message || "Gagal memuat token kalender");
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memperbarui URL Kalender? URL lama di Google Calendar / Apple Calendar tidak akan berlaku lagi.")) {
      return;
    }

    try {
      setIsRegenerating(true);
      const data = await calendarService.regenerateCalendarToken();
      setCalendarPath(data.path);
      setIsCopied(false);
    } catch (err: any) {
      setCalendarError(err.message || "Gagal mereset token kalender");
    } finally {
      setIsRegenerating(false);
    }
  };

  const cleanNumber = (num: string) => {
    let clean = num.replace(/\D/g, "");
    if (clean.startsWith("08")) {
      clean = "628" + clean.slice(2);
    } else if (clean.startsWith("8")) {
      clean = "628" + clean.slice(1);
    }
    return clean;
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = cleanNumber(phoneNumber);
    setIsSubmitting(true);
    setError(null);

    try {
      await updateProfile({ phoneNumber: formatted });
      localStorage.setItem("zalde_user_wa", formatted);
      setPhoneNumber(formatted);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan nomor ke database");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Construct absolute feed URLs
  const baseUrl = window.location.origin;
  const httpFeedUrl = calendarPath ? `${baseUrl}${calendarPath}` : "";
  const webcalFeedUrl = httpFeedUrl ? calendarService.getWebcalUrl(httpFeedUrl) : "";
  const googleSubscribeUrl = httpFeedUrl ? calendarService.getGoogleCalendarSubscribeUrl(httpFeedUrl) : "";

  const handleCopyUrl = (urlToCopy: string) => {
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pusat Integrasi & Pengaturan"
      description="Kelola sinkronisasi otomatis ke kalender eksternal dan asisten WhatsApp."
      maxWidth="lg"
    >
      {/* Tab Segment Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl mb-5 border border-slate-200/60">
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
          <span>Sinkronisasi Kalender (iCal)</span>
        </button>
      </div>

      {/* Tab Content: WhatsApp */}
      {activeTab === "whatsapp" && (
        <form onSubmit={handleSavePhone} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor WhatsApp Anda
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-slate-400">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-500 border-r border-slate-200 pr-2">
                  +62
                </span>
              </div>
              <input
                type="tel"
                placeholder="81234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-20 pr-4 py-2.5 text-xs font-medium rounded-2xl bg-white/80 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fitur WhatsApp:</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed pl-6">
              Ketik di Zalde AI: <em>"Kirim jadwal hari ini ke WA"</em> untuk mendapatkan pesan terstruktur ringkasan tugas prioritas harian.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="min-w-[84px] text-xs font-semibold"
            >
              Tutup
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="min-w-[84px] text-xs font-bold bg-slate-900 hover:bg-black text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </span>
              ) : isSaved ? (
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  Tersimpan!
                </span>
              ) : (
                "Simpan"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Tab Content: Calendar (iCal / Webcal) */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          {calendarError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {calendarError}
            </div>
          )}

          {/* Banner Explanation */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-xs text-indigo-950">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Sinkronisasi Otomatis 2 Arah (100% Gratis & Standar RFC 5545)</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed pl-6">
              Langganan live feed ini di aplikasi kalender favorit Anda. Semua tugas aktif yang memiliki deadline akan langsung sinkron secara otomatis. Tugas yang telah ditandai selesai otomatis hilang dari kalender.
            </p>
          </div>

          {/* Subscription URL Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>URL Feed Langganan Kalender (.ics)</span>
              </label>
              <button
                type="button"
                onClick={handleRegenerateToken}
                disabled={isRegenerating || isCalendarLoading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition"
                title="Ganti tautan kalender jika tautan lama ingin dicabut"
              >
                <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin text-indigo-600" : ""}`} />
                Reset URL
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={
                  isCalendarLoading
                    ? "Memuat tautan kalender..."
                    : webcalFeedUrl || "Tautan belum dibuat"
                }
                className="w-full pr-28 pl-3.5 py-2.5 text-xs font-mono rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleCopyUrl(webcalFeedUrl)}
                disabled={!webcalFeedUrl || isCalendarLoading}
                className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 1-Click Fast Integration Buttons */}
          <div className="space-y-2 pt-1">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Akses Cepat 1-Klik:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Google Calendar Direct Add */}
              <a
                href={googleSubscribeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                    G
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Google Calendar
                    </h4>
                    <p className="text-[10px] text-slate-500">Buka pengaturan langganan web</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Apple Calendar Webcal Trigger */}
              <a
                href={webcalFeedUrl}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-xs">
                    
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Apple Calendar / iOS
                    </h4>
                    <p className="text-[10px] text-slate-500">Buka langsung di aplikasi Calendar</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Instruction Guide */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800 block">Cara Pasang Manual di Kalender:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
              <li>
                <strong className="text-slate-700">Google Calendar:</strong> Buka Kalender di web ➔ Di samping <em>"Kalender lain"</em> klik tanda <strong>+</strong> ➔ Pilih <strong>"Dari URL"</strong> ➔ Tempelkan URL di atas.
              </li>
              <li>
                <strong className="text-slate-700">Apple Calendar (Mac/iPhone):</strong> Buka Calendar ➔ Klik menu <strong>File</strong> ➔ <strong>New Calendar Subscription</strong> ➔ Tempelkan URL di atas.
              </li>
              <li>
                <strong className="text-slate-700">Outlook:</strong> Klik <strong>Add Calendar</strong> ➔ Pilih <strong>Subscribe from web</strong> ➔ Tempelkan URL di atas.
              </li>
            </ul>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="min-w-[84px] text-xs font-semibold"
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
