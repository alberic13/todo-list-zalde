import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

// ponytail: single auth flow hook. upgrade to xstate machine if multi-factor or webauthn added.
export const useAuthForm = () => {
  const { login, register, loginWithGoogle, setAuthSession } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyDevCode, setVerifyDevCode] = useState<string | undefined>(undefined);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset_token") || params.get("token");
    if (!token) return;

    setResetTokenFromUrl(token);
    setShowForgotModal(true);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleTabChange = (isReg: boolean) => {
    setIsRegister(isReg);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error("Nama lengkap wajib diisi");
        const res = await register(name.trim(), email.trim(), password, rememberMe);
        if (res.needVerification) {
          setVerifyEmail(email.trim());
          setVerifyDevCode(res.devCode);
          setShowVerifyModal(true);
        }
        return;
      }

      await login(email.trim(), password, rememberMe);
    } catch (err: any) {
      const isUnverified =
        err.data?.needVerification ||
        err.message?.includes("belum aktif") ||
        err.message?.includes("belum diverifikasi");

      if (isUnverified) {
        setVerifyEmail(email.trim());
        setShowVerifyModal(true);
        return;
      }

      setError(err instanceof Error ? err.message : "Gagal melakukan autentikasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle(accessToken, rememberMe);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (msg: string) => {
    setError(msg);
  };

  const handleForgotSuccess = (resetEmail: string) => {
    setEmail(resetEmail);
    setIsRegister(false);
    setShowForgotModal(false);
  };

  const handleVerifySuccess = (authData: any) => {
    setAuthSession(authData, rememberMe);
    setShowVerifyModal(false);
  };

  return {
    isRegister,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    isLoading,
    showPassword,
    setShowPassword,
    showForgotModal,
    setShowForgotModal,
    showVerifyModal,
    setShowVerifyModal,
    verifyEmail,
    verifyDevCode,
    rememberMe,
    setRememberMe,
    resetTokenFromUrl,
    handleTabChange,
    handleSubmit,
    handleGoogleSuccess,
    handleGoogleError,
    handleForgotSuccess,
    handleVerifySuccess,
  };
};
