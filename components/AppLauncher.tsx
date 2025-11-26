import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Globe, ArrowRight, Aperture } from 'lucide-react';
import { User } from '../types';

const Motion = motion as any;

interface AppLauncherProps {
  user: User;
  onSelectApp: (app: 'OS' | 'SITE') => void;
  onLogout: () => void;
}

const AppLauncher: React.FC<AppLauncherProps> = ({ user, onSelectApp, onLogout }) => {
  return (
    <div className="min-h-screen bg-lumina-base flex flex-col items-center justify-center relative overflow-hidden p-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lumina-accent/5 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-lumina-highlight/50 rounded-2xl border border-white/5 backdrop-blur-xl">
                <Aperture className="w-8 h-8 text-white" />
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
          Welcome back, {(user.name || '').split(' ')[0]}
        </h1>
        <p className="text-lumina-muted text-lg">Select a workspace to continue</p>
      </Motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full z-10">
        
        {/* Card 1: Studio OS */}
        <Motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectApp('OS')}
          className="group relative h-80 rounded-3xl overflow-hidden border border-white/10 bg-lumina-surface/50 backdrop-blur-sm text-left transition-all hover:border-lumina-accent/50 hover:shadow-2xl hover:shadow-lumina-accent/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-lumina-highlight/0 to-lumina-highlight/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-8 flex flex-col h-full justify-between relative z-10">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-lumina-base border border-lumina-highlight flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <LayoutDashboard className="text-lumina-accent w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-lumina-accent transition-colors">Lumina OS</h2>
              <p className="text-lumina-muted text-sm leading-relaxed">
                Manage bookings, finance, team rosters, and production workflows. The command center for your daily operations.
              </p>
            </div>
            <div className="flex items-center text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
              Launch System <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </div>
        </Motion.button>

        {/* Card 2: Site Builder */}
        <Motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectApp('SITE')}
          disabled={user.role !== 'OWNER'}
          className={`group relative h-80 rounded-3xl overflow-hidden border border-white/10 bg-lumina-surface/50 backdrop-blur-sm text-left transition-all 
            ${user.role === 'OWNER' ? 'hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-400/10' : 'opacity-50 cursor-not-allowed'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Background Decor */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>

          <div className="p-8 flex flex-col h-full justify-between relative z-10">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-lumina-base border border-lumina-highlight flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Globe className="text-blue-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Lumina Sites</h2>
              <p className="text-lumina-muted text-sm leading-relaxed">
                Design and publish your studio's portfolio website. Control themes, SEO, and content in real-time.
              </p>
            </div>
            
            {user.role === 'OWNER' ? (
                <div className="flex items-center text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                Open Builder <ArrowRight className="ml-2 w-4 h-4" />
                </div>
            ) : (
                <div className="flex items-center text-xs font-bold text-lumina-muted bg-lumina-base/50 px-3 py-1 rounded-lg w-fit">
                    Owner Access Only
                </div>
            )}
          </div>
        </Motion.button>

      </div>

      <button onClick={onLogout} className="mt-12 text-lumina-muted hover:text-white text-sm font-medium transition-colors">
        Sign out of account
      </button>
    </div>
  );
};

export default AppLauncher;