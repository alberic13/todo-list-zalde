import { useState, useEffect, useRef } from "react";
import { authService, AuthResponse } from "../../services/authService";

export interface UseVerifyEmailOptions {
  isOpen: boolean;
  email: string;
  initialDevCode?: string;
  onSuccess: (authData: AuthResponse) => void;
}

export function useVerifyEmail({
  isOpen,
  email,
  initialDevCode,
  onSuccess,
}: UseVerifyEmailOptions) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(initialDevCode || null);
  const [cooldown, setCooldown] = useState(60);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setError(null);
      setMessage("Kode verifikasi 6-digit telah dikirim ke email Anda.");
      setCooldown(60);
      if (initialDevCode) {
        setDevCode(initialDevCode);
        setCode(initialDevCode);
      } else {
        setCode("");
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, initialDevCode]);

  // Countdown timer 60s
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError("Masukkan 6-digit kode verifikasi");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.verifyEmail(email, cleanCode);
      setIsSuccess(true);
      setMessage("Selamat! Akun Anda telah aktif.");
      setTimeout(() => {
        onSuccess(res);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Kode verifikasi tidak valid atau telah kedaluwarsa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await authService.resendVerification(email);
      setMessage(res.message || "Kode verifikasi baru berhasil dikirim.");
      if (res.devCode) {
        setDevCode(res.devCode);
        setCode(res.devCode);
      }
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim ulang kode. Silakan coba lagi.");
    } finally {
      setIsResending(false);
    }
  };

  return {
    code,
    setCode,
    isLoading,
    isResending,
    error,
    setError,
    message,
    devCode,
    cooldown,
    isSuccess,
    inputRef,
    handleVerify,
    handleResend,
  };
}
