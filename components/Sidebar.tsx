
import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Wallet, 
  Aperture, 
  Settings, 
  LogOut,
  Layers,
  Box,
  Users,
  Briefcase,
  BarChart2,
  Grid,
  Sun,
  Moon
} from 'lucide-react';
import { SidebarProps } from '../types'; // Updated import
import { motion } from 'framer-motion';

const Motion = motion as any;

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onNavigate, currentView, onLogout, onSwitchApp, isDarkMode, onToggleTheme, bookings }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'PHOTOGRAPHER', 'EDITOR', 'FINANCE'] },
    { id: 'calendar', label: 'Schedule', icon: CalendarDays, roles: ['OWNER', 'ADMIN', 'PHOTOGRAPHER'] },
    { id: 'production', label: 'Production', icon: Layers, roles: ['OWNER', 'ADMIN', 'EDITOR', 'PHOTOGRAPHER'] },
    { id: 'inventory', label: 'Inventory', icon: Box, roles: ['OWNER', 'ADMIN', 'PHOTOGRAPHER'] },
    { id: 'clients', label: 'Clients', icon: Users, roles: ['OWNER', 'ADMIN', 'FINANCE'] },
    { id: 'team', label: 'Team & HR', icon: Briefcase, roles: ['OWNER', 'ADMIN', 'FINANCE'] },
    { id: 'finance', label: 'Finance', icon: Wallet, roles: ['OWNER', 'FINANCE'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, roles: ['OWNER', 'ADMIN'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentUser.role));

  // Calculate Badges
  const getBadgeCount = (viewId: string) => {
      if (!bookings) return 0;
      
      if (viewId === 'production' || viewId === 'dashboard') {
          // Photographers see badge if they have 'SHOOTING' tasks
          if (currentUser.role === 'PHOTOGRAPHER') {
              return bookings.filter(b => b.photographerId === currentUser.id && b.status === 'SHOOTING').length;
          }
          // Editors see badge if they have 'EDITING' tasks
          if (currentUser.role === 'EDITOR') {
              return bookings.filter(b => b.editorId === currentUser.id && b.status === 'EDITING').length;
          }
          // Admins/Owners see badge for 'REVIEW' tasks
          if (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') {
              return bookings.filter(b => b.status === 'REVIEW').length;
          }
      }
      return 0;
  };

  return (
    <Motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex w-64 h-screen bg-lumina-surface/80 backdrop-blur-xl border-r border-lumina-highlight flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300"
    >
      <div>
        {/* Header with App Switcher */}
        <div className="h-24 flex items-center justify-between px-6 border-b border-lumina-highlight/50">
          <div className="flex items-center">
              <Aperture className="text-lumina-accent w-8 h-8 animate-spin-slow shrink-0" />
              <span className="ml-3 font-display font-bold text-xl tracking-tight text-lumina-text">
                LUMINA
              </span>
          </div>
          {/* App Switcher Button */}
          <button 
            onClick={onSwitchApp}
            title="Switch App"
            className="flex p-2 rounded-lg text-lumina-muted hover:text-lumina-text hover:bg-lumina-highlight/50 transition-colors"
          >
              <Grid size={20} />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          {filteredMenu.map((item) => {
            const badgeCount = getBadgeCount(item.id);
            
            return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${currentView === item.id 
                  ? 'bg-lumina-highlight text-lumina-accent shadow-lg shadow-lumina-accent/5' 
                  : 'text-lumina-muted hover:text-lumina-text hover:bg-lumina-highlight/30'
                }`}
            >
              <div className="relative">
                  <item.icon className={`w-5 h-5 ${currentView === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {badgeCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 border-2 border-lumina-surface">
                          {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                  )}
              </div>
              <span className="ml-3 font-medium tracking-wide text-sm">{item.label}</span>
              {currentView === item.id && (
                <Motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-lumina-accent rounded-r-full" 
                />
              )}
            </button>
          )})}
        </nav>
      </div>

      <div className="p-4 border-t border-lumina-highlight/50 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-start p-2 rounded-xl bg-lumina-base border border-lumina-highlight hover:border-lumina-accent/50 transition-colors group"
        >
           <div className={`p-1 rounded-lg ${isDarkMode ? 'text-yellow-400' : 'text-lumina-muted'}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
           </div>
           <span className="ml-2 text-xs font-bold text-lumina-muted group-hover:text-lumina-text transition-colors">
             {isDarkMode ? 'Light Mode' : 'Dark Mode'}
           </span>
        </button>

        {/* Profile */}
        <div className="flex items-center justify-start p-2 rounded-xl bg-lumina-base border border-lumina-highlight">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-8 h-8 rounded-full border border-lumina-accent/30"
          />
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-bold text-lumina-text truncate">{currentUser.name}</p>
            <p className="text-xs text-lumina-muted font-mono uppercase tracking-wider">{currentUser.role}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-start p-2 text-lumina-muted hover:text-lumina-danger transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-2 text-xs font-semibold uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </Motion.aside>
  );
};

export default Sidebar;
