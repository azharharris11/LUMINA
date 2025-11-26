
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AppLauncher from './components/AppLauncher';
import DashboardView from './views/DashboardView';
import FinanceView from './views/FinanceView';
import ProductionView from './views/ProductionView';
import CalendarView from './views/CalendarView';
import InventoryView from './views/InventoryView';
import SettingsView from './views/SettingsView';
import ClientsView from './views/ClientsView';
import TeamView from './views/TeamView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import AnalyticsView from './views/AnalyticsView';
import SiteBuilderView from './views/SiteBuilderView';
import LandingPageView from './views/LandingPageView';
import NewBookingModal from './components/NewBookingModal';
import CommandPalette from './components/CommandPalette';
import ProjectDrawer from './components/ProjectDrawer';
import { USERS, ACCOUNTS as INITIAL_ACCOUNTS, BOOKINGS as INITIAL_BOOKINGS, ASSETS as INITIAL_ASSETS, TRANSACTIONS as INITIAL_TRANSACTIONS, PACKAGES as INITIAL_PACKAGES, CLIENTS as INITIAL_CLIENTS, NOTIFICATIONS, STUDIO_CONFIG as INITIAL_CONFIG } from './data';
import { User, Booking, Asset, Notification, Account, Transaction, Client, Package, StudioConfig, BookingTask, ActivityLog, PublicBookingSubmission } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Info, AlertTriangle, Search, Database, CheckCheck, Trash, WifiOff, Cloud, ShieldAlert, ExternalLink, X, RefreshCcw } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, writeBatch, increment } from 'firebase/firestore';

const Motion = motion as any;

const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(`lumina_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return fallback;
  }
};

type AppMode = 'LAUNCHER' | 'OS' | 'SITE';
type AuthView = 'LOGIN' | 'REGISTER';

const PermissionErrorHelp = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-red-500 rounded-2xl p-8 max-w-3xl w-full shadow-2xl relative">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-red-500/20 rounded-full">
            <AlertTriangle className="text-red-500 w-8 h-8" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Database Permission Denied</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
                The app is connected to Firebase, but the <strong>Firestore Security Rules</strong> are blocking access to shared data (Bookings, Clients, etc).
            </p>
        </div>
      </div>
      
      <div className="space-y-4">
          <p className="text-white font-bold text-sm">To fix this, paste the following rules into your Firebase Console:</p>
          <div className="bg-black p-4 rounded-lg border border-gray-700 font-mono text-xs text-emerald-400 overflow-x-auto relative custom-scrollbar">
            <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow any logged-in user to read/write these shared collections
    match /bookings/{document=**} { allow read, write: if request.auth != null; }
    match /clients/{document=**} { allow read, write: if request.auth != null; }
    match /transactions/{document=**} { allow read, write: if request.auth != null; }
    match /users/{document=**} { allow read, write: if request.auth != null; }
    match /assets/{document=**} { allow read, write: if request.auth != null; }
    match /accounts/{document=**} { allow read, write: if request.auth != null; }
    match /packages/{document=**} { allow read, write: if request.auth != null; }
    match /notifications/{document=**} { allow read, write: if request.auth != null; }
    match /studio/{document=**} { allow read, write: if request.auth != null; }
  }
}`}</pre>
          </div>
          <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span>1. Go to Firebase Console</span>
              <span>&gt;</span>
              <span>Firestore Database</span>
              <span>&gt;</span>
              <span>Rules Tab</span>
          </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-800">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white font-bold text-sm transition-colors">Close & Retry</button>
        <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20">
          Open Firebase Console <ExternalLink size={16} />
        </a>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('LOGIN');
  const [hasSeenLanding, setHasSeenLanding] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); 
  const [appMode, setAppMode] = useState<AppMode>('LAUNCHER');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('lumina_theme');
      return saved ? saved === 'dark' : true;
  });

  // Date State for Calendar & Dashboard
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal States
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{date:string, time:string, studio:string} | undefined>(undefined);

  // Data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<StudioConfig>(INITIAL_CONFIG);

  // Derived Data
  const selectedBooking = bookings.find(b => b.id === selectedBookingId) || null;
  const activePhotographers = users.filter(u => u.role === 'PHOTOGRAPHER' && u.status === 'ACTIVE');

  // Key Bindings
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              setIsCommandPaletteOpen(true);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Connection Check
  const checkConnection = async () => {
      try {
          const testDoc = await getDoc(doc(db, "studio", "config"));
          setIsOfflineMode(false);
          setPermissionError(false);
      } catch (e: any) {
          console.error("Connection Check Failed:", e);
          if (e.code === 'permission-denied') setPermissionError(true);
          else setIsOfflineMode(true);
      }
  };

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
              try {
                  const userDocRef = doc(db, "users", firebaseUser.uid);
                  const userDocSnap = await getDoc(userDocRef);
                  let userData: any;
                  if (userDocSnap.exists()) {
                      userData = userDocSnap.data();
                  } else {
                      const newProfile = {
                          uid: firebaseUser.uid,
                          name: firebaseUser.displayName || 'User',
                          email: firebaseUser.email || '',
                          role: 'OWNER',
                          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}`,
                          createdAt: new Date().toISOString(),
                          phone: '',
                          status: 'ACTIVE',
                          studioName: 'My Studio'
                      };
                      // Attempt to write, might fail if rules are strict
                      try {
                        await setDoc(userDocRef, newProfile);
                      } catch(e) {
                          console.warn("Could not create user profile doc yet", e);
                      }
                      userData = newProfile;
                  }
                  setCurrentUser({
                      id: firebaseUser.uid,
                      name: userData.name,
                      email: userData.email,
                      role: userData.role,
                      avatar: userData.avatar,
                      phone: userData.phone || '',
                      status: userData.status || 'ACTIVE',
                      joinedDate: userData.createdAt || new Date().toISOString(),
                      unavailableDates: userData.unavailableDates || []
                  });
                  setIsOfflineMode(false);
                  setPermissionError(false);
              } catch (e: any) {
                  console.warn("Auth/DB Error:", e);
                  if (e.code === 'permission-denied') {
                      setPermissionError(true);
                  } else if (navigator.onLine === false || e.code === 'unavailable') {
                      setIsOfflineMode(true);
                  }
                  
                  setCurrentUser({
                      id: firebaseUser.uid,
                      name: firebaseUser.displayName || 'User',
                      email: firebaseUser.email || '',
                      role: 'OWNER',
                      avatar: firebaseUser.photoURL || '',
                      phone: '',
                      status: 'ACTIVE',
                      joinedDate: new Date().toISOString()
                  });
              }
              setIsLoggedIn(true);
              setHasSeenLanding(true);
          } else {
              setIsLoggedIn(false);
          }
      });
      return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (!isLoggedIn) return;
      
      if (permissionError) return;

      if (isOfflineMode) {
          setBookings(loadState('bookings', INITIAL_BOOKINGS));
          setClients(loadState('clients', INITIAL_CLIENTS));
          setAssets(loadState('assets', INITIAL_ASSETS));
          setTransactions(loadState('transactions', INITIAL_TRANSACTIONS));
          setPackages(loadState('packages', INITIAL_PACKAGES));
          setUsers(loadState('users', USERS));
          setConfig(loadState('config', INITIAL_CONFIG));
          setAccounts(loadState('accounts', INITIAL_ACCOUNTS));
          setNotifications(loadState('notifications', NOTIFICATIONS));
          return;
      }

      const handleSyncError = (err: any, collectionName: string) => {
          console.error(`Error syncing ${collectionName}:`, err);
          if (err.code === 'permission-denied') {
              setPermissionError(true);
          } else if (err.code === 'unavailable' || navigator.onLine === false) {
              setIsOfflineMode(true);
          }
      };

      const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
          if(!snap.empty) setBookings(snap.docs.map(d => d.data() as Booking));
      }, (e) => handleSyncError(e, "bookings"));
      
      const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
          if(!snap.empty) setClients(snap.docs.map(d => d.data() as Client));
      }, (e) => handleSyncError(e, "clients"));
      
      const unsubAssets = onSnapshot(collection(db, "assets"), (snap) => {
          if(!snap.empty) setAssets(snap.docs.map(d => d.data() as Asset));
      }, (e) => handleSyncError(e, "assets"));
      
      const unsubTransactions = onSnapshot(collection(db, "transactions"), (snap) => {
          if(!snap.empty) setTransactions(snap.docs.map(d => d.data() as Transaction));
      }, (e) => handleSyncError(e, "transactions"));
      
      const unsubPackages = onSnapshot(collection(db, "packages"), (snap) => {
          if(!snap.empty) setPackages(snap.docs.map(d => d.data() as Package));
      }, (e) => handleSyncError(e, "packages"));
      
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
          if(!snap.empty) setUsers(snap.docs.map(d => { const u = d.data(); return { id: u.uid, name: u.name, role: u.role, email: u.email, avatar: u.avatar, phone: u.phone, status: u.status, joinedDate: u.createdAt, unavailableDates: u.unavailableDates } as User; }));
      }, (e) => handleSyncError(e, "users"));
      
      const unsubAccounts = onSnapshot(collection(db, "accounts"), (snap) => { 
          if(!snap.empty) {
              setAccounts(snap.docs.map(d => d.data() as Account)); 
          } else {
              // Seed initial accounts if empty and online
              if (navigator.onLine && !permissionError) {
                  const batch = writeBatch(db);
                  INITIAL_ACCOUNTS.forEach(acc => {
                      batch.set(doc(db, "accounts", acc.id), acc);
                  });
                  batch.commit().catch(console.error);
              }
          }
      }, (e) => handleSyncError(e, "accounts"));
      
      const unsubNotifications = onSnapshot(collection(db, "notifications"), (snap) => {
          if(!snap.empty) setNotifications(snap.docs.map(d => d.data() as Notification));
      }, (e) => handleSyncError(e, "notifications"));
      
      const configRef = doc(db, "studio", "config");
      const unsubConfig = onSnapshot(configRef, (s) => { if(s.exists()) setConfig(s.data() as StudioConfig); }, (e) => handleSyncError(e, "config"));

      return () => {
          unsubBookings(); unsubClients(); unsubAssets(); unsubTransactions(); unsubPackages(); unsubUsers(); unsubAccounts(); unsubNotifications(); unsubConfig();
      };
  }, [isLoggedIn, isOfflineMode, permissionError]);

  // Handlers
  const handleAddBooking = async (b: Booking, p?: { amount: number, accountId: string }) => {
      if(isOfflineMode || permissionError) { 
          setBookings(prev => [...prev, b]); 
          if(p && p.amount > 0) {
              setAccounts(prev => prev.map(a => a.id === p.accountId ? {...a, balance: a.balance + p.amount} : a));
          }
          return; 
      }
      try {
          const batch = writeBatch(db);
          batch.set(doc(db, "bookings", b.id), b);
          
          if(p && p.amount > 0) {
              const trxRef = doc(collection(db, "transactions"));
              const trx: Transaction = { id: trxRef.id, date: new Date().toISOString(), description: `Payment: ${b.clientName}`, amount: p.amount, type: 'INCOME', accountId: p.accountId, category: 'Sales', status: 'COMPLETED', bookingId: b.id };
              batch.set(trxRef, trx);
              
              // Use set with merge:true to create account if it doesn't exist
              const accRef = doc(db, "accounts", p.accountId);
              batch.set(accRef, { 
                  balance: increment(p.amount) 
              }, { merge: true });
          }
          await batch.commit();
          setViewDate(b.date);
      } catch(e: any) { 
          console.error("Error adding booking:", e); 
          if (e.code === 'permission-denied') setPermissionError(true);
      }
  };

  const handleUpdateBooking = async (b: Booking) => {
      if(isOfflineMode || permissionError) { setBookings(prev => prev.map(x => x.id === b.id ? b : x)); return; }
      try { await setDoc(doc(db, "bookings", b.id), b); } catch(e: any) { console.error(e); if(e.code === 'permission-denied') setPermissionError(true); }
  };

  // OPTIMISTIC DELETION HANDLERS
  const handleDeleteBooking = async (id: string) => {
      console.log("Deleting booking:", id);
      const originalBookings = [...bookings];
      // Optimistic Update
      setBookings(prev => prev.filter(x => x.id !== id));
      
      if(isOfflineMode || permissionError) return;

      try { 
          await deleteDoc(doc(db, "bookings", id)); 
      } catch(e: any) { 
          console.error(e);
          alert(`Failed to delete booking: ${e.message}`);
          setBookings(originalBookings); // Rollback
      }
  };

  const handleAddClient = async (c: Client) => {
      if(isOfflineMode || permissionError) { setClients(prev => [...prev, c]); return; }
      try { await setDoc(doc(db, "clients", c.id), c); } catch(e: any) { console.error(e); }
  };

  const handleUpdateClient = async (c: Client) => {
      if(isOfflineMode || permissionError) { setClients(prev => prev.map(x => x.id === c.id ? c : x)); return; }
      try { await setDoc(doc(db, "clients", c.id), c); } catch(e: any) { console.error(e); }
  };

  const handleDeleteClient = async (id: string) => {
      console.log("Deleting client:", id);
      const originalClients = [...clients];
      // Optimistic
      setClients(prev => prev.filter(x => x.id !== id));

      if(isOfflineMode || permissionError) return;

      try { 
          await deleteDoc(doc(db, "clients", id)); 
      } catch(e: any) { 
          console.error(e); 
          alert(`Failed to delete client: ${e.message}`);
          setClients(originalClients);
      }
  };

  const handleAddAsset = async (a: Asset) => {
      if(isOfflineMode || permissionError) { setAssets(prev => [...prev, a]); return; }
      try { await setDoc(doc(db, "assets", a.id), a); } catch(e: any) { console.error(e); }
  };

  const handleUpdateAsset = async (a: Asset) => {
      if(isOfflineMode || permissionError) { setAssets(prev => prev.map(x => x.id === a.id ? a : x)); return; }
      try { await setDoc(doc(db, "assets", a.id), a); } catch(e: any) { console.error(e); }
  };

  const handleDeleteAsset = async (id: string) => {
      console.log("Deleting asset:", id);
      const originalAssets = [...assets];
      setAssets(prev => prev.filter(x => x.id !== id));

      if(isOfflineMode || permissionError) return;

      try { 
          await deleteDoc(doc(db, "assets", id)); 
      } catch(e: any) { 
          console.error(e); 
          alert(`Failed to delete asset: ${e.message}`);
          setAssets(originalAssets);
      }
  };

  const handleTransfer = async (fromId: string, toId: string, amount: number) => {
      if(isOfflineMode || permissionError) { 
          setAccounts(prev => prev.map(a => a.id === fromId ? {...a, balance: a.balance - amount} : a.id === toId ? {...a, balance: a.balance + amount} : a));
          return; 
      }
      try {
          const batch = writeBatch(db);
          
          const fromAccRef = doc(db, "accounts", fromId);
          batch.set(fromAccRef, { balance: increment(-amount) }, { merge: true });
          
          const toAccRef = doc(db, "accounts", toId);
          batch.set(toAccRef, { balance: increment(amount) }, { merge: true });
          
          const trxRef = doc(collection(db, "transactions"));
          batch.set(trxRef, {
              id: trxRef.id,
              date: new Date().toISOString(),
              description: 'Internal Transfer',
              amount: amount,
              type: 'TRANSFER',
              accountId: fromId,
              relatedAccountId: toId,
              category: 'Internal',
              status: 'COMPLETED'
          });
          await batch.commit();
      } catch(e: any) { console.error(e); }
  };

  const handleRecordExpense = async (data: { description: string; amount: number; category: string; accountId: string; bookingId?: string }) => {
      if(isOfflineMode || permissionError) { 
          setAccounts(prev => prev.map(a => a.id === data.accountId ? {...a, balance: a.balance - data.amount} : a));
          return; 
      }
      try {
          const batch = writeBatch(db);
          const trxRef = doc(collection(db, "transactions"));
          batch.set(trxRef, {
              id: trxRef.id,
              date: new Date().toISOString(),
              description: data.description,
              amount: data.amount,
              type: 'EXPENSE',
              accountId: data.accountId,
              category: data.category,
              status: 'COMPLETED',
              bookingId: data.bookingId
          });
          
          const accRef = doc(db, "accounts", data.accountId);
          batch.set(accRef, { balance: increment(-data.amount) }, { merge: true });
          
          await batch.commit();
      } catch(e: any) { console.error(e); }
  };

  const handleSettleBooking = async (bookingId: string, amount: number, accountId: string) => {
      if (isOfflineMode || permissionError) {
          setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paidAmount: b.paidAmount + amount } : b));
          setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance + amount } : a));
          return;
      }

      try {
          const batch = writeBatch(db);
          
          // 1. Update Booking Paid Amount
          const bookingRef = doc(db, "bookings", bookingId);
          batch.update(bookingRef, { paidAmount: increment(amount) });

          // 2. Update Account Balance
          const accountRef = doc(db, "accounts", accountId);
          batch.set(accountRef, { balance: increment(amount) }, { merge: true });

          // 3. Create Transaction Record
          const trxRef = doc(collection(db, "transactions"));
          const newTrx: Transaction = {
              id: trxRef.id,
              date: new Date().toISOString(),
              description: amount > 0 ? 'Booking Settlement' : 'Refund/Correction',
              amount: Math.abs(amount),
              type: amount > 0 ? 'INCOME' : 'EXPENSE',
              accountId: accountId,
              category: 'Sales / Booking',
              status: 'COMPLETED',
              bookingId: bookingId
          };
          batch.set(trxRef, newTrx);

          await batch.commit();
      } catch (e: any) {
          console.error("Settlement Error:", e);
          if (e.code === 'permission-denied') setPermissionError(true);
      }
  };

  const handleUpdateConfig = async (newConfig: StudioConfig) => {
      setConfig(newConfig);
      if(isOfflineMode || permissionError) return;
      try { 
          await setDoc(doc(db, "studio", "config"), newConfig); 
      } catch(e: any) { 
          console.error(e);
          alert(`Failed to save changes: ${e.message}`);
      }
  };

  const handleLogout = () => {
      signOut(auth);
      setIsLoggedIn(false);
      setHasSeenLanding(false);
  };

  const handleToggleTheme = () => {
      setIsDarkMode(!isDarkMode);
      localStorage.setItem('lumina_theme', !isDarkMode ? 'dark' : 'light');
  };

  if (!isLoggedIn && !hasSeenLanding) {
      return <LandingPageView onGetStarted={() => setHasSeenLanding(true)} />;
  }

  if (!isLoggedIn && hasSeenLanding) {
      return (
        <AnimatePresence mode="wait">
            {authView === 'LOGIN' ? (
                <LoginView 
                    key="login"
                    users={users} 
                    onLogin={() => {}} // Handled by auth listener
                    onRegisterLink={() => setAuthView('REGISTER')}
                />
            ) : (
                <RegisterView 
                    key="register"
                    onLoginLink={() => setAuthView('LOGIN')} 
                    onRegisterSuccess={(u) => {
                        // Handled by auth listener
                    }}
                />
            )}
        </AnimatePresence>
      );
  }

  if (appMode === 'LAUNCHER') {
      return <AppLauncher user={currentUser} onSelectApp={setAppMode} onLogout={handleLogout} />;
  }

  if (appMode === 'SITE') {
      return (
        <SiteBuilderView 
            config={config}
            packages={packages}
            users={users}
            bookings={bookings}
            onUpdateConfig={handleUpdateConfig}
            onExit={() => setAppMode('LAUNCHER')}
            onPublicBooking={(data) => {
                alert("Booking request simulation received: " + JSON.stringify(data));
            }}
        />
      );
  }

  return (
    <div className={!isDarkMode ? 'light-mode' : ''}>
        {/* Permission Help Modal */}
        {permissionError && <PermissionErrorHelp onClose={() => setPermissionError(false)} />}

        <div className="flex h-screen bg-lumina-base text-lumina-text font-sans overflow-hidden transition-colors duration-300">
        <Sidebar 
            currentUser={currentUser} 
            onNavigate={setCurrentView} 
            currentView={currentView} 
            onLogout={handleLogout}
            onSwitchApp={() => setAppMode('LAUNCHER')}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
        />
        
        <main className="flex-1 flex flex-col h-full ml-20 lg:ml-64 relative overflow-hidden transition-all duration-300">
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto h-full">
                <AnimatePresence mode="wait">
                    {currentView === 'dashboard' && (
                        <Motion.div key="dashboard" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                            <DashboardView 
                                user={currentUser} 
                                bookings={bookings} 
                                transactions={transactions}
                                onSelectBooking={setSelectedBookingId} 
                                selectedDate={viewDate} 
                                onNavigate={setCurrentView}
                                config={config}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'calendar' && (
                        <Motion.div key="calendar" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full">
                            <CalendarView 
                                bookings={bookings} 
                                currentDate={viewDate} 
                                users={users}
                                rooms={config.rooms}
                                onDateChange={setViewDate} 
                                onNewBooking={(prefill) => { setBookingPrefill(prefill); setIsNewBookingOpen(true); }}
                                onSelectBooking={setSelectedBookingId}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'production' && (
                        <Motion.div key="production" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}>
                            <ProductionView 
                                bookings={bookings} 
                                onSelectBooking={setSelectedBookingId} 
                                currentUser={currentUser}
                                onUpdateBooking={handleUpdateBooking}
                                config={config}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'inventory' && (
                        <Motion.div key="inventory" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full">
                            <InventoryView 
                                assets={assets} 
                                users={users}
                                onAddAsset={handleAddAsset}
                                onUpdateAsset={handleUpdateAsset}
                                onDeleteAsset={handleDeleteAsset}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'clients' && (
                        <Motion.div key="clients" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full">
                            <ClientsView 
                                clients={clients} 
                                bookings={bookings} 
                                config={config}
                                onAddClient={handleAddClient}
                                onUpdateClient={handleUpdateClient}
                                onDeleteClient={handleDeleteClient}
                                onSelectBooking={setSelectedBookingId}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'team' && (
                        <Motion.div key="team" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <TeamView 
                                users={users}
                                bookings={bookings}
                                onAddUser={(u) => {
                                    if(isOfflineMode || permissionError) { setUsers(prev => [...prev, u]); return; }
                                    setDoc(doc(db, "users", u.id), {
                                        uid: u.id, name: u.name, role: u.role, email: u.email, phone: u.phone, status: u.status, createdAt: u.joinedDate, unavailableDates: u.unavailableDates, avatar: u.avatar, specialization: u.specialization
                                    });
                                }}
                                onUpdateUser={(u) => {
                                    if(isOfflineMode || permissionError) { setUsers(prev => prev.map(x => x.id === u.id ? u : x)); return; }
                                    updateDoc(doc(db, "users", u.id), {
                                        name: u.name, role: u.role, email: u.email, phone: u.phone, status: u.status, unavailableDates: u.unavailableDates, avatar: u.avatar, specialization: u.specialization
                                    }).catch(e => console.warn("Offline update", e));
                                }}
                                onDeleteUser={async (id) => {
                                    // Optimistic
                                    const original = [...users];
                                    setUsers(prev => prev.filter(x => x.id !== id));
                                    if(isOfflineMode || permissionError) return;
                                    try {
                                        await deleteDoc(doc(db, "users", id));
                                    } catch (e: any) {
                                        console.error(e);
                                        alert(`Failed to delete user: ${e.message}`);
                                        setUsers(original);
                                    }
                                }}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'finance' && (
                        <Motion.div key="finance" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full">
                            <FinanceView 
                                accounts={accounts}
                                metrics={[]} // Calculated internally now
                                bookings={bookings}
                                users={users}
                                transactions={transactions}
                                config={config}
                                onTransfer={handleTransfer}
                                onRecordExpense={handleRecordExpense}
                                onSettleBooking={handleSettleBooking}
                                onDeleteTransaction={async (id) => {
                                    const tx = transactions.find(t => t.id === id);
                                    if (!tx) return;

                                    // Optimistic
                                    const originalTx = [...transactions];
                                    const originalAcc = [...accounts];
                                    
                                    setTransactions(prev => prev.filter(t => t.id !== id));
                                    // Revert balance effect locally
                                    const reversal = tx.type === 'INCOME' ? -tx.amount : tx.amount;
                                    setAccounts(prev => prev.map(a => a.id === tx.accountId ? {...a, balance: a.balance + reversal} : a));

                                    if(isOfflineMode || permissionError) return;

                                    try {
                                        const batch = writeBatch(db);
                                        const accRef = doc(db, "accounts", tx.accountId);
                                        batch.update(accRef, { balance: increment(reversal) });
                                        batch.delete(doc(db, "transactions", id));
                                        await batch.commit();
                                    } catch(e: any) {
                                        console.error(e);
                                        alert("Failed to delete transaction. Rolling back.");
                                        setTransactions(originalTx);
                                        setAccounts(originalAcc);
                                    }
                                }}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'analytics' && (
                        <Motion.div key="analytics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <AnalyticsView 
                                bookings={bookings}
                                packages={packages}
                                transactions={transactions}
                            />
                        </Motion.div>
                    )}
                    {currentView === 'settings' && (
                        <Motion.div key="settings" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <SettingsView 
                                packages={packages}
                                config={config}
                                bookings={bookings}
                                currentUser={currentUser}
                                onAddPackage={async (p) => {
                                    if(isOfflineMode || permissionError) { setPackages(prev => [...prev, p]); return; }
                                    await setDoc(doc(db, "packages", p.id), p);
                                }}
                                onUpdatePackage={async (p) => {
                                    if(isOfflineMode || permissionError) { setPackages(prev => prev.map(x => x.id === p.id ? p : x)); return; }
                                    await setDoc(doc(db, "packages", p.id), p);
                                }}
                                onDeletePackage={async (id) => {
                                    console.log("Deleting package:", id);
                                    const original = [...packages];
                                    setPackages(prev => prev.filter(x => x.id !== id));
                                    if(isOfflineMode || permissionError) return;
                                    try { await deleteDoc(doc(db, "packages", id)); } 
                                    catch(e: any) { 
                                        console.error(e); 
                                        alert(`Failed to delete package: ${e.message}`);
                                        setPackages(original);
                                    }
                                }}
                                onUpdateConfig={handleUpdateConfig}
                                onUpdateUserProfile={async (updatedUser) => {
                                    // Update local first
                                    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
                                    // Update DB
                                    if (!isOfflineMode && !permissionError) {
                                        const userRef = doc(db, "users", currentUser.id);
                                        await updateDoc(userRef, {
                                            name: updatedUser.name,
                                            phone: updatedUser.phone,
                                            avatar: updatedUser.avatar,
                                            specialization: updatedUser.specialization
                                        });
                                    }
                                }}
                                onDeleteAccount={async () => {
                                    if (window.confirm("DANGER: Are you sure you want to delete your account? This is irreversible.")) {
                                        // Delete user doc
                                        await deleteDoc(doc(db, "users", currentUser.id));
                                        // Sign out
                                        await signOut(auth);
                                        // window.location.reload();
                                    }
                                }}
                            />
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
            </div>
        </main>

        {/* Global Modals */}
        <NewBookingModal 
            isOpen={isNewBookingOpen}
            onClose={() => { setIsNewBookingOpen(false); setBookingPrefill(undefined); }}
            photographers={activePhotographers}
            accounts={accounts}
            bookings={bookings}
            clients={clients}
            config={config}
            onAddBooking={handleAddBooking}
            onAddClient={handleAddClient}
            initialData={bookingPrefill}
        />

        <ProjectDrawer 
            isOpen={!!selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
            booking={selectedBooking}
            photographer={users.find(u => u.id === selectedBooking?.photographerId)}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            bookings={bookings}
            config={config}
            packages={packages}
            currentUser={currentUser}
            assets={assets}
            users={users}
            transactions={transactions}
            onAddTransaction={handleRecordExpense}
            accounts={accounts}
        />

        <CommandPalette 
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={setCurrentView}
            clients={clients}
            bookings={bookings}
            assets={assets}
            onSelectBooking={setSelectedBookingId}
            currentUser={currentUser}
        />

        </div>
    </div>
  );
};

export default App;
