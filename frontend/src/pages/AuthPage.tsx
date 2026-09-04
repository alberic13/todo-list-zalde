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
    <div className="min-h-screen flex items-stretch relative overflow-hidden">
      {/* ─── LEFT: Decorative Brand Panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 auth-gradient-mesh" />
        {/* Grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        {/* Top: Brand mark */}
        <div className="relative z-10 auth-slide-left auth-slide-left-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white/70 text-xs font-medium ml-1 tracking-wide">Todolist-App</span>
          </div>
        </div>

        {/* Center: Hero text */}
        <div className="relative z-10 space-y-6 max-w-md auth-slide-left auth-slide-left-2">
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
            Organisasi tugas
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 auth-gradient-shimmer">lebih cerdas.</span>
          </h2>
          <p className="text-white/55 text-sm leading-relaxed max-w-sm">
            task management dengan semantic search, Drag and Drop, dan asisten AI -produktivitas kontekstual.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {["AI integrated", "Semantic Search"].map((text) => (
              <div key={text} className="inline-flex items-center text-[11px] font-medium text-white/60 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 auth-pill-glow">
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Subtle decorative orbs */}
        <div className="relative z-10 auth-slide-left auth-slide-left-3">
          <p className="text-white/25 text-[11px] font-medium tracking-wider uppercase">
            © 2026 Zalde Productivity Suite
          </p>
        </div>

        {/* Floating orbs */}
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl auth-float-slow" />
        <div className="absolute -top-10 -left-10 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl auth-float-slower" />
        <div className="absolute top-1/2 right-10 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl auth-float-reverse" />
      </div>

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        {/* Subtle background for right panel on large screens */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/60 lg:bg-white/95" />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/5 border border-slate-200/60 mb-3">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Todolist-App
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Smart Productivity Suite
            </p>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:block mb-8 auth-stagger auth-stagger-1">
            <p className="text-sm font-medium text-slate-400 mb-1">
              {isRegister ? "Mulai perjalananmu" : "Selamat datang kembali"}
            </p>
            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-snug">
              {isRegister ? "Buat akun baru" : "Masuk ke akun"}
            </h1>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl lg:rounded-3xl bg-white/80 lg:bg-white/60 backdrop-blur-xl border border-slate-200/70 lg:border-slate-200/50 shadow-xl shadow-slate-900/[0.04] p-6 sm:p-7 auth-card-enter">

            {/* Tab Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 mb-6 auth-stagger auth-stagger-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  !isRegister
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.04]"
                    : "text-slate-500 hover:text-slate-700"
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
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  isRegister
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.04]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 auth-stagger auth-stagger-3">
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
                className="w-full mt-3 rounded-xl py-3 text-sm font-bold tracking-wide shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 transition-shadow duration-300"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isRegister ? "Buat Akun Sekarang" : "Masuk ke Workspace"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6 auth-stagger auth-stagger-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  atau
                </span>
              </div>
            </div>

            {/* Quick Demo Button */}
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full inline-flex items-center justify-center gap-2 text-xs text-slate-600 hover:text-slate-900 font-semibold py-2.5 px-4 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300/80 transition-all duration-200 auth-stagger auth-stagger-6"
            >
              Login Cepat dengan Akun Demo
            </button>
          </div>

          {/* Bottom subtle text */}
          <p className="text-center text-[11px] text-slate-400 mt-6 font-medium auth-stagger auth-stagger-7">
            Dilindungi enkripsi end-to-end & JWT Auth
          </p>
        </div>
      </div>
    </div>
  );
};
