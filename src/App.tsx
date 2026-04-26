import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';

// Pages
import LandingPage from './pages/marketing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import CycleTracker from './pages/dashboard/CycleTracker';
import PCODScreener from './pages/dashboard/PCODScreener';
import Chatbot from './pages/dashboard/Chatbot';
import Reports from './pages/dashboard/Reports';
import Settings from './pages/dashboard/Settings';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[v0] App: Initializing auth");
    try {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        console.log("[v0] Auth state changed:", u?.email || 'no user');
        setUser(u);
        setLoading(false);
      }, (err) => {
        console.error("[v0] Auth error:", err);
        setError(err.message);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err: any) {
      console.error("[v0] App initialization error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading App</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route index element={<DashboardHome />} />
          <Route path="cycle" element={<CycleTracker />} />
          <Route path="pcod" element={<PCODScreener />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
