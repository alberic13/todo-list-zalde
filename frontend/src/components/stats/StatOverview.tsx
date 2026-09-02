import React from "react";
import { TaskStats } from "../../types";
import { CheckCircle2, Clock, ListTodo, AlertTriangle, TrendingUp } from "lucide-react";

export interface StatOverviewProps {
  stats: TaskStats | null;
}

export const StatOverview: React.FC<StatOverviewProps> = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    {
      label: "TOTAL TUGAS",
      value: stats.total,
      icon: ListTodo,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "SEDANG BERJALAN",
      value: stats.inProgress,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "SELESAI",
      value: stats.done,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "TERLAMBAT",
      value: stats.overdue,
      icon: AlertTriangle,
      color: stats.overdue > 0 ? "text-rose-600" : "text-slate-400",
      bg: stats.overdue > 0 ? "bg-rose-50" : "bg-slate-100",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Metric Cards - Matching Stitch Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 sm:p-6 card-shadow border border-white/80 hover:shadow-xl hover:bg-white transition-all flex flex-col justify-center h-[120px]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/85 backdrop-blur-xl card-shadow border border-white/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Tingkat Penyelesaian Tugas</h4>
            <p className="text-xs text-slate-500 font-medium">
              {stats.done} dari {stats.total} tugas telah terselesaikan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-72">
          <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-slate-900 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-slate-800 shrink-0 w-12 text-right">
            {stats.completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};
