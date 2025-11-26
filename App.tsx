
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
import { User, Booking, Asset, Notification, Account, Transaction, Client, Package, StudioConfig, BookingTask, ActivityLog, PublicBookingSubmission, StudioRoom } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Info, AlertTriangle, Search, Database, CheckCheck, Trash, WifiOff, Cloud, ShieldAlert, ExternalLink, X, RefreshCcw, Plus, Loader2 } from 'lucide-react';
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
type PublicView = 'LANDING' | 'LOGIN' | 'REGISTER';

const PermissionErrorHelp = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-red-500 rounded-2xl p-8 max-w-3xl w-full shadow-2xl relative">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-red-500/20 rounded-full">
            <AlertTriangle className="text-red-500 w-8 h-8" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Setup Database Rules (SaaS Mode)</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
                Your app is now running in <strong>Multi-Tenant SaaS Mode</strong>. 
                You must update your Firestore Security Rules to isolate user data.
            </p>
        </div>
      </div>
      
      <div className="space-y-4">
          <p className="text-white font-bold text-sm">Copy this into Firebase Console > Firestore > Rules:</p>
          <div className="bg-black p-4 rounded-lg border border-gray-700 font-mono text-xs text-emerald-400 overflow-x-auto relative custom-scrollbar">
            <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isOwner() {
      return request.auth != null && request.resource.data.ownerId == request.auth.uid;
    }
    function isOwnerOfExisting() {
      return request.auth != null && resource.data.ownerId == request.auth.uid;
    }

    match /{collection}/{document=**} {
      allow create: if isOwner();
      allow read, update, delete: if isOwnerOfExisting();
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /studios/{studioId} {
      allow read, write: if request.auth != null && request.auth.uid == studioId;
    }
  }
}`}</pre>
          </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-800">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white font-bold text-sm transition-colors">Close & Retry</button>
        <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20">
          Open Console <ExternalLink size={16} />
        </a>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [publicView, setPublicView] = useState<PublicView>('LANDING');
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); 
  const [appMode, setAppMode] = useState<AppMode>('LAUNCHER');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('lumina_theme');
      return saved ? saved === 'dark' : true;
  });

  // GOOGLE INTEGRATION STATE - Persisted
  const [googleToken, setGoogleToken] = useState<string | null>(() => {
      return sessionStorage.getItem('lumina_google_token');
  });

  const updateGoogleToken = (token: string | null) => {
      setGoogleToken(token);
      if (token) {
          sessionStorage.setItem('lumina_google_token', token);
      } else {
          sessionStorage.removeItem('lumina_google_token');
      }
  };

  // Date State for Calendar & Dashboard
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal States
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{date:string, time:string, studio:string} | undefined>(undefined);

  // Data - Initialize with empty arrays to avoid showing dummy data in SaaS mode
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<StudioConfig>(INITIAL_CONFIG);

  // Derived Data
  const selectedBooking = bookings.find(b => b.id === selectedBookingId) || null;
  
  // STAFF LOGIC: The user list should come from the 'users' collection where ownerId matches current studio
  const activePhotographers = users.length > 0 ? users : [currentUser];

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
          const targetId = currentUser.studioId || currentUser.id;
          if (targetId) {
             await getDoc(doc(db, "studios", targetId));
          }
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
                      // First time login sync (if register view didn't catch it)
                      const newProfile = {
                          uid: firebaseUser.uid,
                          name: firebaseUser.displayName || 'Studio Owner',
                          email: firebaseUser.email || '',
                          role: 'OWNER',
                          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}`,
                          createdAt: new Date().toISOString(),
                          phone: '',
                          status: 'ACTIVE',
                          studioName: 'My Studio',
                          ownerId: firebaseUser.uid // Owns their own profile
                      };
                      try {
                        await setDoc(userDocRef, newProfile);
                      } catch(e) {
                          console.warn("Could not create user profile doc", e);
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
                      unavailableDates: userData.unavailableDates || [],
                      studioId: userData.studioId || userData.ownerId // Important for Team Access
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
              }
              setIsLoggedIn(true);
          } else {
              setIsLoggedIn(false);
          }
          setIsAuthChecking(false);
      });
      return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (!isLoggedIn || !currentUser.id) return;
      if (permissionError) return;

      if (isOfflineMode) {
          // Load offline fallback
          setBookings(loadState('bookings', []));
          setClients(loadState('clients', []));
          setAssets(loadState('assets', []));
          setTransactions(loadState('transactions', []));
          setPackages(loadState('packages', []));
          setAccounts(loadState('accounts', []));
          return;
      }

      // SAAS LOGIC: Determine the "Active Studio ID"
      // If I am an Owner, my studioId is my ID. 
      // If I am Staff, my studioId points to my Owner.
      const activeStudioId = currentUser.studioId || currentUser.id;

      // Filter queries by the Active Studio ID
      const q = (col: string) => query(collection(db, col), where("ownerId", "==", activeStudioId));

      // Global error handler for snapshots
      const handleSnapshotError = (err: any) => {
          console.error("Snapshot Error:", err);
          if (err.code === 'permission-denied') setPermissionError(true);
      };

      // 1. Config Sync (Per Studio)
      const unsubConfig = onSnapshot(doc(db, "studios", activeStudioId), (snapshot) => {
          if (snapshot.exists()) {
              setConfig(snapshot.data() as StudioConfig);
          } else {
              // Initialize default config for new SaaS user (Only if Owner)
              if (currentUser.role === 'OWNER') {
                  const initialConfigWithId = { ...INITIAL_CONFIG, ownerId: activeStudioId };
                  setDoc(doc(db, "studios", activeStudioId), initialConfigWithId);
                  setConfig(initialConfigWithId);
              }
          }
      }, handleSnapshotError);

      const unsubBookings = onSnapshot(q("bookings"), (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
          setBookings(data);
          localStorage.setItem('lumina_bookings', JSON.stringify(data));
      }, handleSnapshotError);

      const unsubClients = onSnapshot(q("clients"), (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Client));
          setClients(data);
          localStorage.setItem('lumina_clients', JSON.stringify(data));
      }, handleSnapshotError);

      const unsubAssets = onSnapshot(q("assets"), (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
          setAssets(data);
      }, handleSnapshotError);

      const unsubTransactions = onSnapshot(q("transactions"), (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
          setTransactions(data);
          localStorage.setItem('lumina_transactions', JSON.stringify(data));
      }, handleSnapshotError);

      const unsubPackages = onSnapshot(q("packages"), (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Package));
          
          // Seed default packages if empty (Only Owner)
          if (data.length === 0 && currentUser.role === 'OWNER') {
              INITIAL_PACKAGES.forEach(p => {
                  setDoc(doc(db, "packages", p.id), { ...p, ownerId: activeStudioId });
              });
          } else {
              setPackages(data);
          }
      }, handleSnapshotError);

      const unsubAccounts = onSnapshot(q("accounts"), (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Account));
          // Seed default accounts if empty (Only Owner)
          if (data.length === 0 && currentUser.role === 'OWNER') {
              INITIAL_ACCOUNTS.forEach(a => {
                  setDoc(doc(db, "accounts", a.id), { ...a, ownerId: activeStudioId });
              });
          } else {
              setAccounts(data);
          }
      }, handleSnapshotError);

      const unsubNotifications = onSnapshot(q("notifications"), (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
          setNotifications(data);
      }, handleSnapshotError);

      // Fetch Team Members (Users who belong to this studio)
      // Note: This assumes users are manually created with the correct ownerId/studioId
      const unsubUsers = onSnapshot(q("users"), (snapshot) => {
          const team = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
          // Always include self if not in list (e.g. owner might not be in 'users' query if ownerId matches differently, but here we align ownerId)
          const hasSelf = team.find(u => u.id === currentUser.id);
          if (!hasSelf) team.push(currentUser);
          setUsers(team);
      }, handleSnapshotError);

      return () => {
          unsubConfig();
          unsubBookings();
          unsubClients();
          unsubAssets();
          unsubTransactions();
          unsubPackages();
          unsubAccounts();
          unsubNotifications();
          unsubUsers();
      };
  }, [isLoggedIn, currentUser.id, isOfflineMode, permissionError]);

  // --- CRUD HANDLERS (SaaS Enabled) ---
  
  const getActiveOwnerId = () => currentUser.studioId || currentUser.id;

  const handleAddBooking = async (newBooking: Booking, paymentDetails?: { amount: number, accountId: string }) => {
      if (isOfflineMode) {
          alert("Cannot add bookings in offline mode.");
          return;
      }
      
      const batch = writeBatch(db);
      const ownerId = getActiveOwnerId();
      
      // 1. Create Booking with Owner ID
      const bookingRef = doc(db, "bookings", newBooking.id);
      batch.set(bookingRef, { ...newBooking, ownerId });

      // 2. Handle Payment (Atomic)
      if (paymentDetails && paymentDetails.amount > 0 && paymentDetails.accountId) {
          // Update Account Balance
          const accountRef = doc(db, "accounts", paymentDetails.accountId);
          batch.set(accountRef, { 
              balance: increment(paymentDetails.amount),
              ownerId // Ensure ownerId is set if creating
          }, { merge: true });

          // Create Transaction Record
          const transactionRef = doc(db, "transactions", `t-${Date.now()}`);
          const transaction: Transaction = {
              id: transactionRef.id,
              date: new Date().toISOString(),
              description: `Booking Deposit - ${newBooking.clientName}`,
              amount: paymentDetails.amount,
              type: 'INCOME',
              accountId: paymentDetails.accountId,
              category: 'Sales / Booking',
              status: 'COMPLETED',
              bookingId: newBooking.id,
              ownerId
          };
          batch.set(transactionRef, transaction);
      }

      try {
          await batch.commit();
          setNotifications(prev => [{id: `n-${Date.now()}`, title: 'Booking Created', message: `New session for ${newBooking.clientName}`, time: 'Just now', read: false, type: 'SUCCESS'}, ...prev]);
      } catch (e) {
          console.error("Error adding booking:", e);
          alert("Failed to save booking. Please check your connection.");
      }
  };

  const handleAddClient = async (newClient: Client) => {
      try {
          await setDoc(doc(db, "clients", newClient.id), { ...newClient, ownerId: getActiveOwnerId() });
      } catch (e) {
          console.error("Error adding client:", e);
      }
  };

  const handleAddAsset = async (newAsset: Asset) => {
      try {
          await setDoc(doc(db, "assets", newAsset.id), { ...newAsset, ownerId: getActiveOwnerId() });
      } catch (e) {
          console.error("Error adding asset:", e);
      }
  };

  const handleAddTransaction = async (newTransactionData: { description: string; amount: number; category: string; accountId: string; bookingId?: string }) => {
      const batch = writeBatch(db);
      const ownerId = getActiveOwnerId();
      
      // 1. Create Transaction
      const tId = `t-${Date.now()}`;
      const tRef = doc(db, "transactions", tId);
      const newTransaction: Transaction = {
          id: tId,
          date: new Date().toISOString(),
          description: newTransactionData.description,
          amount: newTransactionData.amount,
          type: 'EXPENSE',
          accountId: newTransactionData.accountId,
          category: newTransactionData.category,
          status: 'COMPLETED',
          bookingId: newTransactionData.bookingId,
          ownerId
      };
      batch.set(tRef, newTransaction);

      // 2. Deduct from Account
      const accRef = doc(db, "accounts", newTransactionData.accountId);
      batch.set(accRef, { 
          balance: increment(-newTransactionData.amount) 
      }, { merge: true });

      await batch.commit();
  };

  const handleUpdateConfig = async (newConfig: StudioConfig) => {
      setConfig(newConfig);
      if (!isOfflineMode) {
          try {
              const ownerId = getActiveOwnerId();
              await setDoc(doc(db, "studios", ownerId), { ...newConfig, ownerId });
          } catch (e: any) {
              console.error("Config Update Error:", e);
              alert("Failed to save settings. " + e.message);
          }
      }
  };

  const handleUpdateBooking = async (updatedBooking: Booking) => {
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      if (!isOfflineMode) {
          try {
              await updateDoc(doc(db, "bookings", updatedBooking.id), updatedBooking as any);
          } catch (e) {
              console.error("Error updating booking:", e);
          }
      }
  };

  const createDeleteHandler = (collectionName: string, stateSetter: React.Dispatch<React.SetStateAction<any[]>>) => {
      return async (id: string) => {
          stateSetter(prev => prev.filter(item => item.id !== id));
          if (!isOfflineMode) {
              try {
                  await deleteDoc(doc(db, collectionName, id));
              } catch (e: any) {
                  console.error(`Error deleting from ${collectionName}:`, e);
                  alert(`Failed to delete from server: ${e.message}`);
              }
          }
      };
  };

  const handleSafeDeleteTransaction = async (id: string) => {
      if (isOfflineMode) {
          alert("Cannot delete transactions offline (requires atomic rollback).");
          return;
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
      try {
          const batch = writeBatch(db);
          const tRef = doc(db, "transactions", id);
          const transaction = transactions.find(t => t.id === id);
          
          if (!transaction) {
              const snap = await getDoc(tRef);
              if(!snap.exists()) return; 
              return; 
          }

          const accRef = doc(db, "accounts", transaction.accountId);
          const reverseAmount = transaction.type === 'INCOME' ? -transaction.amount : transaction.amount; 
          batch.update(accRef, { balance: increment(reverseAmount) });

          if (transaction.bookingId && transaction.type === 'INCOME') {
              const bookingRef = doc(db, "bookings", transaction.bookingId);
              batch.update(bookingRef, { paidAmount: increment(-transaction.amount) });
          }

          batch.delete(tRef);
          await batch.commit();
      } catch (e: any) {
          console.error("Error deleting transaction:", e);
          alert("Failed to reverse transaction. Please refresh and try again.");
      }
  };

  const handleDeleteBooking = createDeleteHandler("bookings", setBookings);
  const handleDeleteClient = createDeleteHandler("clients", setClients);
  const handleDeleteAsset = createDeleteHandler("assets", setAssets);
  const handleDeleteTransaction = handleSafeDeleteTransaction;
  // Packages now use Soft Delete in SettingsView, but we keep this for hard delete if needed
  const handleDeletePackage = createDeleteHandler("packages", setPackages);
  const handleDeleteUser = createDeleteHandler("users", setUsers);

  const handleUpdateClient = async (client: Client) => {
      if(!isOfflineMode) await updateDoc(doc(db, "clients", client.id), client as any);
  };
  const handleUpdateAsset = async (asset: Asset) => {
      if(!isOfflineMode) await updateDoc(doc(db, "assets", asset.id), asset as any);
  };
  const handleUpdatePackage = async (pkg: Package) => {
      if(!isOfflineMode) await updateDoc(doc(db, "packages", pkg.id), pkg as any);
  };
  const handleAddPackage = async (pkg: Package) => {
      if(!isOfflineMode) await setDoc(doc(db, "packages", pkg.id), { ...pkg, ownerId: getActiveOwnerId() });
  };
  
  const handleSettleBooking = async (bookingId: string, amount: number, accountId: string) => {
      const batch = writeBatch(db);
      const ownerId = getActiveOwnerId();
      
      const bookingRef = doc(db, "bookings", bookingId);
      batch.update(bookingRef, { 
          paidAmount: increment(amount),
          status: amount > 0 ? 'COMPLETED' : 'BOOKED'
      });

      const accountRef = doc(db, "accounts", accountId);
      batch.set(accountRef, { balance: increment(amount) }, { merge: true });

      const tId = `t-${Date.now()}`;
      const tRef = doc(db, "transactions", tId);
      batch.set(tRef, {
          id: tId,
          date: new Date().toISOString(),
          description: `Settlement for Booking #${bookingId.substring(0,4)}`,
          amount: amount,
          type: amount >= 0 ? 'INCOME' : 'EXPENSE', 
          accountId: accountId,
          category: 'Sales / Settlement',
          status: 'COMPLETED',
          bookingId: bookingId,
          ownerId
      });

      await batch.commit();
  };

  const handleLogout = async () => {
      await signOut(auth);
      setIsLoggedIn(false);
      setPublicView('LOGIN');
      setBookings([]);
      setClients([]);
      setAssets([]);
      setTransactions([]);
  };

  const toggleTheme = () => {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      localStorage.setItem('lumina_theme', newTheme ? 'dark' : 'light');
      if (newTheme) {
          document.documentElement.classList.remove('light-mode');
      } else {
          document.documentElement.classList.add('light-mode');
      }
  };
  
  useEffect(() => {
      if (!isDarkMode) document.documentElement.classList.add('light-mode');
  }, []);

  if (isAuthChecking) {
      return (
          <div className="min-h-screen bg-lumina-base flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-lumina-accent animate-spin" />
          </div>
      );
  }

  if (!isLoggedIn) {
      if (publicView === 'LOGIN') {
          return <LoginView users={USERS} onLogin={() => {}} onRegisterLink={() => setPublicView('REGISTER')} onHome={() => setPublicView('LANDING')} />;
      }
      if (publicView === 'REGISTER') {
          return <RegisterView onLoginLink={() => setPublicView('LOGIN')} onRegisterSuccess={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} onHome={() => setPublicView('LANDING')} />;
      }
      // Default to Landing Page
      return <LandingPageView onLogin={() => setPublicView('LOGIN')} onRegister={() => setPublicView('REGISTER')} />;
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
                alert("Booking received! In a real app, this would save to Firestore.");
            }}
        />
      );
  }

  return (
    <div className="flex h-screen bg-lumina-base text-lumina-text font-sans overflow-hidden transition-colors duration-300">
      {permissionError && <PermissionErrorHelp onClose={checkConnection} />}
      
      <Sidebar 
        currentUser={currentUser} 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
        onSwitchApp={() => setAppMode('LAUNCHER')}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-8 overflow-hidden flex flex-col relative h-screen">
        
        {isOfflineMode && (
            <div className="absolute top-0 left-0 right-0 bg-amber-500/90 text-black text-xs font-bold text-center py-1 z-50 flex items-center justify-center gap-2">
                <WifiOff size={12} /> OFFLINE MODE - Changes saved locally
                <button onClick={checkConnection} className="underline ml-2">Retry</button>
            </div>
        )}

        <div className="flex justify-between items-center mb-6 lg:hidden">
             <div className="font-display font-bold text-xl">LUMINA</div>
        </div>

        <div className="flex-1 overflow-hidden relative h-full">
            <AnimatePresence mode="wait">
                <Motion.div 
                    key={currentView}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    {currentView === 'dashboard' && (
                        <DashboardView 
                            user={currentUser} 
                            bookings={bookings} 
                            transactions={transactions}
                            onSelectBooking={(id) => { setSelectedBookingId(id); setIsCommandPaletteOpen(false); }}
                            selectedDate={viewDate}
                            onNavigate={setCurrentView}
                            config={config}
                        />
                    )}
                    {currentView === 'calendar' && (
                        <CalendarView 
                            bookings={bookings} 
                            currentDate={viewDate}
                            users={activePhotographers}
                            rooms={config.rooms}
                            onDateChange={setViewDate}
                            onNewBooking={(prefill) => { setBookingPrefill(prefill); setIsNewBookingOpen(true); }}
                            onSelectBooking={setSelectedBookingId}
                            googleToken={googleToken}
                        />
                    )}
                    {currentView === 'production' && (
                        <ProductionView 
                            bookings={bookings} 
                            onSelectBooking={setSelectedBookingId}
                            currentUser={currentUser}
                            onUpdateBooking={handleUpdateBooking}
                            config={config}
                        />
                    )}
                    {currentView === 'inventory' && (
                        <InventoryView 
                            assets={assets} 
                            users={activePhotographers}
                            onAddAsset={handleAddAsset}
                            onUpdateAsset={handleUpdateAsset}
                            onDeleteAsset={handleDeleteAsset}
                        />
                    )}
                    {currentView === 'finance' && (
                        <FinanceView 
                            accounts={accounts}
                            metrics={[]} 
                            bookings={bookings}
                            users={activePhotographers}
                            transactions={transactions}
                            config={config}
                            onTransfer={(from, to, amt) => {
                                const batch = writeBatch(db);
                                batch.set(doc(db, "accounts", from), { balance: increment(-amt) }, { merge: true });
                                batch.set(doc(db, "accounts", to), { balance: increment(amt) }, { merge: true });
                                const ownerId = getActiveOwnerId();
                                batch.set(doc(db, "transactions", `t-${Date.now()}`), {
                                    id: `t-${Date.now()}`,
                                    date: new Date().toISOString(),
                                    description: 'Internal Transfer',
                                    amount: amt,
                                    type: 'TRANSFER',
                                    accountId: from,
                                    relatedAccountId: to,
                                    category: 'Transfer',
                                    status: 'COMPLETED',
                                    ownerId
                                });
                                batch.commit();
                            }}
                            onRecordExpense={handleAddTransaction}
                            onSettleBooking={handleSettleBooking}
                            onDeleteTransaction={handleDeleteTransaction}
                        />
                    )}
                    {currentView === 'clients' && (
                        <ClientsView 
                            clients={clients}
                            bookings={bookings}
                            config={config}
                            onAddClient={handleAddClient}
                            onUpdateClient={handleUpdateClient}
                            onDeleteClient={handleDeleteClient}
                            onSelectBooking={setSelectedBookingId}
                        />
                    )}
                    {currentView === 'team' && (
                        <TeamView 
                            users={activePhotographers}
                            bookings={bookings}
                            onAddUser={(u) => {
                                const ownerId = getActiveOwnerId();
                                // Create user and assign ownerId so they show up in this team
                                setDoc(doc(db, "users", u.id), { 
                                    ...u, 
                                    ownerId,
                                    studioId: ownerId // Essential for them to see data when they login
                                }); 
                            }}
                            onUpdateUser={(u) => updateDoc(doc(db, "users", u.id), u as any)}
                            onDeleteUser={handleDeleteUser}
                        />
                    )}
                    {currentView === 'settings' && (
                        <SettingsView 
                            packages={packages}
                            config={config}
                            onAddPackage={handleAddPackage}
                            onUpdatePackage={handleUpdatePackage}
                            onDeletePackage={handleDeletePackage}
                            onUpdateConfig={handleUpdateConfig}
                            bookings={bookings}
                            currentUser={currentUser}
                            googleToken={googleToken}
                            setGoogleToken={updateGoogleToken}
                            onUpdateUserProfile={async (u) => {
                                await updateDoc(doc(db, "users", u.id), u as any);
                                setCurrentUser(prev => ({ ...prev, ...u }));
                            }}
                            onDeleteAccount={async () => {
                                if(window.confirm("WARNING: This will delete your account and ALL data permanently. Are you sure?")) {
                                    alert("Account deletion request sent. (Simulation)");
                                }
                            }}
                        />
                    )}
                    {currentView === 'analytics' && (
                        <AnalyticsView 
                            bookings={bookings}
                            packages={packages}
                            transactions={transactions}
                        />
                    )}
                </Motion.div>
            </AnimatePresence>
        </div>

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
            googleToken={googleToken}
        />

        <ProjectDrawer 
            isOpen={!!selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
            booking={selectedBooking}
            photographer={activePhotographers.find(p => p.id === selectedBooking?.photographerId)}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            bookings={bookings}
            config={config}
            packages={packages}
            currentUser={currentUser}
            assets={assets}
            users={activePhotographers}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            accounts={accounts}
            googleToken={googleToken}
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

        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsNewBookingOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-lumina-accent text-lumina-base rounded-full shadow-2xl flex items-center justify-center z-40 hover:shadow-lumina-accent/50 border-2 border-white/20"
        >
            <Plus size={28} />
        </motion.button>

      </main>
    </div>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default App;
