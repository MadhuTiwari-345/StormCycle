import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from './components/shared/BrandLogo';
import StormLoader from './components/shared/StormLoader';

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
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("[v0] Auth state changed:", u?.email || 'no user');
      setUser(u);
      setLoading(false);
      // Hide splash after 1.5 seconds
      setTimeout(() => {
        console.log("[v0] Hiding splash screen");
        setShowSplash(false);
      }, 1500);
    }, (error) => {
      console.error("[v0] Auth error:", error);
      setLoading(false);
      setTimeout(() => setShowSplash(false), 1500);
    });
    return () => unsubscribe();
  }, []);

  // Force hide splash after 3 seconds max
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("[v0] Force hiding splash after timeout");
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <StormLoader isFullPage key="splash" />
      ) : (
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
      )}
    </AnimatePresence>
  );
}
