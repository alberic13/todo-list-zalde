import React from "react";
import { Modal } from "../ui/Modal";
import { ForgotPasswordRequestStep } from "./forgot-password/ForgotPasswordRequestStep";
import { ForgotPasswordResetStep } from "./forgot-password/ForgotPasswordResetStep";
import { ForgotPasswordDoneStep } from "./forgot-password/ForgotPasswordDoneStep";
import { useForgotPassword } from "./forgot-password/useForgotPassword";

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialToken?: string;
  onSuccessLogin?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = "",
  initialToken = "",
  onSuccessLogin,
}) => {
  const {
    step,
    setStep,
    email,
    setEmail,
    token,
    setToken,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    message,
    warning,
    devCode,
    cooldown,
    handleResetModalState,
    handleRequestReset,
    handleConfirmReset,
  } = useForgotPassword({
    initialEmail,
    initialToken,
    onClose,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetModalState}
      maxWidth="md"
      hideHeader
      className="rounded-2xl border border-slate-200/90 bg-white/98 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)] p-6 sm:p-7 text-slate-900"
    >
      {/* Custom Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase mb-1">
            Pemulihan Akun
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {step === "request" && "Lupa Kata Sandi"}
            {step === "reset" && "Verifikasi Kode Reset"}
            {step === "done" && "Kata Sandi Diperbarui"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
            {step === "request" &&
              "Masukkan alamat email yang terdaftar. Kami akan mengirimkan kode verifikasi 6 digit untuk mengatur ulang kata sandi Anda."}
            {step === "reset" &&
              `Masukkan 6 digit kode verifikasi yang telah dikirim ke ${email || "email Anda"}.`}
            {step === "done" &&
              "Kata sandi akun Anda telah berhasil diperbarui dan siap digunakan kembali."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetModalState}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
        >
          Tutup
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50/90 border-l-3 border-rose-500 text-rose-800 text-xs font-medium mb-4 leading-relaxed animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Success notification */}
      {message && !error && !warning && (
        <div className="p-3 rounded-xl bg-emerald-50/90 border-l-3 border-emerald-500 text-emerald-800 text-xs font-medium mb-4 leading-relaxed animate-in fade-in duration-200">
          {message}
        </div>
      )}

      {/* Delivery warning notice */}
      {warning && (
        <div className="p-3 rounded-xl bg-amber-50/90 border-l-3 border-amber-500 text-amber-900 text-xs font-medium mb-4 leading-relaxed animate-in fade-in duration-200">
          <span className="font-semibold block mb-0.5">Catatan Pengiriman:</span>
          <span>{warning}</span>
        </div>
      )}

      {/* Development code helper */}
      {devCode && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between mb-4 font-medium">
          <span>Mode Dev: Kode OTP Anda</span>
          <span className="font-mono text-xs font-bold tracking-widest bg-slate-200/80 px-2 py-0.5 rounded text-slate-900">
            {devCode}
          </span>
        </div>
      )}

      {/* Active Step Forms */}
      {step === "request" && (
        <ForgotPasswordRequestStep
          email={email}
          setEmail={setEmail}
          onSubmit={handleRequestReset}
          isLoading={isLoading}
          cooldown={cooldown}
        />
      )}

      {step === "reset" && (
        <ForgotPasswordResetStep
          token={token}
          setToken={setToken}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onSubmit={handleConfirmReset}
          onResend={handleRequestReset}
          onBack={() => setStep("request")}
          isLoading={isLoading}
          cooldown={cooldown}
        />
      )}

      {step === "done" && (
        <ForgotPasswordDoneStep
          onLogin={() => {
            handleResetModalState();
            if (onSuccessLogin) {
              onSuccessLogin(email);
            }
          }}
        />
      )}
    </Modal>
  );
};
