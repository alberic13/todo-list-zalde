import React from "react";
import { cn } from "../../utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverEffect = true, children, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-2xl glass-card p-4 transition-all duration-200 border border-slate-800/80",
        hoverEffect && "glass-card-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
