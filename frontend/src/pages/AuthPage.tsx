import React, { useState } from "react";
import { AuthHero } from "../components/auth/AuthHero";
import { AuthForm } from "../components/auth/AuthForm";

export const AuthPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-900">
      
      {/* ─── LEFT: Background & Effects (Static Size for Performance) ─── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 auth-gradient-mesh opacity-90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
        
        {/* Floating orbs */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl auth-float-slow will-change-transform" />
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl auth-float-slower will-change-transform" />
        <div className="absolute top-1/2 right-10 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl auth-float-reverse will-change-transform" />
      </div>

      {/* Extracted Components */}
      <AuthHero showForm={showForm} onShowForm={() => setShowForm(true)} />
      <AuthForm showForm={showForm} onHideForm={() => setShowForm(false)} />

    </div>
  );
};

