
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { Aperture, ArrowRight, Camera, Briefcase, Building, Zap, Check, Loader2, User as UserIcon } from 'lucide-react';

const Motion = motion as any;

interface OnboardingViewProps {
  user: User;
  onComplete: (data: { studioName: string, focus: string }) => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [studioName, setStudioName] = useState('');
  const [focus, setFocus] = useState('');
  
  // Step 3: Fake Loader State
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Core System...');

  useEffect(() => {
      // Pre-fill if user has studioName in profile (from register)
      // We can assume the studioName might be in user object or fetched
      if(step === 1) setStudioName(user.name ? `${user.name.split(' ')[0]}'s Studio` : 'My Studio');
  }, [step]);

  useEffect(() => {
      if (step === 3) {
          // Simulation of setting up the environment
          const texts = [
              "Configuring Financial Ledger...",
              "Setting up Production Pipeline...",
              "Calibrating Color Profiles...",
              "Syncing Calendar Engine...",
              "Finalizing Workspace..."
          ];
          
          let i = 0;
          const interval = setInterval(() => {
              setLoadingProgress(prev => {
                  if (prev >= 100) {
                      clearInterval(interval);
                      setTimeout(() => onComplete({ studioName, focus }), 500);
                      return 100;
                  }
                  return prev + (Math.random() * 15);
              });
              
              if (Math.random() > 0.7) {
                  i = (i + 1) % texts.length;
                  setLoadingText(texts[i]);
              }
          }, 400);
          
          return () => clearInterval(interval);
      }
  }, [step]);

  const focusOptions = [
      { id: 'WEDDING', label: 'Wedding & Events', icon: Camera, desc: 'High volume, fast turnaround' },
      { id: 'COMMERCIAL', label: 'Commercial / Ads', icon: Briefcase, desc: 'B2B, invoicing focused' },
      { id: 'PORTRAIT', label: 'Portrait & Family', icon: UserIcon, desc: 'Studio sessions, recurring clients' },
      { id: 'RENTAL', label: 'Studio Rental', icon: Building, desc: 'Booking slots, asset tracking' }
  ];

  return (
    <div className="min-h-screen bg-lumina-base flex items-center justify-center relative overflow-hidden p-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-overlay"></div>
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-lumina-accent/10 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <Motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="mb-8 text-center">
            <Motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center p-3 bg-lumina-surface border border-lumina-highlight rounded-2xl mb-6 shadow-2xl"
            >
                <Aperture className="w-8 h-8 text-lumina-accent animate-spin-slow" />
            </Motion.div>
            
            {step < 3 && (
                <Motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl md:text-5xl font-display font-bold text-white mb-2"
                >
                    Welcome to Lumina
                </Motion.h1>
            )}
        </div>

        <div className="bg-lumina-surface/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl min-h-[400px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
                
                {/* STEP 1: STUDIO IDENTITY */}
                {step === 1 && (
                    <Motion.div 
                        key="step1"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-white">Let's name your workspace</h2>
                            <p className="text-lumina-muted text-sm">This will appear on invoices and contracts.</p>
                        </div>
                        
                        <input 
                            autoFocus
                            type="text" 
                            value={studioName}
                            onChange={(e) => setStudioName(e.target.value)}
                            className="w-full bg-lumina-base border-2 border-lumina-highlight rounded-2xl p-4 text-center text-2xl font-display font-bold text-white focus:border-lumina-accent outline-none transition-colors placeholder:text-lumina-muted/30"
                            placeholder="Enter Studio Name"
                        />

                        <div className="flex justify-center mt-8">
                            <button 
                                onClick={() => { if(studioName) setStep(2); }}
                                disabled={!studioName}
                                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-lumina-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next Step <ArrowRight size={18} />
                            </button>
                        </div>
                    </Motion.div>
                )}

                {/* STEP 2: FOCUS */}
                {step === 2 && (
                    <Motion.div 
                        key="step2"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-white">What is your primary focus?</h2>
                            <p className="text-lumina-muted text-sm">We'll optimize your dashboard based on this.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {focusOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFocus(opt.id)}
                                    className={`p-4 rounded-xl border text-left transition-all group
                                        ${focus === opt.id 
                                            ? 'bg-lumina-accent text-black border-lumina-accent' 
                                            : 'bg-lumina-base border-lumina-highlight text-lumina-muted hover:border-white hover:text-white'}
                                    `}
                                >
                                    <opt.icon size={24} className={`mb-3 ${focus === opt.id ? 'text-black' : 'text-lumina-accent'}`} />
                                    <h3 className="font-bold text-sm uppercase tracking-wider mb-1">{opt.label}</h3>
                                    <p className={`text-xs ${focus === opt.id ? 'text-black/70' : 'text-lumina-muted group-hover:text-gray-400'}`}>
                                        {opt.desc}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center mt-8 gap-4">
                            <button onClick={() => setStep(1)} className="text-lumina-muted hover:text-white text-sm font-bold">Back</button>
                            <button 
                                onClick={() => setStep(3)}
                                disabled={!focus}
                                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-lumina-accent transition-colors disabled:opacity-50"
                            >
                                Finish Setup <Zap size={18} fill="black" />
                            </button>
                        </div>
                    </Motion.div>
                )}

                {/* STEP 3: LOADER */}
                {step === 3 && (
                    <Motion.div 
                        key="step3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center space-y-8"
                    >
                        <div className="relative w-24 h-24 mx-auto">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
                                <Motion.circle 
                                    cx="50" cy="50" r="45" fill="none" stroke="#bef264" strokeWidth="8" strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: loadingProgress / 100 }}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white">
                                {Math.round(loadingProgress)}%
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Setting up {studioName}</h2>
                            <p className="text-lumina-accent font-mono text-sm animate-pulse">{loadingText}</p>
                        </div>
                    </Motion.div>
                )}

            </AnimatePresence>
        </div>
      </Motion.div>
    </div>
  );
};

export default OnboardingView;
