import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { BrandDots } from "../ui/BrandDots";

interface AuthFormProps {
  showForm: boolean;
  onHideForm: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ showForm, onHideForm }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDemoFill = () => {
    setName("Zalde Demo User");
    setEmail("demo@zalde.com");
    setPassword("Password123!");
    setIsRegister(false);
  };

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-full lg:w-[55%] xl:w-[52%] flex items-center justify-center bg-white z-30 shadow-[-30px_0_60px_rgba(0,0,0,0.15)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        showForm ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Subtle background for right panel */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/60" />

      {/* Back button */}
      <button 
        onClick={onHideForm}
        className={`absolute top-6 left-6 lg:top-8 lg:left-8 inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all z-40 font-medium text-sm group duration-500 delay-300 ${showForm ? "opacity-100" : "opacity-0 -translate-x-4 pointer-events-none"}`}
      >
        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
        <span>Kembali</span>
      </button>

      <div className={`w-full max-w-[400px] relative z-10 p-6 sm:p-8 transition-all duration-[800ms] delay-100 ${showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        
        {/* Mobile-only brand header */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-900/5 border border-slate-200/60 mb-3">
            <BrandDots className="gap-1.5" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Todolist-App
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Smart Productivity Suite
          </p>
        </div>

        {/* Desktop greeting */}
        <div className="hidden lg:block mb-8">
          <p className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">
            {isRegister ? "Mulai perjalananmu" : "Selamat datang kembali"}
          </p>
          <h1 className="text-[32px] font-black tracking-tight text-slate-900 leading-snug">
            {isRegister ? "Buat akun baru" : "Masuk ke akun"}
          </h1>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">

          {/* Tab Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-100/70 border border-slate-200/50 mb-7">
            {[
              { id: "login", label: "Masuk", isReg: false },
              { id: "register", label: "Daftar Baru", isReg: true },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.isReg)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 relative ${
                  isRegister === tab.isReg
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/60 text-rose-700 text-xs flex items-center gap-2.5 mb-5 font-medium auth-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <Input
                  label="Nama Lengkap"
                  placeholder="Misal: Zalde Developer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
              </div>
            )}

            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2 rounded-xl py-3 text-sm font-bold tracking-wide shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 transition-shadow duration-300"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isRegister ? "Buat Akun Sekarang" : "Masuk ke Workspace"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                atau
              </span>
            </div>
          </div>

          {/* Quick Demo Button */}
          <button
            type="button"
            onClick={handleDemoFill}
            className="w-full inline-flex items-center justify-center gap-2 text-xs text-slate-700 hover:text-slate-900 font-bold py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors"
          >
            Login Cepat dengan Akun Demo
          </button>
        </div>

        {/* Bottom subtle text */}
        <p className="text-center text-[11px] text-slate-400 mt-8 font-bold tracking-wider uppercase">
          Dilindungi enkripsi end-to-end & JWT Auth
        </p>
      </div>
    </div>
  );
};
