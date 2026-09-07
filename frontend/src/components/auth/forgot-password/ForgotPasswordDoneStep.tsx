import React from "react";

interface ForgotPasswordDoneStepProps {
  onLogin: () => void;
}

export const ForgotPasswordDoneStep: React.FC<ForgotPasswordDoneStepProps> = ({
  onLogin,
}) => {
  return (
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
        onClick={onLogin}
        className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold tracking-normal shadow-sm transition-all duration-150 cursor-pointer"
      >
        Masuk Sekarang
      </button>
    </div>
  );
};
