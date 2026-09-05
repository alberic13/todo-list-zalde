import React from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";

const Dashboard = React.lazy(() => 
  import("./pages/Dashboard").then(module => ({ default: module.Dashboard }))
);
import { Loader2, CheckSquare } from "lucide-react";

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/40 animate-pulse mb-4">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Memuat sesi workspace...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Memuat workspace...</span>
        </div>
      </div>
    }>
      <Dashboard />
    </React.Suspense>
  ) : <AuthPage />;
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
