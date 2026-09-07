import React from "react";

interface ForgotPasswordRequestStepProps {
  email: string;
  setEmail: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  cooldown: number;
}

export const ForgotPasswordRequestStep: React.FC<ForgotPasswordRequestStepProps> = ({
  email,
  setEmail,
  onSubmit,
  isLoading,
  cooldown,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
  );
};
