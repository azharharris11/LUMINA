
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { Aperture, ArrowRight, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const Motion = motion as any;

interface LoginViewProps {
  users: User[]; // Kept for compatibility if needed, but not used for real auth
  onLogin: (user: User) => void; // This might not be needed if we rely on onAuthStateChanged in App.tsx, but kept for prop compatibility
  onRegisterLink?: () => void; // New prop to switch to register
}

const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, onRegisterLink }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
          await signInWithEmailAndPassword(auth, email, password);
          // The onAuthStateChanged in App.tsx will handle the redirect and user state setting
      } catch (err: any) {
          console.error("Login Error:", err);
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
              setError("Incorrect email or password. Please try again.");
          } else if (err.code === 'auth/too-many-requests') {
              setError("Too many failed attempts. Please try again later.");
          } else {
              setError("Failed to log in. Please check your connection.");
          }
      } finally {
          setIsLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
      setError(null);
      setIsLoading(true);
      try {
          await signInWithPopup(auth, googleProvider);
          // App.tsx will handle the rest via onAuthStateChanged
      } catch (err: any) {
          console.error("Google Login Error:", err);
          if (err.code === 'auth/unauthorized-domain') {
              setError(`Domain not authorized. Add '${window.location.hostname}' to Firebase Console > Auth > Settings.`);
          } else if (err.code === 'auth/popup-closed-by-user') {
              setError("Sign-in cancelled.");
          } else {
              setError("Failed to sign in with Google. Check console for details.");
          }
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-lumina-base flex items-center justify-center relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lumina-accent/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
      </div>

      <Motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl h-[600px] bg-lumina-surface/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden relative z-10"
      >
        {/* Left Side - Brand */}
        <div className="w-1/2 p-12 flex flex-col justify-between border-r border-white/5 bg-gradient-to-br from-lumina-surface/80 to-transparent hidden md:flex">
          <div>
            <div className="flex items-center gap-3 mb-8">
               <Aperture className="w-10 h-10 text-lumina-accent" />
               <span className="font-display font-bold text-3xl tracking-tight text-white">LUMINA</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
              Orchestrate your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lumina-accent to-emerald-400">Creative Business</span>
            </h1>
            <p className="text-lumina-muted text-lg font-light">
              The all-in-one studio management suite for forward-thinking creative teams.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-lumina-accent"></span>
            <span className="w-2 h-2 rounded-full bg-lumina-highlight"></span>
            <span className="w-2 h-2 rounded-full bg-lumina-highlight"></span>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-lumina-base/40">
           <div className="mb-8">
             <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
             <p className="text-sm text-lumina-muted">Enter your credentials to access the workspace.</p>
           </div>

           {error && (
               <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs font-bold">
                   <AlertCircle size={14} className="shrink-0" />
                   <span>{error}</span>
               </div>
           )}

           {/* Form */}
           <form onSubmit={handleLoginSubmit} className="space-y-4">
               <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-lumina-muted w-5 h-5" />
                   <input 
                      required
                      type="email" 
                      placeholder="Email Address"
                      className="w-full bg-lumina-surface border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-lumina-accent transition-colors placeholder:text-lumina-muted/50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                   />
               </div>
               <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-lumina-muted w-5 h-5" />
                   <input 
                      required
                      type="password" 
                      placeholder="Password"
                      className="w-full bg-lumina-surface border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-lumina-accent transition-colors placeholder:text-lumina-muted/50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                   />
               </div>

               <button 
                  type="submit"
                  disabled={isLoading}
                  className="mt-8 w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-lumina-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
               >
                  {isLoading ? <Loader2 className="animate-spin"/> : (
                      <>
                        <span>Access Dashboard</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                  )}
               </button>
           </form>

           {/* Google Button */}
           <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1a1918] px-2 text-lumina-muted">Or continue with</span>
                </div>
           </div>

           <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors"
           >
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
               </svg>
               Sign in with Google
           </button>

           <div className="mt-8 text-center">
               <p className="text-sm text-lumina-muted">
                   Don't have an account? {' '}
                   <button onClick={onRegisterLink} className="text-white font-bold hover:text-lumina-accent transition-colors">Start Free Trial</button>
               </p>
           </div>

           <p className="mt-6 text-center text-xs text-lumina-muted opacity-50">
             Protected by Lumina Secure • v2.4.0
           </p>
        </div>
      </Motion.div>
    </div>
  );
};

export default LoginView;
