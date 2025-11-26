
import React from 'react';
import { LayoutDashboard, CalendarDays, Layers, Wallet, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProps } from '../types';

interface MobileNavProps extends SidebarProps {
  // Inherits props like onNavigate, currentView, etc.
}

const MobileNav: React.FC<MobileNavProps> = ({ onNavigate, currentView, bookings, currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: 'Schedule', icon: CalendarDays },
    { id: 'production', label: 'Prod', icon: Layers },
    { id: 'finance', label: 'Finance', icon: Wallet },
  ];

  const menuItems = [
    { id: 'inventory', label: 'Inventory' },
    { id: 'clients', label: 'Clients' },
    { id: 'team', label: 'Team' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleNav = (view: string) => {
    onNavigate(view);
    setIsMenuOpen(false);
  }

  return (
    <>
      {/* Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-lumina-surface/95 backdrop-blur-xl border-t border-lumina-highlight z-[40] pb-safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-lumina-accent' : 'text-lumina-muted'}`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && <motion.div layoutId="mobileNavIndicator" className="absolute bottom-0 w-8 h-1 bg-lumina-accent rounded-t-full" />}
              </button>
            )
          })}
          
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isMenuOpen ? 'text-lumina-text' : 'text-lumina-muted'}`}
          >
            <Menu size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Full Screen More Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-[50] bg-lumina-base flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-lumina-highlight">
              <h2 className="text-xl font-bold text-white font-display">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-lumina-surface rounded-full text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
               <div className="flex items-center gap-4 p-4 bg-lumina-surface rounded-xl border border-lumina-highlight mb-6">
                  <img src={currentUser.avatar} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-bold text-white">{currentUser.name}</p>
                    <p className="text-xs text-lumina-muted uppercase">{currentUser.role}</p>
                  </div>
               </div>

               <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-wider mb-2 px-2">Apps</h3>
               {menuItems.map(item => (
                 <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className="w-full text-left p-4 bg-lumina-surface border border-lumina-highlight rounded-xl text-white font-bold active:scale-95 transition-transform"
                 >
                   {item.label}
                 </button>
               ))}

               <button onClick={onLogout} className="w-full text-left p-4 text-rose-500 font-bold mt-8">
                 Log Out
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
