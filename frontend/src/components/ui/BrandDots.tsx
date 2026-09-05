import React from "react";

interface BrandDotsProps {
  className?: string;
}

export const BrandDots: React.FC<BrandDotsProps> = ({ className = "gap-1.5" }) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="w-2 h-2 rounded-full bg-rose-500" />
      <div className="w-2 h-2 rounded-full bg-amber-400" />
      <div className="w-2 h-2 rounded-full bg-emerald-500" />
    </div>
  );
};
