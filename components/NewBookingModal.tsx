

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Account, Booking, ProjectStatus, Client, StudioRoom, StudioConfig, BookingItem, Discount } from '../types';
import { PACKAGES } from '../data';
import { X, Calendar, Clock, User as UserIcon, Camera, CreditCard, AlertCircle, Search, ChevronDown, Plus, Briefcase, Timer, AlertTriangle, ShieldCheck, Tag, HelpCircle, Star, History } from 'lucide-react';

const Motion = motion as any;

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographers: User[];
  accounts: Account[];
  bookings?: Booking[]; 
  clients?: Client[]; 
  config: StudioConfig; 
  onAddBooking?: (booking: Booking, paymentDetails?: { amount: number, accountId: string }) => void;
  onAddClient?: (client: Client) => void; 
  initialData?: { date: string, time: string, studio: string };
}

const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose, photographers, accounts, bookings = [], clients = [], config, onAddBooking, onAddClient, initialData }) => {
  const [formData, setFormData] = useState({
      clientName: '',
      clientPhone: '',
      date: '',
      timeStart: '',
      package: '',
      price: 0, 
      durationMinutes: 60, 
      studio: '', 
      photographerId: '',
      amountPaid: 0,
      paymentAccount: accounts[0]?.id
  });

  const [isLead, setIsLead] = useState(false); 
  const [discount, setDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });

  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); 

  const [error, setError] = useState<string | null>(null);
  const [softConflictWarning, setSoftConflictWarning] = useState<string | null>(null); 
  const [problematicWarning, setProblematicWarning] = useState<string | null>(null);
  const [adminOverride, setAdminOverride] = useState(false); 
  const [softBookingOverride, setSoftBookingOverride] = useState(false); 
  
  const BUFFER_MINUTES = config.bufferMinutes || 15; 
  const studios = config.rooms || [];

  // Filter Active Packages Only
  const activePackages = PACKAGES.filter(p => p.active && !p.archived);

  useEffect(() => {
      if (isOpen) {
          const defaultPkg = activePackages[0];
          const defaultPrice = defaultPkg ? defaultPkg.price : 0;
          // Auto-calc DP on open
          const dpPercentage = config.requiredDownPaymentPercentage || 50;
          const initialDP = defaultPrice * (dpPercentage / 100);

          if (initialData) {
              setFormData(prev => ({
                  ...prev,
                  date: initialData.date,
                  timeStart: initialData.time,
                  studio: initialData.studio,
                  package: defaultPkg ? defaultPkg.name : '',
                  price: defaultPrice,
                  durationMinutes: defaultPkg ? defaultPkg.duration * 60 : 60,
                  amountPaid: initialDP
              }));
          } else {
              setFormData(prev => ({
                 ...prev,
                 date: new Date().toISOString().split('T')[0],
                 timeStart: '10:00',
                 studio: studios[0]?.name || '',
                 package: defaultPkg ? defaultPkg.name : '',
                 price: defaultPrice,
                 durationMinutes: defaultPkg ? defaultPkg.duration * 60 : 60,
                 amountPaid: initialDP
              }));
          }
          setClientSearch('');
          setSelectedClient(null);
          setError(null);
          setProblematicWarning(null);
          setSoftConflictWarning(null);
          setAdminOverride(false);
          setSoftBookingOverride(false);
          setDiscount({ type: 'FIXED', value: 0 });
          setIsLead(false);
      }
  }, [isOpen, initialData, studios]);

  useEffect(() => {
      if (formData.clientName) {
          const matchedClient = clients.find(c => c.name.toLowerCase() === formData.clientName.toLowerCase());
          if (matchedClient) {
              setSelectedClient(matchedClient);
              if (matchedClient.category === 'PROBLEMATIC') {
                  setProblematicWarning(`WARNING: This client is flagged as PROBLEMATIC.\nNote: "${matchedClient.notes}"`);
              } else {
                  setProblematicWarning(null);
                  setAdminOverride(false); 
              }
          } else {
              setSelectedClient(null);
              setProblematicWarning(null);
              setAdminOverride(false);
          }
      } else {
          setSelectedClient(null);
          setProblematicWarning(null);
          setAdminOverride(false);
      }
  }, [formData.clientName, clients]);

  const handlePackageChange = (pkgName: string) => {
      const pkg = activePackages.find(p => p.name === pkgName);
      const newPrice = pkg ? pkg.price : formData.price;
      
      // Auto-Calculate DP based on config policy
      const dpPercentage = config.requiredDownPaymentPercentage || 50;
      const newDP = newPrice * (dpPercentage / 100);

      setFormData(prev => ({
          ...prev,
          package: pkgName,
          price: newPrice,
          durationMinutes: pkg ? pkg.duration * 60 : prev.durationMinutes,
          amountPaid: newDP
      }));
  };

  const checkConflict = (): { type: 'ROOM' | 'PHOTOGRAPHER' | 'HOURS' | 'CLIENT', message: string, isSoft?: boolean } | null => {
      if (!formData.date || !formData.timeStart) return null;
      
      const newDurationMins = formData.durationMinutes;
      
      const [startH, startM] = formData.timeStart.split(':').map(Number);
      const newStartTime = startH * 60 + startM;
      const newEndTime = newStartTime + newDurationMins;
      
      // Dynamic Hours from Config
      const [openH, openM] = (config.operatingHoursStart || "09:00").split(':').map(Number);
      const [closeH, closeM] = (config.operatingHoursEnd || "21:00").split(':').map(Number);
      
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;

      if (newStartTime < openTime || newEndTime > closeTime) {
          return { 
              type: 'HOURS', 
              message: `Booking is outside operating hours (${config.operatingHoursStart} - ${config.operatingHoursEnd}).` 
          };
      }

      if (formData.photographerId) {
          const staff = photographers.find(p => p.id === formData.photographerId);
          if (staff && staff.unavailableDates && staff.unavailableDates.includes(formData.date)) {
              return {
                  type: 'PHOTOGRAPHER',
                  message: `Staff Conflict! ${staff.name} is unavailable (Off-day) on ${formData.date}.`
              };
          }
      }

      for (const b of bookings) {
          if (b.date !== formData.date) continue;
          if (b.status === 'CANCELLED') continue;

          const [bStartH, bStartM] = b.timeStart.split(':').map(Number);
          const bStartTime = bStartH * 60 + bStartM;
          const bEndTime = bStartTime + (b.duration * 60);

          // Improved Buffer Logic: Only add buffer after a session (Cleanup Time)
          // Avoid double-sided buffer which wastes time slots
          const bEndWithBuffer = bEndTime + BUFFER_MINUTES;

          // Conflict Formula: (StartA < EndB) and (EndA > StartB)
          // My Start < Their End (with buffer) AND My End > Their Start
          const isOverlapping = (newStartTime < bEndWithBuffer) && (newEndTime > bStartTime);

          if (isOverlapping) {
              const isSoftConflict = b.status === 'INQUIRY';

              if (b.studio === formData.studio) {
                  return {
                      type: 'ROOM',
                      message: `Studio Conflict! ${b.studio} is booked by ${b.clientName} (${b.timeStart} - ${formatTime(bEndTime)} + buffer). ${isSoftConflict ? 'Existing booking is just an Inquiry.' : ''}`,
                      isSoft: isSoftConflict
                  };
              }
              
              if (formData.photographerId && b.photographerId === formData.photographerId) {
                  const photographerName = photographers.find(p => p.id === formData.photographerId)?.name || 'Photographer';
                  return {
                      type: 'PHOTOGRAPHER',
                      message: `Staff Conflict! ${photographerName} is already shooting for ${b.clientName} in ${b.studio} at this time.`,
                      isSoft: isSoftConflict
                  };
              }

              const isSamePhone = (b.clientPhone || '').replace(/\D/g,'') === (formData.clientPhone || '').replace(/\D/g,'');
              const isSameName = b.clientName.toLowerCase() === formData.clientName.toLowerCase();
              
              if ((isSamePhone && (formData.clientPhone || '').length > 5) || isSameName) {
                   return {
                      type: 'CLIENT',
                      message: `Client Conflict! ${b.clientName} is already booked at ${b.timeStart} in ${b.studio}. Impossible to be in two places.`
                   };
              }
          }
      }

      return null;
  };

  const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSoftConflictWarning(null);

      if (problematicWarning && !adminOverride) {
          setError("Client is flagged as PROBLEMATIC. Booking blocked by system policy.");
          return;
      }

      const conflict = checkConflict();
      if (conflict) {
          if (conflict.isSoft) {
              if (!softBookingOverride) {
                  setSoftConflictWarning(`SOFT CONFLICT: ${conflict.message}\nYou can override this because the existing booking is only an Inquiry.`);
                  return;
              }
          } else {
              setError(conflict.message);
              return;
          }
      }
      
      if (!formData.studio) {
          setError("Please select a studio room.");
          return;
      }

      if(onAddBooking) {
          const initialItems: BookingItem[] = [
              {
                  id: `item-${Date.now()}`,
                  description: `${formData.package} (${formData.durationMinutes / 60}h)`,
                  quantity: 1,
                  unitPrice: Number(formData.price),
                  total: Number(formData.price)
              }
          ];
          
          const selectedPackage = activePackages.find(p => p.name === formData.package);
          const costSnapshot = selectedPackage ? [...selectedPackage.costBreakdown] : [];

          let safePhotographerId = formData.photographerId;
          if (!safePhotographerId && photographers.length > 0) {
              safePhotographerId = photographers[0].id;
          }
          if (!safePhotographerId) safePhotographerId = ''; 

          let finalClientId = selectedClient?.id;
          
          if (!finalClientId && formData.clientName) {
              const newClient: Client = {
                  id: `c-${Date.now()}`,
                  name: formData.clientName,
                  phone: formData.clientPhone,
                  email: '', 
                  category: 'NEW',
                  notes: 'Auto-created from booking',
                  joinedDate: new Date().toISOString().split('T')[0],
                  avatar: `https://ui-avatars.com/api/?name=${formData.clientName}&background=random`
              };
              
              if (onAddClient) {
                  onAddClient(newClient);
                  finalClientId = newClient.id;
              }
          }

          const newBooking: Booking = {
              id: `b-${Date.now()}`,
              clientName: formData.clientName,
              clientPhone: formData.clientPhone,
              date: formData.date,
              timeStart: formData.timeStart,
              duration: formData.durationMinutes / 60, 
              package: formData.package,
              price: Number(formData.price), 
              paidAmount: Number(formData.amountPaid),
              status: isLead ? 'INQUIRY' : 'BOOKED', 
              photographerId: safePhotographerId,
              studio: formData.studio,
              contractStatus: 'PENDING',
              items: initialItems,
              discount: discount, 
              comments: [],
              timeLogs: [],
              costSnapshot: costSnapshot,
              taxSnapshot: config.taxRate, 
              clientId: finalClientId 
          };
          
          if (newBooking.clientId === undefined) {
              delete newBooking.clientId;
          }

          onAddBooking(newBooking, { 
              amount: Number(formData.amountPaid), 
              accountId: formData.paymentAccount 
          });
          onClose();
          setFormData(prev => ({
            ...prev,
            clientName: '',
            clientPhone: '',
            amountPaid: 0
          }));
          setClientSearch('');
      }
  };

  const filteredClients = clientSearch.length > 0 
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())) 
    : [];

  const selectClient = (client: Client) => {
      setFormData(prev => ({
          ...prev,
          clientName: client.name,
          clientPhone: client.phone
      }));
      setClientSearch(client.name);
      setShowClientSuggestions(false);
  };
  
  const quickCreateClient = () => {
      setFormData(prev => ({ ...prev, clientName: clientSearch }));
      setShowClientSuggestions(false);
  };

  const calculateFinal = () => {
      const base = formData.price;
      const discountAmount = discount.type === 'PERCENT' ? base * (discount.value/100) : discount.value;
      const afterDiscount = Math.max(0, base - discountAmount);
      return afterDiscount;
  }
  
  const getClientStats = () => {
      if (!selectedClient) return null;
      const history = bookings.filter(b => b.clientId === selectedClient.id);
      const totalSpend = history.reduce((acc, b) => acc + b.price, 0);
      return { count: history.length, totalSpend };
  }
  const clientStats = getClientStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <Motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-lumina-surface border border-lumina-highlight w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="p-6 border-b border-lumina-highlight flex justify-between items-center bg-lumina-base">
          <div>
              <h2 className="text-2xl font-display font-bold text-white">New Booking</h2>
              <p className="text-xs text-lumina-muted">Fill in the details below.</p>
          </div>
          <button onClick={onClose} className="text-lumina-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
                <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle className="text-red-500 w-5 h-5 shrink-0" />
                    <p className="text-sm text-red-200 font-medium">{error}</p>
                </Motion.div>
            )}

            {softConflictWarning && (
                <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-500 w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-blue-200 font-bold">SOFT CONFLICT (INQUIRY)</p>
                            <p className="text-xs text-blue-200/80 whitespace-pre-wrap">{softConflictWarning}</p>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-500/20 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={softBookingOverride} 
                            onChange={e => setSoftBookingOverride(e.target.checked)}
                            className="w-4 h-4 rounded bg-lumina-base border-blue-500/50 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-blue-100 uppercase">Force Booking (Double Book)</span>
                    </label>
                </Motion.div>
            )}

            {problematicWarning && (
                <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-200 font-bold">CLIENT ALERT</p>
                            <p className="text-xs text-amber-200/80 whitespace-pre-wrap">{problematicWarning}</p>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-500/20 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={adminOverride} 
                            onChange={e => setAdminOverride(e.target.checked)}
                            className="w-4 h-4 rounded bg-lumina-base border-amber-500/50 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-amber-100 uppercase">I acknowledge the risk (Admin Override)</span>
                    </label>
                </Motion.div>
            )}
            
            <div className="flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer bg-lumina-highlight/30 p-2 rounded-lg border border-lumina-highlight/50">
                    <span className={`text-xs font-bold uppercase ${isLead ? 'text-emerald-400' : 'text-lumina-muted'}`}>
                        {isLead ? 'Save as Inquiry (Lead)' : 'Save as Confirmed Booking'}
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isLead} onChange={e => setIsLead(e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-lumina-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </div>
                </label>
            </div>

            <section className="space-y-4">
               <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider flex items-center">
                 <UserIcon size={14} className="mr-2" /> Client Information
               </h3>
               
               <AnimatePresence>
                   {selectedClient && clientStats && (
                       <Motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gradient-to-r from-lumina-highlight/20 to-lumina-base border border-lumina-highlight rounded-xl p-3 flex justify-between items-center"
                       >
                           <div className="flex items-center gap-3">
                               <img src={selectedClient.avatar} className="w-10 h-10 rounded-full border border-lumina-highlight" />
                               <div>
                                   <div className="flex items-center gap-2">
                                       <span className="text-sm font-bold text-white">{selectedClient.name}</span>
                                       <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase
                                           ${selectedClient.category === 'VIP' ? 'bg-amber-500/20 text-amber-400' : 
                                             selectedClient.category === 'NEW' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}
                                       `}>
                                           {selectedClient.category}
                                       </span>
                                   </div>
                                   <div className="flex items-center gap-3 text-xs text-lumina-muted mt-0.5">
                                       <span className="flex items-center gap-1"><Star size={10} /> {clientStats.totalSpend > 5000000 ? 'High Value' : 'Standard'}</span>
                                       <span className="flex items-center gap-1"><History size={10} /> {clientStats.count} Visits</span>
                                   </div>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-[10px] text-lumina-muted uppercase">Lifetime Value</p>
                               <p className="text-sm font-mono font-bold text-emerald-400">Rp {clientStats.totalSpend.toLocaleString('id-ID', { notation: "compact" })}</p>
                           </div>
                       </Motion.div>
                   )}
               </AnimatePresence>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative">
                   <label className="block text-xs text-lumina-muted mb-1.5">Client Name (Search existing)</label>
                   <div className="relative">
                       <input 
                        required
                        type="text" 
                        className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-lumina-accent" 
                        placeholder="Type to search..." 
                        value={formData.clientName}
                        onChange={e => {
                            setFormData({...formData, clientName: e.target.value});
                            setClientSearch(e.target.value);
                            setShowClientSuggestions(true);
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                       />
                       <AnimatePresence>
                           {showClientSuggestions && clientSearch.length > 0 && (
                               <Motion.div 
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="absolute top-full left-0 right-0 mt-1 bg-lumina-surface border border-lumina-highlight rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto"
                               >
                                   {filteredClients.length > 0 ? (
                                       filteredClients.map(client => (
                                           <div 
                                            key={client.id}
                                            onClick={() => selectClient(client)}
                                            className="px-3 py-2 hover:bg-lumina-highlight cursor-pointer flex justify-between items-center"
                                           >
                                               <span className="text-sm text-white font-bold">{client.name}</span>
                                               <span className="text-xs text-lumina-muted flex items-center gap-2">
                                                   {client.category === 'PROBLEMATIC' && <AlertTriangle size={12} className="text-amber-500" />}
                                                   {client.phone}
                                               </span>
                                           </div>
                                       ))
                                   ) : (
                                       <div 
                                           onClick={quickCreateClient}
                                           className="px-3 py-2 hover:bg-lumina-highlight cursor-pointer text-sm text-lumina-accent flex items-center gap-2"
                                       >
                                           <Plus size={14} /> Use "{clientSearch}" (New Client)
                                       </div>
                                   )}
                               </Motion.div>
                           )}
                       </AnimatePresence>
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-lumina-muted mb-1.5">Phone Number</label>
                   <input 
                    required
                    type="text" 
                    className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-lumina-accent" 
                    placeholder="08..." 
                    value={formData.clientPhone}
                    onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                   />
                 </div>
               </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-lumina-highlight/50">
               <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider flex items-center">
                 <Calendar size={14} className="mr-2" /> Session Details
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="md:col-span-2">
                   <label className="block text-xs text-lumina-muted mb-1.5">Date</label>
                   <input 
                    required
                    type="date" 
                    className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-lumina-accent" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-xs text-lumina-muted mb-1.5">Start Time</label>
                   <input 
                    required
                    type="time" 
                    className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-lumina-accent" 
                    value={formData.timeStart}
                    onChange={e => setFormData({...formData, timeStart: e.target.value})}
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs text-lumina-muted mb-1.5">Package</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-lumina-accent appearance-none truncate"
                            value={formData.package}
                            onChange={e => handlePackageChange(e.target.value)}
                        >
                            {activePackages.length > 0 ? activePackages.map(pkg => (
                                <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
                            )) : <option value="">No active packages</option>}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="block text-xs text-lumina-muted mb-1.5 flex items-center gap-1">
                        <Timer size={10} /> Duration (Mins)
                    </label>
                    <input 
                        type="number"
                        min="5"
                        step="5"
                        className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-lumina-accent"
                        value={formData.durationMinutes}
                        onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})}
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs text-lumina-muted mb-1.5">Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-lumina-muted text-xs font-bold">Rp</span>
                        <input 
                            type="number"
                            className="w-full bg-lumina-base border border-lumina-highlight rounded-lg pl-8 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-lumina-accent"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        />
                    </div>
                  </div>
               </div>
               
               <div>
                 <label className="block text-xs text-lumina-muted mb-1.5">Studio Room</label>
                 <select 
                     required
                     className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-lumina-accent"
                     value={formData.studio}
                     onChange={e => setFormData({...formData, studio: e.target.value})}
                 >
                     {studios.length > 0 ? studios.map(room => (
                         <option key={room.id} value={room.name}>{room.name} ({room.type})</option>
                     )) : <option value="">No studios configured</option>}
                 </select>
               </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-lumina-highlight/50">
               <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider flex items-center">
                 <Briefcase size={14} className="mr-2" /> Staff Assignment
               </h3>
               <div>
                  <label className="block text-xs text-lumina-muted mb-1.5">Assign Photographer</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {photographers.map(p => {
                          const isAvailable = p.status === 'ACTIVE';
                          const isBlocked = p.unavailableDates && p.unavailableDates.includes(formData.date);
                          const isDisabled = !isAvailable || isBlocked;
                          
                          return (
                            <label key={p.id} className={`cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="photographer" 
                                    className="peer sr-only" 
                                    checked={formData.photographerId === p.id}
                                    onChange={() => !isDisabled && setFormData({...formData, photographerId: p.id})}
                                    disabled={isDisabled}
                                />
                                <div className={`flex items-center p-2 rounded-lg border bg-lumina-base transition-all
                                    ${isDisabled 
                                        ? 'border-lumina-highlight bg-lumina-surface' 
                                        : 'border-lumina-highlight hover:border-lumina-accent peer-checked:bg-lumina-accent/10 peer-checked:border-lumina-accent'}
                                `}>
                                    <img src={p.avatar} className="w-8 h-8 rounded-full mr-2 border border-lumina-highlight" />
                                    <div>
                                        <span className="text-sm text-white block">{p.name.split(' ')[0]}</span>
                                        {p.status === 'ON_LEAVE' && <span className="text-[9px] text-amber-400 uppercase font-bold">On Leave</span>}
                                        {p.status === 'INACTIVE' && <span className="text-[9px] text-red-400 uppercase font-bold">Inactive</span>}
                                        {isBlocked && <span className="text-[9px] text-amber-400 uppercase font-bold block">Off Day</span>}
                                    </div>
                                </div>
                            </label>
                          );
                      })}
                  </div>
               </div>
            </section>

             <section className="space-y-4 pt-4 border-t border-lumina-highlight/50">
               <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider flex items-center">
                 <CreditCard size={14} className="mr-2" /> Financials
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="block text-xs text-lumina-muted mb-1.5 flex items-center gap-1">
                          Amount Paid (DP) 
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                              {config.requiredDownPaymentPercentage || 50}% Req
                          </span>
                      </label>
                      <div className="relative">
                          <span className="absolute left-3 top-2.5 text-lumina-muted font-bold">Rp</span>
                          <input 
                            type="number" 
                            className="w-full bg-lumina-base border border-lumina-highlight rounded-lg pl-10 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-lumina-accent" 
                            placeholder="0" 
                            value={formData.amountPaid}
                            onChange={e => setFormData({...formData, amountPaid: Number(e.target.value)})}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs text-lumina-muted mb-1.5 flex items-center gap-1"><Tag size={10}/> Discount</label>
                      <div className="flex">
                           <input 
                             type="number"
                             className="w-full bg-lumina-base border border-lumina-highlight rounded-l-lg pl-3 pr-1 py-2.5 text-white font-mono focus:outline-none focus:border-lumina-accent"
                             value={discount.value}
                             onChange={e => setDiscount({...discount, value: Number(e.target.value)})}
                           />
                           <select 
                             className="bg-lumina-highlight border border-lumina-highlight rounded-r-lg px-2 text-xs text-white outline-none"
                             value={discount.type}
                             onChange={e => setDiscount({...discount, type: e.target.value as any})}
                           >
                               <option value="FIXED">Rp</option>
                               <option value="PERCENT">%</option>
                           </select>
                      </div>
                  </div>
                  <div>
                    <label className="block text-xs text-lumina-muted mb-1.5">Payment Method</label>
                    <select 
                        className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-lumina-accent"
                        value={formData.paymentAccount}
                        onChange={e => setFormData({...formData, paymentAccount: e.target.value})}
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                        ))}
                    </select>
                  </div>
               </div>
               <div className="p-3 bg-lumina-highlight/20 border border-lumina-highlight rounded-lg flex justify-between items-center text-sm">
                   <span className="text-lumina-muted">Estimated Total (After Discount)</span>
                   <span className="font-bold font-mono text-emerald-400">Rp {calculateFinal().toLocaleString()}</span>
               </div>
            </section>

            <div className="pt-4 border-t border-lumina-highlight bg-lumina-base flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-lumina-muted hover:text-white transition-colors">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={!!problematicWarning && !adminOverride}
                    className="px-8 py-2.5 rounded-xl font-bold bg-lumina-accent text-lumina-base hover:bg-lumina-accent/90 transition-all shadow-lg shadow-lumina-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {!!problematicWarning && !adminOverride ? 'Blocked' : isLead ? 'Save Inquiry' : softBookingOverride ? 'Force Book' : 'Create Booking'}
                </button>
            </div>

          </form>
        </div>
      </Motion.div>
    </div>
  );
};

export default NewBookingModal;