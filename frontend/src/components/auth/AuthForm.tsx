import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";
import { AlertCircle, ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff, User, ArrowRight } from "lucide-react";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { VerifyEmailModal } from "./VerifyEmailModal";

interface AuthFormProps {
  showForm: boolean;
  onHideForm: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ showForm, onHideForm }) => {
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

  // Detect ?reset_token= parameter from email 1-click link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset_token") || params.get("token");
    if (token) {
      setResetTokenFromUrl(token);
      setShowForgotModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
      } else {
        await login(email.trim(), password, rememberMe);
      }
    } catch (err: any) {
      // Jika login ditolak karena akun belum diverifikasi
      if (
        err.data?.needVerification ||
        err.message?.includes("belum aktif") ||
        err.message?.includes("belum diverifikasi")
      ) {
        setVerifyEmail(email.trim());
        setShowVerifyModal(true);
      } else {
        setError(err instanceof Error ? err.message : "Gagal melakukan autentikasi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError(null);
        await loginWithGoogle(tokenResponse.access_token, rememberMe);
      } catch (err: any) {
        setError(err.message || "Gagal login dengan Google");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Login Google dibatalkan atau gagal");
    },
  });

  return (
    <section 
      className={`absolute top-0 right-0 h-full w-full lg:w-[55%] xl:w-[54%] flex flex-col justify-between px-6 py-4 sm:px-10 sm:py-6 lg:px-14 lg:py-8 overflow-y-auto bg-[radial-gradient(circle_at_85%_15%,rgba(226,214,238,0.65)_0%,rgba(241,244,250,0.92)_45%,rgba(220,226,236,0.85)_100%),linear-gradient(135deg,rgb(245,243,248)_0%,rgb(234,239,246)_100%)] z-30 shadow-[-30px_0_60px_rgba(0,0,0,0.15)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        showForm ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Top Return Bar */}
      <nav aria-label="Navigasi Autentikasi" className="flex items-center justify-between w-full max-w-md mx-auto">
        <button 
          onClick={onHideForm}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition group py-1"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </button>
      </nav>

      {/* Center Auth Box Container */}
      <div className="w-full max-w-[430px] mx-auto my-auto py-2">
        


        {/* Auth Card */}
        <div 
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:px-8 sm:py-6 border border-white/90 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.15),0_12px_24px_-8px_rgba(99,102,241,0.08),0_0_0_1px_rgba(226,232,240,0.8)]" 
        >
          {/* Tab Segment Switcher */}
          <div aria-label="Mode Masuk" className="p-1 bg-slate-100/90 rounded-2xl flex items-center mb-4 border border-slate-200/50" role="tablist">
            <button 
              aria-selected={!isRegister} 
              onClick={() => handleTabChange(false)}
              className={`flex-1 py-2 rounded-xl text-xs transition-all ${!isRegister ? 'font-bold text-white bg-[#0F172A] shadow-md' : 'font-semibold text-slate-500 hover:text-slate-800'}`}
              role="tab" 
              type="button"
            >
              Masuk
            </button>
            <button 
              aria-selected={isRegister} 
              onClick={() => handleTabChange(true)}
              className={`flex-1 py-2 rounded-xl text-xs transition-all ${isRegister ? 'font-bold text-white bg-[#0F172A] shadow-md' : 'font-semibold text-slate-500 hover:text-slate-800'}`}
              role="tab" 
              type="button"
            >
              Daftar Baru
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-700 text-xs flex items-center gap-2.5 mb-5 font-medium auth-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign-In Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Nama Input Field (Register Only) */}
            {isRegister && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="name">Nama</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input 
                    id="name" 
                    name="name" 
                    type="text"
                    required 
                    placeholder="input nama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition duration-150 ease-in-out" 
                  />
                </div>
              </div>
            )}

            {/* Email Input Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">Alamat Email</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required
                  placeholder="nama@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition duration-150 ease-in-out" 
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="password">Kata Sandi</label>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition duration-150 ease-in-out" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3.5 flex items-center focus:outline-none ${showPassword ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Lihat password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Utilities: Remember & Forgot */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center select-none text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 font-medium">Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-lg shadow-slate-900/15 hover:shadow-slate-900/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Memproses..." : (isRegister ? "Buat Akun" : "Masuk ke Workspace")}</span>
              {!isLoading && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[11px]">atau</span>
            </div>
          </div>

          {/* Single Google SSO Button */}
          <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Login Google Account</span>
            </button>
          </div>
          
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="">Dilindungi Enkripsi End-to-End & JWT Auth</span>
        </div>
      </div>

      {/* Mobile Friendly Bottom Notice */}
      <div className="text-center text-xs text-slate-400 lg:hidden pt-4">
        © 2026 Zalde Productivity Suite. Seluruh hak cipta dilindungi.
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
        initialToken={resetTokenFromUrl}
        onSuccessLogin={(resetEmail) => {
          setEmail(resetEmail);
          setIsRegister(false);
          setShowForgotModal(false);
        }}
      />

      {/* Verify Email OTP Modal */}
      <VerifyEmailModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        email={verifyEmail}
        initialDevCode={verifyDevCode}
        onSuccess={(authData) => {
          setAuthSession(authData, rememberMe);
          setShowVerifyModal(false);
        }}
      />
    </section>
  );
};
