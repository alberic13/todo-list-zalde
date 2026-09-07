import { useState, useEffect } from "react";
import { authService } from "../../../services/authService";

export interface UseForgotPasswordOptions {
  initialEmail?: string;
  initialToken?: string;
  onClose: () => void;
}

export function useForgotPassword({
  initialEmail = "",
  initialToken = "",
  onClose,
}: UseForgotPasswordOptions) {
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto set if initialToken is provided (e.g. from email URL link)
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setStep("reset");
    }
  }, [initialToken]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleResetModalState = () => {
    setStep(initialToken ? "reset" : "request");
    setError(null);
    setMessage(null);
    setWarning(null);
    setDevCode(null);
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  // Step 1: Request Reset Code
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Silakan masukkan alamat email yang terdaftar.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);
    setWarning(null);

    try {
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message || "Kode verifikasi telah dikirim ke email Anda.");
      if (res.warning) {
        setWarning(res.warning);
      }
      if (res.devCode) {
        setDevCode(res.devCode);
        setToken(res.devCode);
      } else {
        setDevCode(null);
        setToken("");
      }
      setStep("reset");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Gagal memproses permintaan reset kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code and Update Password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Silakan masukkan kode verifikasi 6 digit.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token.trim(), newPassword);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Kode verifikasi tidak valid atau telah kedaluwarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
