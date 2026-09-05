import React, { useState } from "react";
import { AuthHero } from "../components/auth/AuthHero";
import { AuthForm } from "../components/auth/AuthForm";

export const AuthPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0A0D17] font-sans antialiased">
      <AuthHero showForm={showForm} onShowForm={() => setShowForm(true)} />
      <AuthForm showForm={showForm} onHideForm={() => setShowForm(false)} />
    </div>
  );
};
