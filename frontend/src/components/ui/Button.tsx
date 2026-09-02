import React from "react";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-xs sm:text-sm px-4 py-2 gap-2",
      lg: "text-sm sm:text-base px-5 py-2.5 gap-2.5",
      icon: "p-2 rounded-xl",
    };

    const variantStyles = {
      primary:
        "bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-900/15 border border-slate-900 focus:ring-slate-900",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 focus:ring-slate-400",
      outline:
        "bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm focus:ring-slate-400",
      ghost:
        "bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 focus:ring-slate-400",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/15 border border-rose-600 focus:ring-rose-500",
      ai: "bg-slate-900 hover:bg-black text-white shadow-lg border border-purple-400/40 focus:ring-purple-500",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
