import React, { useState, useEffect } from "react";
import {
  Check,
  Copy,
  RefreshCw,
  ExternalLink,
  CalendarDays,
  CalendarCheck,
} from "lucide-react";
import { Button } from "../ui/Button";
import { calendarService } from "../../services/calendarService";

export interface CalendarTabProps {
  onClose: () => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({ onClose }) => {
  const [calendarPath, setCalendarPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarToken();
  }, []);

  const loadCalendarToken = async () => {
    try {
      setIsLoading(true);
      const data = await calendarService.getCalendarToken();
      setCalendarPath(data.path);
    } catch (err: any) {
      setError(err.message || "Gagal memuat link kalender");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (
      !window.confirm(
        "Buat link kalender baru? Kalender yang sudah terhubung dengan link lama tidak akan menampilkan tugas lagi sampai Anda memasukkan link baru."
      )
    ) {
      return;
    }

    try {
      setIsRegenerating(true);
      const data = await calendarService.regenerateCalendarToken();
      setCalendarPath(data.path);
      setIsCopied(false);
    } catch (err: any) {
      setError(err.message || "Gagal membuat link kalender baru");
    } finally {
      setIsRegenerating(false);
    }
  };

  const baseUrl = window.location.origin;
  const httpFeedUrl = calendarPath ? `${baseUrl}${calendarPath}` : "";
  const webcalFeedUrl = httpFeedUrl ? calendarService.getWebcalUrl(httpFeedUrl) : "";
  const googleSubscribeUrl = httpFeedUrl
    ? calendarService.getGoogleCalendarSubscribeUrl(httpFeedUrl)
    : "";

  const handleCopyUrl = (urlToCopy: string) => {
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 text-xs text-indigo-950">
        <div className="flex items-center gap-2 font-bold text-indigo-900">
          <CalendarCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Jadwal Tugas Otomatis Muncul di Kalender</span>
        </div>
        <p className="text-[11px] text-indigo-800/90 leading-relaxed pl-6">
          Setiap tugas yang memiliki batas waktu akan otomatis tercatat di kalender Anda (Google Calendar, iPhone, Mac, atau Outlook). Ketika tugas ditandai selesai, jadwal akan otomatis diperbarui.
        </p>
      </div>

      {/* Subscription URL Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            <span>Link Kalender Pribadi Anda</span>
          </label>
          <button
            type="button"
            onClick={handleRegenerateToken}
            disabled={isRegenerating || isLoading}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition"
            title="Buat link baru jika ingin memutuskan sambungan di kalender lama"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin text-indigo-600" : ""}`} />
            Buat Link Baru
          </button>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            readOnly
            value={
              isLoading
                ? "Menyiapkan link kalender..."
                : webcalFeedUrl || "Link belum tersedia"
            }
            className="w-full pr-32 pl-3.5 py-2.5 text-xs font-medium rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
          />
          <button
            type="button"
            onClick={() => handleCopyUrl(webcalFeedUrl)}
            disabled={!webcalFeedUrl || isLoading}
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
                <span>Salin Link</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 pl-1">
          Gunakan link ini untuk menyambungkan jadwal ke aplikasi kalender Anda.
        </p>
      </div>

      {/* Quick Connect Buttons */}
      <div className="space-y-2 pt-1">
        <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Sambungkan Langsung:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Google Calendar */}
          <a
            href={googleSubscribeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                G
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Google Calendar
                </h4>
                <p className="text-[10px] text-slate-500">Buka langsung di Google Calendar</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Apple Calendar */}
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
                  Apple Calendar
                </h4>
                <p className="text-[10px] text-slate-500">Untuk iPhone, iPad, atau Mac</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* Step-by-Step Instructions */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-2">
        <span className="font-bold text-slate-800 block text-xs">Panduan Menghubungkan:</span>
        <ol className="space-y-1.5 text-[11px] text-slate-600 pl-4 list-decimal">
          <li>
            Klik tombol <strong className="text-slate-800">Salin Link</strong> di atas.
          </li>
          <li>
            Buka aplikasi kalender Anda (Google Calendar, Kalender iPhone, atau Outlook).
          </li>
          <li>
            Pilih menu <strong className="text-slate-800">Tambah Kalender dari Link/URL</strong>, lalu tempel link yang telah disalin.
          </li>
        </ol>
        <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200/60">
          Jadwal tugas Anda akan muncul otomatis di kalender dan diperbarui secara berkala.
        </p>
      </div>

      {/* Footer */}
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
  );
};
