import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (err: any) {
      setError(err.message || "Gagal melakukan autentikasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setName("Zalde Developer");
    setEmail("demo@zalde.dev");
    setPassword("password123");
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Form Card with Brand Header inside */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl bg-white/90">
          {/* Brand Header with Mac Dots */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 shadow-sm mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f5bd4f]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#61c554]" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
                Todolist-App
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Smart Productivity Suite
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                !isRegister
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isRegister
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4 animate-in fade-in duration-200 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input
                label="Nama Lengkap"
                placeholder="Misal: Zalde Developer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
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
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isRegister ? "Buat Akun Sekarang" : "Masuk ke Workspace"}
            </Button>
          </form>

          {/* Quick Demo Autofill Button */}
          <div className="mt-6 pt-5 border-t border-slate-200/90 text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center text-xs text-slate-700 hover:text-slate-900 font-bold py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-sm"
            >
              Login Cepat
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-medium">
          Smart Productivity Suite
        </p>
      </div>
    </div>
  );
};
