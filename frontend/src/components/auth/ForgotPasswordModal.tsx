import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { authService } from "../../services/authService";
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialToken?: string;
  onSuccessLogin?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = "",
  initialToken = "",
  onSuccessLogin,
}) => {
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for 60s cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto set if initialToken is provided (e.g. from email URL link)
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setStep("reset");
    }
  }, [initialToken]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleResetModalState = () => {
    setStep(initialToken ? "reset" : "request");
    setError(null);
    setMessage(null);
    setWarning(null);
    setDevCode(null);
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  // Step 1: Request Reset Code via Resend
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Silakan masukkan alamat email terdaftar");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);
    setWarning(null);

    try {
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message || "Kode verifikasi telah dikirim ke email Anda.");
      if (res.warning) {
        setWarning(res.warning);
      }
      if (res.devCode) {
        setDevCode(res.devCode);
        setToken(res.devCode); // autofill for dev testing convenience
      } else {
        setDevCode(null);
        setToken(""); // User must read from actual email inbox
      }
      setStep("reset");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Gagal memproses permintaan reset kata sandi");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code and Update Password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Silakan masukkan kode verifikasi 6 digit");
      return;
    }

    if (newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token.trim(), newPassword);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Kode verifikasi tidak valid atau telah kedaluwarsa");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetModalState}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <span>
            {step === "request" && "Lupa Kata Sandi"}
            {step === "reset" && "Verifikasi Kode Reset"}
            {step === "done" && "Kata Sandi Diperbarui"}
          </span>
        </div>
      }
      description={
        step === "request"
          ? "Masukkan email Anda untuk menerima kode verifikasi pemulihan akun."
          : step === "reset"
          ? `Masukkan kode 6-digit yang dikirim ke ${email || "email Anda"}.`
          : "Kata sandi akun Anda berhasil diperbarui."
      }
    >
      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2.5 mb-4 font-medium animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Info message */}
      {message && !error && !warning && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs flex items-center gap-2.5 mb-4 font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {/* Warning alert if Resend testing restriction occurs */}
      {warning && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5 mb-4 font-medium animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block mb-0.5">Catatan Pengiriman:</span>
            <span>{warning}</span>
          </div>
        </div>
      )}

      {/* Dev notice if simulated or devCode available */}
      {devCode && (
        <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-700 text-xs flex items-center justify-between mb-4 font-medium">
          <span>💡 [Dev Mode] Kode OTP Anda: <strong className="font-mono text-sm tracking-wider">{devCode}</strong></span>
        </div>
      )}

      {/* STEP 1: Input Email */}
      {step === "request" && (
        <form onSubmit={handleRequestReset} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reset-email">
              Alamat Email Terdaftar
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="reset-email"
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-lg shadow-slate-900/15 hover:shadow-slate-900/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Mengirim Email...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Tunggu ({cooldown}s) untuk Kirim Ulang</span>
              ) : (
                <>
                  <span>Kirim Kode Verifikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Input Code & New Password */}
      {step === "reset" && (
        <form onSubmit={handleConfirmReset} className="space-y-3.5 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="reset-token">
                Kode Verifikasi (6 Digit)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  disabled={isLoading || cooldown > 0}
                  onClick={handleRequestReset}
                  className="text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 font-semibold cursor-pointer disabled:cursor-not-allowed transition"
                >
                  {cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : "Kirim Ulang Kode"}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Ganti Email
                </button>
              </div>
            </div>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                id="reset-token"
                type="text"
                required
                maxLength={20}
                placeholder="Contoh: 123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reset-new-password">
              Kata Sandi Baru
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reset-confirm-password">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-lg shadow-indigo-600/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memperbarui Sandi...</span>
                </>
              ) : (
                <>
                  <span>Simpan Kata Sandi Baru</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Success Screen */}
      {step === "done" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Berhasil Diperbarui!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Kata sandi Anda telah berhasil diubah. Silakan masuk kembali dengan kata sandi baru.
            </p>
          </div>

          <button
            onClick={() => {
              handleResetModalState();
              if (onSuccessLogin) {
                onSuccessLogin(email);
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-semibold tracking-wide shadow-lg shadow-slate-900/15 transition-all"
          >
            <span>Masuk Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </Modal>
  );
};
