import React from "react";
import { cn } from "../../utils/cn";
import { TaskPriority, TaskStatus } from "../../types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "priority" | "category";
  status?: TaskStatus;
  priority?: TaskPriority;
  colorHex?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  status,
  priority,
  colorHex,
  children,
  ...props
}) => {
  let badgeStyle = "bg-slate-800 text-slate-300 border-slate-700/60";

  if (variant === "priority" || priority) {
    switch (priority) {
      case "urgent":
        badgeStyle = "bg-rose-500/15 text-rose-300 border-rose-500/30";
        break;
      case "high":
        badgeStyle = "bg-amber-500/15 text-amber-300 border-amber-500/30";
        break;
      case "medium":
        badgeStyle = "bg-blue-500/15 text-blue-300 border-blue-500/30";
        break;
      case "low":
        badgeStyle = "bg-slate-500/15 text-slate-300 border-slate-500/30";
        break;
    }
  } else if (variant === "status" || status) {
    switch (status) {
      case "done":
        badgeStyle = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
        break;
      case "in_progress":
        badgeStyle = "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
        break;
      case "todo":
        badgeStyle = "bg-slate-500/15 text-slate-300 border-slate-500/30";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        badgeStyle,
        className
      )}
      style={colorHex ? { backgroundColor: `${colorHex}20`, borderColor: `${colorHex}40`, color: colorHex } : undefined}
      {...props}
    >
      {variant === "priority" && priority && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-rose-400": priority === "urgent",
            "bg-amber-400": priority === "high",
            "bg-blue-400": priority === "medium",
            "bg-slate-400": priority === "low",
          })}
        />
      )}
      {children || priority || status}
    </span>
  );
};
