import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { LogOut, Trash2, AlertTriangle } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  iconType?: "logout" | "trash" | "warning";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  iconType = "warning",
  isLoading = false,
}) => {
  const renderIcon = () => {
    switch (iconType) {
      case "logout":
        return <LogOut className="w-5 h-5 text-rose-600" />;
      case "trash":
        return <Trash2 className="w-5 h-5 text-rose-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  const iconBg =
    variant === "danger"
      ? "bg-rose-50 border-rose-100"
      : variant === "warning"
      ? "bg-amber-50 border-amber-100"
      : "bg-slate-100 border-slate-200";

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" hideHeader>
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 shadow-sm ${iconBg}`}
        >
          {renderIcon()}
        </div>

        <h3 className="text-base font-extrabold text-slate-900 mb-2">
          {title}
        </h3>

        <div className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
          {description}
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 text-xs py-2.5"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant === "warning" ? "primary" : "danger"}
            onClick={onConfirm}
            isLoading={isLoading}
            className={`flex-1 text-xs py-2.5 ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : ""
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
