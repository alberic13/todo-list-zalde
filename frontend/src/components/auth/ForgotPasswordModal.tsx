import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { authService } from "../../services/authService";

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

  // Countdown timer for cooldown
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

  // Step 1: Request Reset Code
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Silakan masukkan alamat email yang terdaftar.");
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
        setToken(res.devCode);
      } else {
        setDevCode(null);
        setToken("");
      }
      setStep("reset");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Gagal memproses permintaan reset kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code and Update Password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Silakan masukkan kode verifikasi 6 digit.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token.trim(), newPassword);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Kode verifikasi tidak valid atau telah kedaluwarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetModalState}
      maxWidth="md"
      hideHeader
      className="rounded-2xl border border-slate-200/90 bg-white/98 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)] p-6 sm:p-7 text-slate-900"
    >
      {/* Custom Header: Clean, Typographic, No Icons */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase mb-1">
            Pemulihan Akun
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {step === "request" && "Lupa Kata Sandi"}
            {step === "reset" && "Verifikasi Kode Reset"}
            {step === "done" && "Kata Sandi Diperbarui"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
            {step === "request" &&
              "Masukkan alamat email yang terdaftar. Kami akan mengirimkan kode verifikasi 6 digit untuk mengatur ulang kata sandi Anda."}
            {step === "reset" &&
              `Masukkan 6 digit kode verifikasi yang telah dikirim ke ${email || "email Anda"}.`}
            {step === "done" &&
              "Kata sandi akun Anda telah berhasil diperbarui dan siap digunakan kembali."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetModalState}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
        >
          Tutup
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50/90 border-l-3 border-rose-500 text-rose-800 text-xs font-medium mb-4 leading-relaxed animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Success notification */}
      {message && !error && !warning && (
        <div className="p-3 rounded-xl bg-emerald-50/90 border-l-3 border-emerald-500 text-emerald-800 text-xs font-medium mb-4 leading-relaxed animate-in fade-in duration-200">
          {message}
        </div>
      )}

      {/* Delivery warning notice */}
      {warning && (
        <div className="p-3 rounded-xl bg-amber-50/90 border-l-3 border-amber-500 text-amber-900 text-xs font-medium mb-4 leading-relaxed animate-in fade-in duration-200">
          <span className="font-semibold block mb-0.5">Catatan Pengiriman:</span>
          <span>{warning}</span>
        </div>
      )}

      {/* Development code helper */}
      {devCode && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between mb-4 font-medium">
          <span>Mode Dev: Kode OTP Anda</span>
          <span className="font-mono text-xs font-bold tracking-widest bg-slate-200/80 px-2 py-0.5 rounded text-slate-900">
            {devCode}
          </span>
        </div>
      )}

      {/* STEP 1: Request Reset Code */}
      {step === "request" && (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold text-slate-700 mb-1.5"
              htmlFor="reset-email"
            >
              Alamat Email Terdaftar
            </label>
            <input
              id="reset-email"
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-xs"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold tracking-normal shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengirim Kode...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Tunggu ({cooldown}s) untuk Kirim Ulang</span>
              ) : (
                <span>Kirim Kode Verifikasi</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Input Code & New Password */}
      {step === "reset" && (
        <form onSubmit={handleConfirmReset} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-xs font-semibold text-slate-700"
                htmlFor="reset-token"
              >
                Kode Verifikasi (6 Digit)
              </label>
              <button
                type="button"
                disabled={isLoading || cooldown > 0}
                onClick={handleRequestReset}
                className="text-[11px] text-slate-600 hover:text-slate-900 disabled:text-slate-400 font-semibold cursor-pointer disabled:cursor-not-allowed transition"
              >
                {cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : "Kirim Ulang"}
              </button>
            </div>
            <input
              id="reset-token"
              type="text"
              required
              maxLength={20}
              placeholder="123456"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-mono tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-xs font-semibold text-slate-700"
                htmlFor="reset-new-password"
              >
                Kata Sandi Baru
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition"
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <input
              id="reset-new-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-xs"
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold text-slate-700 mb-1.5"
              htmlFor="reset-confirm-password"
            >
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              id="reset-confirm-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-xs"
            />
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold tracking-normal shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan Sandi...</span>
                </>
              ) : (
                <span>Simpan Kata Sandi Baru</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 transition cursor-pointer"
            >
              Kembali ke Langkah Sebelumnya
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Success Screen */}
      {step === "done" && (
        <div className="py-2 space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
            <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-emerald-700 mb-1">
              Pembaruan Berhasil
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kata sandi akun Anda telah berhasil diubah. Silakan masuk kembali menggunakan kata sandi baru Anda.
            </p>
          </div>

          <button
            onClick={() => {
              handleResetModalState();
              if (onSuccessLogin) {
                onSuccessLogin(email);
              }
            }}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold tracking-normal shadow-sm transition-all duration-150 cursor-pointer"
          >
            Masuk Sekarang
          </button>
        </div>
      )}
    </Modal>
  );
};
