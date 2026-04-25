import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  ShieldAlert, 
  MessageSquare, 
  FileBox, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import Logo from '../../components/layout/Logo';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/dashboard/cycle', icon: Calendar, label: 'Cycle Tracker' },
  { path: '/dashboard/pcod', icon: ShieldAlert, label: 'PCOD Screener' },
  { path: '/dashboard/chatbot', icon: MessageSquare, label: 'AI Chatbot' },
  { path: '/dashboard/reports', icon: FileBox, label: 'Reports' },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

// Mock notifications
const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Cycle approaching', message: 'Your next cycle is predicted to start in 3 days.', time: '2 hours ago', read: false },
  { id: 2, title: 'Report ready', message: 'Your monthly wellness report is generated.', time: '1 day ago', read: true },
];

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationsDropdown = () => (
    <AnimatePresence>
      {showNotifications && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute right-0 top-[calc(100%+20px)] w-72 bg-white rounded-2xl shadow-xl border border-storm-border z-[1000] overflow-hidden"
        >
          <div className="p-4 border-b border-storm-border flex justify-between items-center bg-storm-cream/30">
            <h3 className="font-serif font-bold text-storm-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-storm-primary hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-storm-muted">No notifications</div>
            ) : (
              <div className="divide-y divide-storm-border">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 transition-colors hover:bg-storm-blush ${!n.read ? 'bg-storm-cream/20' : ''}`}>
                    <div className="flex justify-between gap-2">
                      <p className={`text-sm ${!n.read ? 'font-bold text-storm-primary' : 'font-medium text-storm-primary/80'}`}>{n.title}</p>
                      {!n.read && <div className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-storm-muted mt-1">{n.message}</p>
                    <p className="text-[10px] text-storm-muted/70 mt-2">{n.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-storm-cream flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-storm-border flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center justify-between">
          <Logo size={36} />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                ${isActive ? 'bg-storm-primary text-white shadow-md' : 'text-storm-muted hover:bg-storm-blush hover:text-storm-primary'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-storm-border space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-storm-muted hover:bg-red-50 hover:text-red-600 transition-all font-medium"
          >
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-storm-border p-4 flex items-center justify-between sticky top-0 z-50">
        <Logo size={32} />
        <div className="flex items-center gap-3">
          <div className="relative flex items-center" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-storm-primary relative p-1"
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border border-white rounded-full" />
              )}
            </button>
            {showNotifications && <NotificationsDropdown />}
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} className="text-storm-primary" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-3/4 bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-serif font-bold text-storm-primary">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
              </div>
              <nav className="space-y-4">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-4 p-4 rounded-2xl
                      ${isActive ? 'bg-storm-primary text-white' : 'text-storm-muted bg-storm-cream'}
                    `}
                  >
                    <item.icon size={24} />
                    <span className="text-lg font-medium">{item.label}</span>
                  </NavLink>
                ))}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-600 bg-red-50"
                >
                  <LogOut size={24} />
                  <span className="text-lg font-medium">Log out</span>
                </button>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-end items-center p-4 lg:px-8 border-b border-storm-border bg-white/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-storm-primary relative p-2 bg-white rounded-full shadow-sm border border-storm-border hover:bg-storm-cream transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border border-white rounded-full" />
                )}
              </button>
              {showNotifications && <NotificationsDropdown />}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-storm-border flex items-center justify-around p-2 pb-6 z-40">
        {navItems.slice(0, 4).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 p-2 rounded-xl transition-all
              ${isActive ? 'text-storm-primary' : 'text-storm-muted'}
            `}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
