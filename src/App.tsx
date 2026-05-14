import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Today from './pages/Today/index';
import Week from './pages/Week/index';
import Food from './pages/Food/index';
import Feed from './pages/Feed/index';
import Settings from './pages/Settings/index';
import TodayLayoutEditor from './pages/Settings/TodayLayoutEditor';
import SyncSettings from './pages/Settings/SyncSettings';

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent)' }}
        >
          <svg viewBox="0 0 120 120" width="28" height="28" fill="white">
            <rect x="14" y="30" width="8" height="40" rx="2" />
            <rect x="26" y="24" width="12" height="52" rx="3" />
            <rect x="98" y="30" width="8" height="40" rx="2" />
            <rect x="82" y="24" width="12" height="52" rx="3" />
            <rect x="38" y="46" width="44" height="8" rx="2" />
            <rect x="14" y="92" width="92" height="6" rx="3" opacity="0.5" />
            <rect x="36" y="92" width="48" height="6" rx="3" />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Routes>
        <Route path="/today" element={<Today />} />
        <Route path="/week" element={<Week />} />
        <Route path="/food" element={<Food />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/today" element={<TodayLayoutEditor />} />
        <Route path="/settings/sync" element={<SyncSettings />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/today" replace />;
  return <>{children}</>;
}
