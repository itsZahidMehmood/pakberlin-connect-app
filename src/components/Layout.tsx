import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, User, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'Global' },
    { icon: Heart, path: '/requests', label: 'Likes' },
    { icon: MessageCircle, path: '/chats', label: 'Chats' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-bottom border-gray-100 z-50 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">PakBerlin</span>
        </Link>
        
        <button 
          onClick={() => auth.signOut()}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 mt-16 mb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 px-8 flex items-center justify-around z-50 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 group",
                isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all",
                isActive ? "bg-green-50" : "group-hover:bg-gray-50"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
