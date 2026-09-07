import React from "react";
import { Modal } from "../ui/Modal";
import { AuthResponse } from "../../services/authService";
import { ShieldCheck, ArrowRight, AlertCircle, Loader2, RefreshCw, Mail } from "lucide-react";
import { useVerifyEmail } from "./useVerifyEmail";
import { VerifyEmailSuccessView } from "./VerifyEmailSuccessView";

export interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  initialDevCode?: string;
  onSuccess: (authData: AuthResponse) => void;
}

export const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({
  isOpen,
  onClose,
  email,
  initialDevCode,
  onSuccess,
}) => {
  const {
    code,
    setCode,
    isLoading,
    isResending,
    error,
    setError,
    message,
    devCode,
    cooldown,
    isSuccess,
    inputRef,
    handleVerify,
    handleResend,
  } = useVerifyEmail({
    isOpen,
    email,
    initialDevCode,
    onSuccess,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      className="p-6 sm:p-8 overflow-hidden"
    >
      {isSuccess ? (
        <VerifyEmailSuccessView />
      ) : (
        <div>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25 text-white">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Verifikasi Email Anda</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
              Kode OTP 6-digit telah dikirim ke: <br />
              <span className="font-semibold text-slate-800 break-all">{email}</span>
            </p>
          </div>

          {/* Alert Message */}
          {message && !error && (
            <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-700 text-xs flex items-center gap-2 mb-4 font-medium animate-in fade-in">
              <Mail className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Dev Simulation Badge */}
          {devCode && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-4 flex items-center justify-between font-mono">
              <span>🔧 Mode Simulasi / Test OTP:</span>
              <span className="font-bold text-sm tracking-wider bg-amber-200/70 px-2 py-0.5 rounded">
                {devCode}
              </span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4 font-medium auth-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                Masukkan 6-Digit Kode OTP
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setCode(val);
                    if (error) setError(null);
                  }}
                  placeholder="------"
                  disabled={isLoading}
                  className="w-full h-14 text-center text-3xl font-mono font-bold tracking-[0.45em] sm:tracking-[0.6em] rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition bg-slate-50/50 hover:bg-white text-slate-900 placeholder:text-slate-300 uppercase shadow-inner"
                  autoComplete="one-time-code"
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Cek kotak masuk atau folder spam email Anda.
              </p>
            </div>

            {/* Tombol Verifikasi */}
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm rounded-xl shadow-lg shadow-slate-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi & Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Tombol Kirim Ulang & Batal */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 font-medium py-1 transition"
              >
                Ganti Email / Batal
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold disabled:text-slate-400 disabled:pointer-events-none transition py-1"
              >
                {isResending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>
                  {cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : "Kirim Ulang Kode"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
};
