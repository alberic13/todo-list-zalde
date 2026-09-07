import React from "react";

interface ForgotPasswordResetStepProps {
  token: string;
  setToken: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
  cooldown: number;
}

export const ForgotPasswordResetStep: React.FC<ForgotPasswordResetStepProps> = ({
  token,
  setToken,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  onSubmit,
  onResend,
  onBack,
  isLoading,
  cooldown,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
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
            onClick={onResend}
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
          onClick={onBack}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 transition cursor-pointer"
        >
          Kembali ke Langkah Sebelumnya
        </button>
      </div>
    </form>
  );
};
