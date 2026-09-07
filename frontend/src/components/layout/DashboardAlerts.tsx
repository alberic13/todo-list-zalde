import React from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

export interface DashboardAlertsProps {
  joinNotification: {
    message: string;
    success: boolean;
  } | null;
  onCloseJoinNotification: () => void;
  isSemanticSearch: boolean;
  onToggleSemanticSearch: () => void;
  error: string | null;
  onRetry: () => void;
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  joinNotification,
  onCloseJoinNotification,
  isSemanticSearch,
  onToggleSemanticSearch,
  error,
  onRetry,
}) => {
  return (
    <>
      {/* Join Notification Alert */}
      {joinNotification && (
        <div
          className={`p-4 rounded-3xl border text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-sm ${
            joinNotification.success
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
              : "bg-rose-50/90 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {joinNotification.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{joinNotification.message}</span>
          </div>
          <button
            onClick={onCloseJoinNotification}
            className="text-xs font-bold underline opacity-70 hover:opacity-100 shrink-0 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Semantic Search Banner Info if active */}
      {isSemanticSearch && (
        <div className="p-4 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 card-shadow flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <p className="text-slate-800 font-medium">
              Mode <strong className="font-bold text-slate-900">AI Search</strong> aktif: Hasil diurutkan berdasarkan makna & relevansi.
            </p>
          </div>
          <button
            onClick={onToggleSemanticSearch}
            className="text-[11px] text-indigo-600 hover:text-indigo-900 underline font-bold shrink-0"
          >
            Kembali ke Keyword
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-3xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong className="font-bold">Kendala Server:</strong> {error}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shrink-0 shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Coba Lagi
          </button>
        </div>
      )}
    </>
  );
};
