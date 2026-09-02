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
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";

  if (variant === "priority" || priority) {
    switch (priority) {
      case "urgent":
        badgeStyle = "bg-rose-50 text-rose-700 border-rose-200/80";
        break;
      case "high":
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
        break;
      case "medium":
        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
        break;
      case "low":
        badgeStyle = "bg-slate-100 text-slate-600 border-slate-200/80";
        break;
    }
  } else if (variant === "status" || status) {
    switch (status) {
      case "done":
        badgeStyle = "bg-[#e8f5e9] text-[#2e7d32] border-transparent font-bold";
        break;
      case "in_progress":
        badgeStyle = "bg-[#fff8e1] text-[#f57f17] border-transparent font-bold";
        break;
      case "todo":
        badgeStyle = "bg-slate-100 text-slate-700 border-slate-200/80 font-bold";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all",
        badgeStyle,
        className
      )}
      style={colorHex ? { backgroundColor: `${colorHex}15`, borderColor: `${colorHex}40`, color: colorHex } : undefined}
      {...props}
    >
      {variant === "priority" && priority && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-rose-500": priority === "urgent",
            "bg-amber-500": priority === "high",
            "bg-blue-500": priority === "medium",
            "bg-slate-500": priority === "low",
          })}
        />
      )}
      {children || priority || status}
    </span>
  );
};
