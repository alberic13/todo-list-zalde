import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export const VerifyEmailSuccessView: React.FC = () => {
  return (
    <div className="text-center py-6 animate-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Akun Berhasil Aktif!</h3>
      <p className="text-sm text-slate-600 mb-6">
        Alamat email Anda telah terverifikasi. Mengalihkan ke dashboard...
      </p>
      <div className="flex justify-center items-center gap-2 text-xs font-semibold text-emerald-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Menyiapkan ruang kerja Anda...</span>
      </div>
    </div>
  );
};
