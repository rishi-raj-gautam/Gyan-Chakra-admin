import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  LayoutDashboard,
  HelpCircle,
  Trophy,
  Users,
  Award,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  TrendingUp,
  History,
  Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Daily Quiz', href: '/daily-quiz', icon: Trophy },
    { name: 'Mega Challenge', href: '/mega-challenge', icon: Trophy },
    { name: 'Question Bank', href: '/question-bank', icon: HelpCircle },
    { name: 'User Management', href: '/users', icon: Users },
    { name: 'Winner Approvals', href: '/winners', icon: Award },
    { name: 'Rewards Distribution', href: '/rewards', icon: Coins },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'App Settings', href: '/settings', icon: SettingsIcon },
    { name: 'Analytics Reports', href: '/analytics', icon: TrendingUp },
    { name: 'System Audit Logs', href: '/audit-logs', icon: History },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/login');
    } catch {
      showToast('Logout failed', 'error');
    }
  };

  const getPageTitle = () => {
    const active = navigation.find((n) => n.href === location.pathname);
    return active ? active.name : 'Dashboard';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background-card border-r border-gold/10">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl gold-gradient-bg flex items-center justify-center shadow-lg shadow-gold/20">
          <span className="font-extrabold text-background text-base">GC</span>
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-white text-md tracking-wider leading-none">Gyaan Chakra</span>
          <span className="text-xxs text-gold font-bold tracking-widest uppercase mt-0.5">Admin Portal</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'bg-gold/10 text-gold border-l-2 border-gold font-bold'
                  : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-text-muted'}`} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5 bg-background/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold text-sm shadow-inner uppercase">
          {user?.name?.slice(0, 2) || 'AD'}
        </div>
        <div className="flex-grow min-w-0">
          <div className="text-sm font-bold text-white truncate">{user?.name}</div>
          <div className="text-xxs text-gold font-bold tracking-wider uppercase mt-0.5">{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-rose-400 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-full">{sidebarContent}</div>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Sidebar content panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="relative w-64 max-w-xs h-full z-10"
            >
              {sidebarContent}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 -right-12 p-2 bg-background-card border border-gold/15 text-gold rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-background-card border-b border-gold/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 lg:hidden bg-background hover:bg-white/5 border border-gold/10 hover:border-gold/30 rounded-xl text-gold cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold tracking-wide text-white">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-semibold text-text-muted">Welcome, {user?.name}</span>
              <span className="text-xxs text-gold font-bold tracking-widest uppercase">{user?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold text-xs uppercase shadow-inner">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#050B16]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
