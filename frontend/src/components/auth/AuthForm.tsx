import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { AlertCircle, ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff, User, ArrowRight } from "lucide-react";

interface AuthFormProps {
  showForm: boolean;
  onHideForm: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ showForm, onHideForm }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal melakukan autentikasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section 
      className={`absolute top-0 right-0 h-full w-full lg:w-[55%] xl:w-[54%] flex flex-col justify-between px-6 py-4 sm:px-10 sm:py-6 lg:px-14 lg:py-8 overflow-y-auto bg-gradient-to-b from-[#F8FAFC] to-[#EFF2F6] z-30 shadow-[-30px_0_60px_rgba(0,0,0,0.15)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        showForm ? "translate-x-0" : "translate-x-full"
      }`}
      style={{
        background: "radial-gradient(circle at 85% 15%, rgba(226, 214, 238, 0.65) 0%, rgba(241, 244, 250, 0.92) 45%, rgba(220, 226, 236, 0.85) 100%), linear-gradient(135deg, rgb(245, 243, 248) 0%, rgb(234, 239, 246) 100%)"
      }}
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
        <div className="text-xs font-medium text-slate-500">
          Butuh bantuan? <a className="text-indigo-600 hover:underline font-semibold" href="#">Hubungi Dukungan</a>
        </div>
      </nav>

      {/* Center Auth Box Container */}
      <div className="w-full max-w-[430px] mx-auto my-auto py-2">
        


        {/* Auth Card */}
        <div 
          className="bg-white rounded-3xl p-5 sm:px-8 sm:py-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/80 shadow-2xl" 
          style={{
            background: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            boxShadow: "rgba(15, 23, 42, 0.15) 0px 25px 50px -12px, rgba(99, 102, 241, 0.08) 0px 12px 24px -8px, rgba(226, 232, 240, 0.8) 0px 0px 0px 1px"
          }}
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
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="ml-2 font-medium">Ingat saya</span>
              </label>
              <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-800 transition">Lupa kata sandi?</a>
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
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  setIsLoading(true);
                  setError(null);
                  if (credentialResponse.credential) {
                    await loginWithGoogle(credentialResponse.credential);
                  }
                } catch (err: any) {
                  setError(err.message || "Gagal login dengan Google");
                } finally {
                  setIsLoading(false);
                }
              }}
              onError={() => {
                setError("Login Google dibatalkan atau gagal");
              }}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
              width="100%"
            />
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
    </section>
  );
};
