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
      label: "Total Tugas",
      value: stats.total,
      icon: ListTodo,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      label: "Sedang Berjalan",
      value: stats.inProgress,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Selesai",
      value: stats.done,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Terlambat",
      value: stats.overdue,
      icon: AlertTriangle,
      color: stats.overdue > 0 ? "text-rose-400" : "text-slate-400",
      bg: stats.overdue > 0 ? "bg-rose-500/10" : "bg-slate-800/40",
      border: stats.overdue > 0 ? "border-rose-500/30" : "border-slate-700/40",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl glass-card border ${item.border} flex items-center justify-between transition-all hover:scale-[1.02]`}
            >
              <div>
                <p className="text-xs font-medium text-slate-400">{item.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Banner */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Tingkat Penyelesaian</h4>
            <p className="text-xs text-slate-400">
              {stats.done} dari {stats.total} tugas terselesaikan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-72">
          <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-200 shrink-0 w-10 text-right">
            {stats.completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};
