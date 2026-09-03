import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Check, Smartphone, ShieldCheck, Loader2 } from "lucide-react";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Prioritize database value, fallback to localStorage
      const initialPhone = user?.phoneNumber || localStorage.getItem("zalde_user_wa") || "";
      setPhoneNumber(initialPhone);
      setIsSaved(false);
      setError(null);
    }
  }, [isOpen, user?.phoneNumber]);

  const cleanNumber = (num: string) => {
    let clean = num.replace(/\D/g, "");
    if (clean.startsWith("08")) {
      clean = "628" + clean.slice(2);
    } else if (clean.startsWith("8")) {
      clean = "628" + clean.slice(1);
    }
    return clean;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = cleanNumber(phoneNumber);
    setIsSubmitting(true);
    setError(null);

    try {
      // Save directly to user account in database
      await updateProfile({ phoneNumber: formatted });
      // Keep in localStorage for fast offline/cache access
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan Integrasi WhatsApp"
      description="Hubungkan nomor WhatsApp Anda agar Zalde AI dapat mengirimkan jadwal prioritas harian secara langsung."
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
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

        {/* Feature Highlights */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Fitur Zalde AI WhatsApp:</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed pl-6">
            Ketik di Zalde AI: <em>"Kirim jadwal hari ini ke WA"</em> untuk mendapatkan pesan terstruktur ringkasan tugas prioritas harian.
          </p>
        </div>

        {/* Action Buttons */}
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
    </Modal>
  );
};
