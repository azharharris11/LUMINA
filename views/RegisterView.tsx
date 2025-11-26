
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Aperture, ArrowRight, Mail, Lock, User as UserIcon, Building, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { User } from '../types';

const Motion = motion as any;

interface RegisterViewProps {
  onLoginLink: () => void;
  onRegisterSuccess: (user: User) => void;
  onHome?: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onLoginLink, onRegisterSuccess, onHome }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    studioName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }

    setIsLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Display Name in Auth
      await updateProfile(user, {
          displayName: formData.fullName,
          photoURL: `https://ui-avatars.com/api/?name=${formData.fullName}&background=0D8ABC&color=fff`
      });

      // 3. Prepare User Object for App State
      const appUser: User = {
          id: user.uid,
          name: formData.fullName,
          email: formData.email || '',
          role: 'OWNER',
          avatar: user.photoURL || '',
          phone: '',
          status: 'ACTIVE',
          joinedDate: new Date().toISOString()
      };

      // 4. Try to create Firestore document (Non-blocking)
      try {
          const newUserProfile = {
              uid: user.uid,
              name: formData.fullName,
              email: formData.email,
              role: 'OWNER',
              studioName: formData.studioName,
              createdAt: new Date().toISOString(),
              phone: '',
              status: 'ACTIVE',
              avatar: user.photoURL
          };
          // Force write even if offline
          await setDoc(doc(db, "users", user.uid), newUserProfile);
      } catch (fsError) {
          console.warn("Firestore Profile Creation Failed (Likely Offline or Permission Issue):", fsError);
          // We proceed anyway because Auth succeeded
      }

      onRegisterSuccess(appUser);

    } catch (err: any) {
      console.error("Registration Error:", err);
      let msg = "Failed to create account.";
      if (err.code === 'auth/email-already-in-use') msg = "That email is already in use.";
      if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
      if (err.code === 'auth/unauthorized-domain') msg = `Domain not authorized. Add '${window.location.hostname}' to Firebase Console > Auth > Settings.`;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
      setError(null);
      setIsLoading(true);
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;

          // Check if user doc already exists
          try {
              const docRef = doc(db, "users", user.uid);
              const docSnap = await getDoc(docRef);

              if (!docSnap.exists()) {
                  // Create new profile for Google user
                  const newUserProfile = {
                      uid: user.uid,
                      name: user.displayName || 'User',
                      email: user.email,
                      role: 'OWNER',
                      studioName: 'My Studio', // Default
                      createdAt: new Date().toISOString(),
                      phone: '',
                      status: 'ACTIVE',
                      avatar: user.photoURL
                  };
                  await setDoc(docRef, newUserProfile);
              }
          } catch (fsError) {
              console.warn("Firestore Profile Check Failed (Likely Offline):", fsError);
              // Proceed without DB
          }
          
          // App.tsx onAuthStateChanged will handle the rest
      } catch (err: any) {
          console.error("Google Register Error:", err);
          if (err.code === 'auth/unauthorized-domain') {
              setError(`Domain not authorized. Add '${window.location.hostname}' to Firebase Console > Auth > Settings.`);
          } else if (err.code === 'auth/popup-closed-by-user') {
              setError("Sign-up cancelled.");
          } else {
              setError("Failed to sign up with Google.");
          }
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-lumina-base flex items-center justify-center relative overflow-hidden p-4">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-lumina-accent/10 rounded-full blur-[150px]"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-overlay"></div>
      </div>

      <div className="absolute top-6 left-6 z-20">
          <button onClick={onHome} className="flex items-center gap-2 text-lumina-muted hover:text-white transition-colors font-bold text-sm">
              <ArrowLeft size={16} /> Back to Home
          </button>
      </div>

      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-lumina-surface/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-8">
           <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Aperture className="w-8 h-8 text-lumina-accent" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Build Your Empire</h2>
                <p className="text-sm text-lumina-muted">Join thousands of high-performance studios.</p>
           </div>

           {error && (
               <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs font-bold">
                   <AlertCircle size={14} className="shrink-0" />
                   <span>{error}</span>
               </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                   <div className="relative">
                       <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4" />
                       <input 
                          required
                          type="text" 
                          placeholder="Full Name"
                          className="w-full bg-lumina-base/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-lumina-accent transition-colors placeholder:text-lumina-muted/50"
                          value={formData.fullName}
                          onChange={e => setFormData({...formData, fullName: e.target.value})}
                       />
                   </div>
                   <div className="relative">
                       <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4" />
                       <input 
                          required
                          type="text" 
                          placeholder="Studio Name"
                          className="w-full bg-lumina-base/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-lumina-accent transition-colors placeholder:text-lumina-muted/50"
                          value={formData.studioName}
                          onChange={e => setFormData({...formData, studioName: e.target.value})}
                       />
                   </div>
               </div>

               <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4" />
                   <input 
                      required
                      type="email" 
                      placeholder="Email Address"
                      className="w-full bg-lumina-base/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-lumina-accent transition-colors placeholder:text-lumina-muted/50"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                   />
               </div>

               <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4" />
                   <input 
                      required
                      type="password" 
                      placeholder="Password (min 6 chars)"
                      className="w-full bg-lumina-base/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-lumina-accent transition-colors placeholder:text-lumina-muted/50"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                   />
               </div>

               <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4" />
                   <input 
                      required
                      type="password" 
                      placeholder="Confirm Password"
                      className="w-full bg-lumina-base/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-lumina-accent transition-colors placeholder:text-lumina-muted/50"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                   />
               </div>

               <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-lumina-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
               >
                  {isLoading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <span>Start Free Trial</span>
                        <ArrowRight className="w-4 h-4" />
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
                    <span className="bg-[#1a1918] px-2 text-lumina-muted">Or sign up with</span>
                </div>
           </div>

           <button 
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors"
           >
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
               </svg>
               Google
           </button>

           <div className="mt-8 text-center border-t border-white/10 pt-6">
               <p className="text-sm text-lumina-muted">
                   Already have an account? {' '}
                   <button onClick={onLoginLink} className="text-white font-bold hover:text-lumina-accent transition-colors">Log In</button>
               </p>
           </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default RegisterView;
