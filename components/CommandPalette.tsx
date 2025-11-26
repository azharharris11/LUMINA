
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, User, Box, ArrowRight, Hash, X, Lock } from 'lucide-react';
import { Booking, Client, Asset, User as UserType, Role } from '../types';

const Motion = motion as any;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  clients: Client[];
  bookings: Booking[];
  assets: Asset[];
  onSelectBooking: (id: string) => void;
  currentUser: UserType;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, clients, bookings, assets, onSelectBooking, currentUser }) => {
  const [query, setQuery] = useState('');

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose(); else { /* Opened by parent */ }
      }
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // RBAC Logic
  const MENU_PERMISSIONS: Record<string, Role[]> = {
      'dashboard': ['OWNER', 'ADMIN', 'PHOTOGRAPHER', 'EDITOR', 'FINANCE'],
      'calendar': ['OWNER', 'ADMIN', 'PHOTOGRAPHER'],
      'production': ['OWNER', 'ADMIN', 'EDITOR', 'PHOTOGRAPHER'],
      'inventory': ['OWNER', 'ADMIN', 'PHOTOGRAPHER'],
      'clients': ['OWNER', 'ADMIN', 'FINANCE'],
      'team': ['OWNER', 'ADMIN', 'FINANCE'],
      'finance': ['OWNER', 'FINANCE'],
      'analytics': ['OWNER', 'ADMIN'],
      'settings': ['OWNER', 'ADMIN'],
  };

  const getAllowedPages = () => {
      return Object.keys(MENU_PERMISSIONS)
          .filter(pageKey => MENU_PERMISSIONS[pageKey].includes(currentUser.role))
          .map(key => key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize first letter
  };

  const allowedPages = getAllowedPages();

  // Filter Logic
  const filteredClients = query ? clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : [];
  const filteredBookings = query ? bookings.filter(b => b.clientName.toLowerCase().includes(query.toLowerCase()) || b.id.includes(query)).slice(0, 3) : [];
  const filteredAssets = query ? assets.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : [];
  
  const filteredPages = allowedPages.filter(p => p.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <Motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-xl bg-lumina-surface border border-lumina-highlight rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
      >
        {/* Input */}
        <div className="p-4 border-b border-lumina-highlight flex items-center gap-3">
            <Search className="w-5 h-5 text-lumina-accent" />
            <input 
                autoFocus
                type="text" 
                placeholder="Type a command or search..." 
                className="flex-1 bg-transparent text-lg text-white placeholder-lumina-muted focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={onClose} className="p-1 rounded hover:bg-lumina-highlight text-lumina-muted">
                <X size={18} />
            </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto custom-scrollbar p-2">
            
            {/* Pages Section */}
            <div className="mb-2">
                <h4 className="px-3 py-2 text-xs font-bold text-lumina-muted uppercase tracking-wider">Navigation</h4>
                {filteredPages.length > 0 ? filteredPages.map(page => (
                    <button 
                        key={page}
                        onClick={() => { onNavigate(page.toLowerCase()); onClose(); }}
                        className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-lumina-highlight group transition-colors text-left"
                    >
                        <ArrowRight className="w-4 h-4 text-lumina-muted group-hover:text-lumina-accent mr-3" />
                        <span className="text-white text-sm font-medium">Go to {page}</span>
                    </button>
                )) : (
                    <div className="px-3 py-2 text-xs text-lumina-muted flex items-center gap-2">
                         {query && (
                             <>
                                <Lock size={10} />
                                <span>No access to restricted pages matching "{query}"</span>
                             </>
                         )}
                    </div>
                )}
            </div>

            {/* Bookings Section */}
            {filteredBookings.length > 0 && (
                <div className="mb-2 border-t border-lumina-highlight/50 pt-2">
                    <h4 className="px-3 py-2 text-xs font-bold text-lumina-muted uppercase tracking-wider">Bookings</h4>
                    {filteredBookings.map(b => (
                        <button 
                            key={b.id} 
                            onClick={() => { onSelectBooking(b.id); onClose(); }}
                            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-lumina-highlight group transition-colors text-left"
                        >
                            <Calendar className="w-4 h-4 text-indigo-400 mr-3" />
                            <div className="flex-1">
                                <div className="text-white text-sm font-bold flex items-center gap-2">
                                    {b.clientName} 
                                    <span className="text-[10px] bg-lumina-base px-1.5 rounded text-lumina-muted border border-lumina-highlight">{b.status}</span>
                                </div>
                                <div className="text-xs text-lumina-muted">{b.date} • {b.package}</div>
                            </div>
                            <Hash className="w-3 h-3 text-lumina-muted" />
                        </button>
                    ))}
                </div>
            )}

            {/* Clients Section */}
            {filteredClients.length > 0 && (
                <div className="mb-2 border-t border-lumina-highlight/50 pt-2">
                    <h4 className="px-3 py-2 text-xs font-bold text-lumina-muted uppercase tracking-wider">Clients</h4>
                    {filteredClients.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => { onNavigate('clients'); onClose(); }}
                            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-lumina-highlight group transition-colors text-left"
                        >
                            <User className="w-4 h-4 text-emerald-400 mr-3" />
                            <div className="flex-1">
                                <div className="text-white text-sm font-bold">{c.name}</div>
                                <div className="text-xs text-lumina-muted">{c.phone}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

             {/* Assets Section */}
             {filteredAssets.length > 0 && (
                <div className="mb-2 border-t border-lumina-highlight/50 pt-2">
                    <h4 className="px-3 py-2 text-xs font-bold text-lumina-muted uppercase tracking-wider">Inventory</h4>
                    {filteredAssets.map(a => (
                        <button 
                            key={a.id} 
                            onClick={() => { onNavigate('inventory'); onClose(); }}
                            className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-lumina-highlight group transition-colors text-left"
                        >
                            <Box className="w-4 h-4 text-amber-400 mr-3" />
                            <div className="flex-1">
                                <div className="text-white text-sm font-bold">{a.name}</div>
                                <div className="text-xs text-lumina-muted">{a.category} • {a.status}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {query && filteredPages.length === 0 && filteredBookings.length === 0 && filteredClients.length === 0 && filteredAssets.length === 0 && (
                <div className="p-8 text-center text-lumina-muted">
                    <p>No results found for "{query}"</p>
                </div>
            )}
        </div>
        
        <div className="p-2 border-t border-lumina-highlight bg-lumina-base/50 flex justify-end">
            <div className="flex gap-4 text-[10px] text-lumina-muted uppercase tracking-wider font-mono">
                <span className="flex items-center"><span className="bg-lumina-highlight px-1.5 py-0.5 rounded mr-1">↑↓</span> Navigate</span>
                <span className="flex items-center"><span className="bg-lumina-highlight px-1.5 py-0.5 rounded mr-1">↵</span> Select</span>
                <span className="flex items-center"><span className="bg-lumina-highlight px-1.5 py-0.5 rounded mr-1">Esc</span> Close</span>
            </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default CommandPalette;
