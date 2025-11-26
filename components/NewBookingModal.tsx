
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Account, Booking, ProjectStatus, Client, StudioConfig, BookingItem, Discount, Asset, Package, BookingTask } from '../types';
import { PACKAGES } from '../data';
import { X, Calendar, Clock, User as UserIcon, AlertCircle, Search, ChevronDown, Plus, Timer, AlertTriangle, Star, History, Camera, ArrowRight, Check, Box, ListChecks, ChevronLeft } from 'lucide-react';

const Motion = motion as any;

// ... TimeSlotBar and interfaces ...
interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographers: User[];
  accounts: Account[];
  bookings?: Booking[]; 
  clients?: Client[]; 
  assets?: Asset[]; 
  config: StudioConfig; 
  onAddBooking?: (booking: Booking, paymentDetails?: { amount: number, accountId: string }) => void;
  onAddClient?: (client: Client) => void; 
  initialData?: { date: string, time: string, studio: string };
  googleToken?: string | null;
}

const TimeSlotBar = ({ date, studio, bookings, config }: { date: string, studio: string, bookings: Booking[], config: StudioConfig }) => {
    const opStart = config.operatingHoursStart || "09:00";
    const opEnd = config.operatingHoursEnd || "21:00";
    const [startH] = opStart.split(':').map(Number);
    const [endH] = opEnd.split(':').map(Number);
    const totalMinutes = (endH - startH) * 60;
    const dayBookings = bookings.filter(b => b.date === date && b.studio === studio && b.status !== 'CANCELLED');

    return (
        <div className="relative h-8 bg-lumina-base border border-lumina-highlight rounded w-full overflow-hidden mt-2">
            {Array.from({ length: endH - startH }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-lumina-highlight/30 text-[8px] text-lumina-muted pl-0.5" 
                     style={{ left: `${(i / (endH - startH)) * 100}%` }}>
                    {startH + i}
                </div>
            ))}
            {dayBookings.map(b => {
                if (!b.timeStart) return null;
                const [bH, bM] = b.timeStart.split(':').map(Number);
                const startOffset = (bH - startH) * 60 + bM;
                const leftPct = (startOffset / totalMinutes) * 100;
                const widthPct = (b.duration * 60 / totalMinutes) * 100;
                return (
                    <div key={b.id} className="absolute top-1 bottom-1 bg-red-500/30 border border-red-500/50 rounded-sm z-10 flex items-center justify-center" style={{ left: `${leftPct}%`, width: `${widthPct}%` }} title={`${b.timeStart} - ${b.clientName}`}>
                        <span className="text-[8px] text-red-200 truncate px-1 hidden md:block">{b.clientName}</span>
                    </div>
                );
            })}
        </div>
    );
};

const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose, photographers, accounts, bookings = [], clients = [], assets = [], config, onAddBooking, onAddClient, initialData, googleToken }) => {
  const [step, setStep] = useState<1|2|3|4>(1);
  // ... state definitions ...
  const [formData, setFormData] = useState({
      clientName: '', clientPhone: '', date: '', timeStart: '', package: '', price: 0, durationMinutes: 60, studio: '', photographerId: '', amountPaid: 0, paymentAccount: accounts[0]?.id || ''
  });
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
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
  const activePackages = PACKAGES.filter(p => p.active && !p.archived);

  useEffect(() => {
      if (isOpen) {
          const defaultPkg = activePackages[0];
          const defaultPrice = defaultPkg ? defaultPkg.price : 0;
          const dpPercentage = config.requiredDownPaymentPercentage || 50;
          const initialDP = defaultPrice * (dpPercentage / 100);

          if (initialData) {
              setFormData(prev => ({ ...prev, date: initialData.date, timeStart: initialData.time, studio: initialData.studio, package: defaultPkg ? defaultPkg.name : '', price: defaultPrice, durationMinutes: defaultPkg ? defaultPkg.duration * 60 : 60, amountPaid: initialDP }));
              setStep(2);
          } else {
              setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0], timeStart: '10:00', studio: studios[0]?.name || '', package: defaultPkg ? defaultPkg.name : '', price: defaultPrice, durationMinutes: defaultPkg ? defaultPkg.duration * 60 : 60, amountPaid: initialDP }));
              setStep(1);
          }
          setClientSearch(''); setSelectedClient(null); setSelectedAssetIds([]); setError(null); setProblematicWarning(null); setSoftConflictWarning(null); setAdminOverride(false); setSoftBookingOverride(false); setDiscount({ type: 'FIXED', value: 0 }); setIsLead(false);
      }
  }, [isOpen, initialData, studios]);

  const handlePackageChange = (pkgName: string) => {
      const pkg = activePackages.find(p => p.name === pkgName);
      const newPrice = pkg ? pkg.price : formData.price;
      const dpPercentage = config.requiredDownPaymentPercentage || 50;
      const newDP = newPrice * (dpPercentage / 100);
      setFormData(prev => ({ ...prev, package: pkgName, price: newPrice, durationMinutes: pkg ? pkg.duration * 60 : prev.durationMinutes, amountPaid: newDP }));
      if (pkg && pkg.defaultAssetIds) { setSelectedAssetIds(pkg.defaultAssetIds); }
  };

  const formatTime = (minutes: number) => { const h = Math.floor(minutes / 60); const m = minutes % 60; return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; };

  const checkConflict = (): { type: 'ROOM' | 'PHOTOGRAPHER' | 'HOURS' | 'CLIENT' | 'ASSET', message: string, isSoft?: boolean } | null => {
      if (!formData.date || !formData.timeStart) return null;
      const newDurationMins = formData.durationMinutes;
      const [startH, startM] = formData.timeStart.split(':').map(Number);
      const newStartTime = startH * 60 + startM;
      const newEndTime = newStartTime + newDurationMins;
      const [openH, openM] = (config.operatingHoursStart || "09:00").split(':').map(Number);
      const [closeH, closeM] = (config.operatingHoursEnd || "21:00").split(':').map(Number);
      const openTime = openH * 60 + openM; const closeTime = closeH * 60 + closeM;

      if (newStartTime < openTime || newEndTime > closeTime) { return { type: 'HOURS', message: `Booking is outside operating hours (${config.operatingHoursStart} - ${config.operatingHoursEnd}).` }; }
      if (formData.photographerId) { const staff = photographers.find(p => p.id === formData.photographerId); if (staff && staff.unavailableDates && staff.unavailableDates.includes(formData.date)) { return { type: 'PHOTOGRAPHER', message: `Staff Conflict! ${staff.name} is unavailable (Off-day) on ${formData.date}.` }; } }

      for (const b of bookings) {
          if (b.date !== formData.date) continue;
          if (b.status === 'CANCELLED' || b.status === 'REFUNDED') continue;
          if (!b.timeStart) continue;
          const [bStartH, bStartM] = b.timeStart.split(':').map(Number);
          const bStartTime = bStartH * 60 + bStartM;
          const bEndTime = bStartTime + (b.duration * 60);
          const bEndWithBuffer = bEndTime + BUFFER_MINUTES;
          const isOverlapping = (newStartTime < bEndWithBuffer) && (newEndTime > bStartTime);

          if (isOverlapping) {
              const isSoftConflict = b.status === 'INQUIRY';
              if (b.studio === formData.studio) { return { type: 'ROOM', message: `Studio Conflict! ${b.studio} is booked by ${b.clientName} (${b.timeStart} - ${formatTime(bEndTime)} + buffer).`, isSoft: isSoftConflict }; }
              if (formData.photographerId && b.photographerId === formData.photographerId) { const photographerName = photographers.find(p => p.id === formData.photographerId)?.name || 'Photographer'; return { type: 'PHOTOGRAPHER', message: `Staff Conflict! ${photographerName} is shooting for ${b.clientName}.`, isSoft: isSoftConflict }; }
              if (b.assetIds && b.assetIds.length > 0 && selectedAssetIds.length > 0) { const conflictingAssets = selectedAssetIds.filter(id => b.assetIds?.includes(id)); if (conflictingAssets.length > 0) { const assetNames = conflictingAssets.map(id => assets.find(a => a.id === id)?.name).join(', '); return { type: 'ASSET', message: `Equipment Conflict! In use: ${assetNames}`, isSoft: isSoftConflict } } }
          }
      }
      return null;
  };

  const addToGoogleCalendar = async (booking: Booking) => { /* ... */ if (!googleToken) return; try { const startDateTime = new Date(`${booking.date}T${booking.timeStart}:00`); const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60 * 60 * 1000); const event = { summary: `[Lumina] ${booking.clientName} - ${booking.package}`, location: booking.studio, description: `Phone: ${booking.clientPhone}\nStudio: ${booking.studio}\nPackage: ${booking.package}`, start: { dateTime: startDateTime.toISOString() }, end: { dateTime: endDateTime.toISOString() }, }; await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', { method: 'POST', headers: { 'Authorization': `Bearer ${googleToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event), }); } catch (error) { console.error('Error adding to Google Calendar:', error); } };

  const handleNext = () => { setError(null); setSoftConflictWarning(null); if (step === 1) { if (!formData.clientName || !formData.clientPhone) { setError("Client name and phone are required."); return; } if (problematicWarning && !adminOverride) { setError("Client flagged as problematic. Confirm override to proceed."); return; } setStep(2); } else if (step === 2) { if (!formData.date || !formData.timeStart || !formData.studio) { setError("Please complete all schedule fields."); return; } const conflict = checkConflict(); if (conflict && conflict.type !== 'ASSET') { if (conflict.isSoft && !softBookingOverride) { setSoftConflictWarning(conflict.message); return; } else if (!conflict.isSoft) { setError(conflict.message); return; } } setStep(3); } else if (step === 3) { if (!formData.package) { setError("Please select a package."); return; } const conflict = checkConflict(); if (conflict && conflict.type === 'ASSET') { if (conflict.isSoft && !softBookingOverride) { setSoftConflictWarning(conflict.message); return; } else if (!conflict.isSoft) { setError(conflict.message); return; } } setStep(4); } };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(onAddBooking) {
          const selectedPackage = activePackages.find(p => p.name === formData.package);
          const costSnapshot = selectedPackage ? [...selectedPackage.costBreakdown] : [];
          const initialTasks: BookingTask[] = (selectedPackage?.defaultTasks || []).map(title => ({ id: `t-${Date.now()}-${Math.random()}`, title, completed: false }));
          const initialItems: BookingItem[] = [ { id: `item-${Date.now()}`, description: `${formData.package} (${formData.durationMinutes / 60}h)`, quantity: 1, unitPrice: Number(formData.price), total: Number(formData.price) } ];
          let safePhotographerId = formData.photographerId; if (!safePhotographerId && photographers.length > 0) safePhotographerId = photographers[0].id; if (!safePhotographerId) safePhotographerId = ''; 
          let finalClientId = selectedClient?.id;
          if (!finalClientId && formData.clientName) { const newClient: Client = { id: `c-${Date.now()}`, name: formData.clientName, phone: formData.clientPhone, email: '', category: 'NEW', notes: 'Auto-created from booking', joinedDate: new Date().toISOString().split('T')[0], avatar: `https://ui-avatars.com/api/?name=${formData.clientName}&background=random` }; if (onAddClient) { onAddClient(newClient); finalClientId = newClient.id; } }
          const newBooking: Booking = { id: `b-${Date.now()}`, clientName: formData.clientName, clientPhone: formData.clientPhone, date: formData.date, timeStart: formData.timeStart, duration: formData.durationMinutes / 60, package: formData.package, price: Number(formData.price), paidAmount: Number(formData.amountPaid), status: isLead ? 'INQUIRY' : 'BOOKED', photographerId: safePhotographerId, studio: formData.studio, contractStatus: 'PENDING', items: initialItems, discount: discount, comments: [], timeLogs: [], costSnapshot: costSnapshot, taxSnapshot: config.taxRate, clientId: finalClientId, assetIds: selectedAssetIds, tasks: initialTasks };
          if (newBooking.clientId === undefined) delete newBooking.clientId;
          onAddBooking(newBooking, { amount: Number(formData.amountPaid), accountId: formData.paymentAccount });
          if (googleToken) await addToGoogleCalendar(newBooking);
          onClose();
      }
  };

  const filteredClients = clientSearch.length > 0 ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())) : [];
  const selectClient = (client: Client) => { setFormData(prev => ({ ...prev, clientName: client.name, clientPhone: client.phone })); setClientSearch(client.name); setShowClientSuggestions(false); setSelectedClient(client); if (client.category === 'PROBLEMATIC') { setProblematicWarning(`WARNING: This client is flagged as PROBLEMATIC.\nNote: "${client.notes}"`); } else { setProblematicWarning(null); } };
  const toggleAssetSelection = (assetId: string) => { setSelectedAssetIds(prev => prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId] ); };
  const calculateFinal = () => { const base = formData.price; const discountAmount = discount.type === 'PERCENT' ? base * (discount.value/100) : discount.value; return Math.max(0, base - discountAmount); }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <Motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="bg-lumina-surface border border-lumina-highlight w-full lg:max-w-2xl h-full lg:h-auto lg:rounded-2xl shadow-2xl relative overflow-hidden flex flex-col lg:max-h-[90vh]"
      >
        {/* Header & Progress */}
        <div className="bg-lumina-base p-4 lg:p-6 border-b border-lumina-highlight shrink-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl lg:text-2xl font-display font-bold text-white">New Session</h2>
                <button onClick={onClose}><X className="text-lumina-muted hover:text-white" /></button>
            </div>
            {/* Stepper */}
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step >= i ? 'bg-lumina-accent' : 'bg-lumina-highlight'}`}></div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-lumina-muted uppercase font-bold mt-2">
                <span className={step >= 1 ? 'text-white' : ''}>Client</span>
                <span className={step >= 2 ? 'text-white' : ''}>Schedule</span>
                <span className={step >= 3 ? 'text-white' : ''}>Package</span>
                <span className={step >= 4 ? 'text-white' : ''}>Confirm</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
            <AnimatePresence mode="wait">
                {/* ERROR BANNERS */}
                {(error || softConflictWarning || problematicWarning) && (
                    <div className="mb-4 space-y-2">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-3">
                                <AlertCircle className="text-red-500 w-5 h-5 shrink-0" />
                                <p className="text-sm text-red-200 font-medium">{error}</p>
                            </div>
                        )}
                        {softConflictWarning && (
                            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-blue-500 w-5 h-5 shrink-0" />
                                    <p className="text-sm text-blue-200">{softConflictWarning}</p>
                                </div>
                                <label className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-500/20 cursor-pointer">
                                    <input type="checkbox" checked={softBookingOverride} onChange={e => setSoftBookingOverride(e.target.checked)} className="bg-lumina-base border-blue-500/50 text-blue-500 rounded"/>
                                    <span className="text-xs font-bold text-blue-100 uppercase">Force Booking</span>
                                </label>
                            </div>
                        )}
                        {problematicWarning && (
                            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
                                    <p className="text-sm text-amber-200">{problematicWarning}</p>
                                </div>
                                <label className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-500/20 cursor-pointer">
                                    <input type="checkbox" checked={adminOverride} onChange={e => setAdminOverride(e.target.checked)} className="bg-lumina-base border-amber-500/50 text-amber-500 rounded"/>
                                    <span className="text-xs font-bold text-amber-100 uppercase">Admin Override</span>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 1: CLIENT */}
                {step === 1 && (
                    <Motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="relative">
                            <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Client Name</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4" />
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full bg-lumina-base border border-lumina-highlight rounded-lg pl-10 pr-4 py-3 text-white focus:border-lumina-accent outline-none" 
                                    placeholder="Search existing or type new..." 
                                    value={formData.clientName}
                                    onChange={e => {
                                        setFormData({...formData, clientName: e.target.value});
                                        setClientSearch(e.target.value);
                                        setShowClientSuggestions(true);
                                    }}
                                />
                                {showClientSuggestions && clientSearch.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-lumina-surface border border-lumina-highlight rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                                        {filteredClients.map(client => (
                                            <div key={client.id} onClick={() => selectClient(client)} className="px-3 py-2 hover:bg-lumina-highlight cursor-pointer flex justify-between items-center">
                                                <span className="text-sm text-white font-bold">{client.name}</span>
                                                <span className="text-xs text-lumina-muted">{client.phone}</span>
                                            </div>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <div className="px-3 py-2 text-xs text-lumina-accent flex items-center gap-2 cursor-pointer" onClick={() => setShowClientSuggestions(false)}>
                                                <Plus size={12}/> Create new client "{clientSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Phone Number</label>
                            <input 
                                type="text" 
                                className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-3 text-white focus:border-lumina-accent outline-none" 
                                value={formData.clientPhone}
                                onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                                placeholder="08..."
                            />
                        </div>
                        <div className="p-4 bg-lumina-highlight/10 rounded-xl border border-lumina-highlight">
                            <div className="flex items-center gap-2 text-lumina-muted text-xs mb-2">
                                <History size={12}/> <span>History Snapshot</span>
                            </div>
                            {selectedClient ? (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{selectedClient.category} Client</p>
                                        <p className="text-xs text-lumina-muted">Joined {new Date(selectedClient.joinedDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-bold font-mono">Verified</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-lumina-muted italic">New client profile will be created.</p>
                            )}
                        </div>
                    </Motion.div>
                )}

                {/* STEP 2: SCHEDULE */}
                {step === 2 && (
                    <Motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Date</label>
                                <input type="date" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Studio</label>
                                <select className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" value={formData.studio} onChange={e => setFormData({...formData, studio: e.target.value})}>
                                    {studios.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {/* VISUAL AVAILABILITY */}
                        <div>
                            <label className="text-xs text-lumina-muted uppercase font-bold mb-1 block">Availability ({formData.date})</label>
                            <TimeSlotBar date={formData.date} studio={formData.studio} bookings={bookings} config={config} />
                            <div className="flex justify-between text-[10px] text-lumina-muted mt-1">
                                <span>{config.operatingHoursStart || '09:00'}</span>
                                <span>{config.operatingHoursEnd || '21:00'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Start Time</label>
                                <input type="time" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" value={formData.timeStart} onChange={e => setFormData({...formData, timeStart: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Photographer</label>
                                <select className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" value={formData.photographerId} onChange={e => setFormData({...formData, photographerId: e.target.value})}>
                                    <option value="">Any Available</option>
                                    {photographers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </Motion.div>
                )}

                {/* STEP 3: PACKAGE & ASSETS */}
                {step === 3 && (
                    <Motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div>
                            <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Select Package</label>
                            <select 
                                className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none text-lg font-bold"
                                value={formData.package}
                                onChange={e => handlePackageChange(e.target.value)}
                            >
                                <option value="">-- Choose Package --</option>
                                {activePackages.map(p => <option key={p.id} value={p.name}>{p.name} - Rp {p.price.toLocaleString()}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Duration (Mins)</label>
                                <input type="number" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs text-lumina-muted mb-1.5 uppercase font-bold">Price Override</label>
                                <input type="number" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                            </div>
                        </div>

                        {/* ASSET BUNDLING */}
                        <div className="p-4 bg-lumina-highlight/10 rounded-xl border border-lumina-highlight">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs text-lumina-muted uppercase font-bold flex items-center gap-2"><Box size={12}/> Equipment Reservation</label>
                                <span className="text-[10px] text-lumina-muted">{selectedAssetIds.length} Items Selected</span>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {assets.filter(a => !a.archived).map(asset => (
                                    <button
                                        key={asset.id}
                                        type="button"
                                        onClick={() => toggleAssetSelection(asset.id)}
                                        className={`text-xs px-2 py-1.5 rounded border transition-colors
                                            ${selectedAssetIds.includes(asset.id) 
                                                ? 'bg-lumina-accent text-lumina-base border-lumina-accent font-bold' 
                                                : 'bg-lumina-base text-lumina-muted border-lumina-highlight hover:border-lumina-accent/50'}
                                        `}
                                    >
                                        {asset.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Motion.div>
                )}

                {/* STEP 4: CONFIRMATION */}
                {step === 4 && (
                    <Motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-lumina-muted">Client</span>
                                <span className="text-white font-bold">{formData.clientName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-lumina-muted">Session</span>
                                <span className="text-white font-bold">{formData.package} @ {formData.studio}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-lumina-muted">When</span>
                                <span className="text-white font-bold">{new Date(formData.date).toLocaleDateString()} {formData.timeStart}</span>
                            </div>
                        </div>

                        <div className="bg-lumina-highlight/10 rounded-lg p-4 border border-lumina-highlight">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-lumina-muted">Total</span>
                                <span className="text-lg font-mono text-white font-bold">Rp {calculateFinal().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs text-lumina-muted font-bold">Required DP ({config.requiredDownPaymentPercentage}%)</span>
                                <span className="text-sm font-mono text-emerald-400 font-bold">Rp {((formData.price * (config.requiredDownPaymentPercentage||50))/100).toLocaleString()}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-lumina-muted mb-1.5">Amount Paid Now</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-lumina-accent"
                                            value={formData.amountPaid}
                                            onChange={e => setFormData({...formData, amountPaid: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-lumina-muted mb-1.5">Payment Account</label>
                                        <select 
                                            className="w-full bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lumina-accent"
                                            value={formData.paymentAccount}
                                            onChange={e => setFormData({...formData, paymentAccount: e.target.value})}
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <label className="flex items-center gap-2 cursor-pointer bg-lumina-highlight/30 p-2 rounded-lg border border-lumina-highlight/50">
                                <span className={`text-xs font-bold uppercase ${isLead ? 'text-emerald-400' : 'text-lumina-muted'}`}>
                                    {isLead ? 'Mark as Inquiry (Lead)' : 'Confirm Booking'}
                                </span>
                                <input type="checkbox" checked={isLead} onChange={e => setIsLead(e.target.checked)} className="ml-2" />
                            </label>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 lg:p-6 border-t border-lumina-highlight bg-lumina-base flex justify-between items-center pb-safe-area-bottom lg:pb-6 shrink-0">
            {step > 1 ? (
                <button onClick={() => setStep(prev => Math.max(1, prev-1) as any)} className="flex items-center gap-2 text-lumina-muted hover:text-white font-bold text-sm px-4 py-2">
                    <ChevronLeft size={16}/> Back
                </button>
            ) : <div></div>}

            {step < 4 ? (
                <button onClick={handleNext} className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2 text-sm lg:text-base">
                    Next Step <ArrowRight size={16}/>
                </button>
            ) : (
                <button onClick={handleSubmit} className="bg-lumina-accent text-lumina-base px-8 py-3 rounded-xl font-bold hover:bg-lumina-accent/90 shadow-lg shadow-lumina-accent/20 flex items-center gap-2 text-sm lg:text-base">
                    <Check size={18}/> {isLead ? 'Save Inquiry' : 'Confirm'}
                </button>
            )}
        </div>
      </Motion.div>
    </div>
  );
};

export default NewBookingModal;
