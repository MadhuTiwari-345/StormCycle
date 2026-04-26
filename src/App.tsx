import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';

// Lazy load pages to catch import errors
let LandingPage: any;
let LoginPage: any;
let SignupPage: any;
let DashboardLayout: any;
let DashboardHome: any;
let CycleTracker: any;
let PCODScreener: any;
let Chatbot: any;
let Reports: any;
let Settings: any;

try {
  LandingPage = require('./pages/marketing/LandingPage').default;
  LoginPage = require('./pages/auth/LoginPage').default;
  SignupPage = require('./pages/auth/SignupPage').default;
  DashboardLayout = require('./pages/dashboard/DashboardLayout').default;
  DashboardHome = require('./pages/dashboard/DashboardHome').default;
  CycleTracker = require('./pages/dashboard/CycleTracker').default;
  PCODScreener = require('./pages/dashboard/PCODScreener').default;
  Chatbot = require('./pages/dashboard/Chatbot').default;
  Reports = require('./pages/dashboard/Reports').default;
  Settings = require('./pages/dashboard/Settings').default;
  console.log("[v0] All pages loaded successfully");
} catch (err: any) {
  console.error("[v0] Error loading pages:", err);
}

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
      }, (err: any) => {
        console.error("[v0] Auth error:", err.code, err.message);
        setError(`Auth Error: ${err.message}`);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err: any) {
      console.error("[v0] App initialization error:", err);
      setError(`Init Error: ${err.message}`);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fee',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '8px',
          maxWidth: '500px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#c33', marginBottom: '15px' }}>Error</h1>
          <p style={{ color: '#666', marginBottom: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#c33',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!LandingPage) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p style={{ color: '#999' }}>Loading pages...</p>
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
