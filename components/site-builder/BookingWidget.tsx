
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, SiteTheme, PublicBookingSubmission, SitePixels, Booking } from '../../types';
import { Check, ChevronRight, Calendar, Clock, User, ArrowLeft, CheckCircle2, Loader2, Activity, AlertCircle } from 'lucide-react';

const Motion = motion as any;

interface BookingWidgetProps {
    packages: Package[];
    theme: SiteTheme;
    onSubmit?: (data: PublicBookingSubmission) => void;
    pixels?: SitePixels;
    bookings?: Booking[]; // Receive existing bookings for availability check
}

type Step = 'PACKAGE' | 'DATE' | 'DETAILS' | 'CONFIRM';

const BookingWidget: React.FC<BookingWidgetProps> = ({ packages, theme, onSubmit, pixels, bookings = [] }) => {
    const [step, setStep] = useState<Step>('PACKAGE');
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Tracking Simulation State
    const [pixelToast, setPixelToast] = useState<string | null>(null);

    // --- TRACKING HELPER ---
    const firePixel = (event: string, details: string) => {
        if (!pixels) return;
        const hasPixel = pixels.facebookPixelId || pixels.tiktokPixelId || pixels.googleTagId;
        
        if (hasPixel) {
            console.log(`[TRACKING] Event: ${event} | Details: ${details}`);
            setPixelToast(`${event} fired`);
            setTimeout(() => setPixelToast(null), 3000);
        }
    };

    const handleSelectPackage = (pkg: Package) => {
        setSelectedPackage(pkg);
        // TRACK: ViewContent
        firePixel('ViewContent', `Package: ${pkg.name} - Rp ${pkg.price}`);
    };

    // --- AVAILABILITY LOGIC ---
    const availableTimeSlots = useMemo(() => {
        const slots = ['09:00', '11:00', '13:00', '15:00', '17:00'];
        
        if (!selectedDate || !selectedPackage) return slots.map(t => ({ time: t, available: true }));

        return slots.map(time => {
            const [startH, startM] = time.split(':').map(Number);
            const proposedStart = startH * 60 + startM;
            const proposedEnd = proposedStart + (selectedPackage.duration * 60);

            // Check against existing bookings on this date
            const hasConflict = bookings.some(b => {
                if (b.date !== selectedDate || b.status === 'CANCELLED') return false;
                
                const [bStartH, bStartM] = b.timeStart.split(':').map(Number);
                const bStart = bStartH * 60 + bStartM;
                const bEnd = bStart + (b.duration * 60);

                // Simple 1D Overlap Check (Any room)
                // (StartA < EndB) && (EndA > StartB)
                return (proposedStart < bEnd) && (proposedEnd > bStart);
            });

            return { time, available: !hasConflict };
        });
    }, [selectedDate, selectedPackage, bookings]);

    // --- THEME ADAPTER ---
    const getThemeClasses = () => {
        switch(theme) {
            case 'RETRO':
                return {
                    container: 'bg-[#c0c0c0] border-2 border-white border-r-black border-b-black p-4 text-black font-mono',
                    button: 'bg-[#c0c0c0] border-2 border-white border-r-black border-b-black active:border-black active:border-r-white active:border-b-white px-4 py-2 font-bold hover:bg-blue-100',
                    input: 'bg-white border-2 border-gray-600 border-r-white border-b-white p-2 shadow-inner',
                    card: 'bg-white border-2 border-gray-600 p-3 hover:bg-blue-100 cursor-pointer',
                    accent: 'bg-blue-800 text-white'
                };
            case 'VOGUE':
                return {
                    container: 'bg-white border-[6px] border-[#ff3333] p-6 text-black font-sans',
                    button: 'bg-black text-white border-2 border-black hover:bg-[#ffff00] hover:text-black font-black uppercase px-6 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
                    input: 'bg-[#f0f0f0] border-2 border-black p-3 font-bold focus:bg-[#ffff00] outline-none',
                    card: 'border-4 border-black p-4 hover:bg-[#ffff00] cursor-pointer transition-all',
                    accent: 'text-[#ff3333]'
                };
            case 'CINEMA':
                return {
                    container: 'bg-[#050505] border border-white/10 p-6 text-white font-sans rounded-xl backdrop-blur-md',
                    button: 'bg-white text-black rounded px-6 py-2 font-bold hover:bg-blue-500 hover:text-white transition-colors',
                    input: 'bg-white/10 border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none',
                    card: 'bg-white/5 border border-white/10 p-4 rounded hover:border-blue-500 cursor-pointer transition-all',
                    accent: 'text-blue-500'
                };
            case 'BOLD':
                return {
                    container: 'bg-white border-[8px] border-black p-6 text-black font-sans',
                    button: 'bg-black text-[#bef264] border-4 border-black font-black uppercase px-6 py-3 hover:bg-white hover:text-black transition-colors',
                    input: 'bg-[#f0f0f0] border-4 border-black p-3 font-bold focus:bg-white outline-none',
                    card: 'border-4 border-black p-4 hover:bg-[#bef264] cursor-pointer transition-all',
                    accent: 'text-black'
                };
            case 'AUTHORITY':
                return {
                    container: 'bg-[#1a1a1a] border border-amber-600/30 p-8 text-white font-serif shadow-2xl',
                    button: 'bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold uppercase tracking-widest px-6 py-3 hover:from-amber-500 hover:to-amber-400 transition-all',
                    input: 'bg-black border border-white/20 p-3 text-white focus:border-amber-500 outline-none font-sans',
                    card: 'bg-black/50 border border-white/10 p-4 hover:border-amber-500 cursor-pointer transition-all',
                    accent: 'text-amber-500'
                };
            case 'IMPACT':
                return {
                    container: 'bg-white border-4 border-black p-6 text-black font-sans shadow-[8px_8px_0_0_black]',
                    button: 'bg-[#22c55e] text-white border-2 border-black font-black uppercase px-6 py-3 hover:translate-y-1 transition-transform shadow-[4px_4px_0_0_black]',
                    input: 'bg-gray-100 border-2 border-black p-3 font-bold focus:bg-yellow-100 outline-none',
                    card: 'border-2 border-black p-4 hover:bg-yellow-100 cursor-pointer transition-all shadow-[4px_4px_0_0_gray]',
                    accent: 'text-black'
                };
            case 'NOIR':
                return {
                    container: 'bg-black border border-white/20 p-6 text-white font-sans rounded-none',
                    button: 'bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-300 transition-colors',
                    input: 'bg-black border-b border-white/50 p-3 text-white focus:border-white outline-none',
                    card: 'border border-white/20 p-4 hover:bg-white hover:text-black cursor-pointer transition-colors',
                    accent: 'text-white'
                };
            case 'CLEANSLATE':
                return {
                    container: 'bg-white border border-slate-200 p-8 text-slate-800 font-sans rounded-2xl shadow-xl',
                    button: 'bg-indigo-600 text-white rounded-xl px-6 py-3 font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20',
                    input: 'bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all',
                    card: 'bg-white border border-slate-200 p-4 rounded-xl hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer transition-all',
                    accent: 'text-indigo-600'
                };
            default: // Minimal / Ethereal / Atelier / Horizon
                return {
                    container: 'bg-white/80 backdrop-blur-lg border border-gray-200 p-6 text-gray-800 font-sans rounded-2xl shadow-xl',
                    button: 'bg-black text-white rounded-lg px-6 py-3 font-medium hover:opacity-80 transition-opacity',
                    input: 'bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-black/5 focus:border-black outline-none',
                    card: 'bg-white border border-gray-100 p-4 rounded-xl hover:shadow-md cursor-pointer transition-all',
                    accent: 'text-black'
                };
        }
    };

    const s = getThemeClasses();

    const handleNext = () => {
        if (step === 'PACKAGE' && selectedPackage) {
            setStep('DATE');
        }
        else if (step === 'DATE' && selectedDate && selectedTime) {
            // TRACK: AddToCart
            firePixel('AddToCart', `Date: ${selectedDate} ${selectedTime}`);
            setStep('DETAILS');
        }
        else if (step === 'DETAILS' && clientInfo.name) {
            // TRACK: InitiateCheckout
            firePixel('InitiateCheckout', `Client: ${clientInfo.name}`);
            setStep('CONFIRM');
        }
        else if (step === 'CONFIRM') {
            setIsSubmitting(true);
            
            // SIMULATE NETWORK REQUEST
            setTimeout(() => {
                setIsSubmitting(false);
                
                if (onSubmit && selectedPackage) {
                    onSubmit({
                        clientName: clientInfo.name,
                        clientEmail: clientInfo.email,
                        clientPhone: clientInfo.phone,
                        date: selectedDate,
                        time: selectedTime,
                        packageId: selectedPackage.id
                    });
                    alert("Booking request sent successfully! Check your Dashboard.");
                } else {
                    alert("Integration not connected. Check SiteBuilder props.");
                }

                // Reset
                setStep('PACKAGE');
                setSelectedPackage(null);
                setClientInfo({ name: '', email: '', phone: '' });
                setSelectedDate('');
                setSelectedTime('');
            }, 1500);
        }
    };

    const handleBack = () => {
        if (step === 'DATE') setStep('PACKAGE');
        else if (step === 'DETAILS') setStep('DATE');
        else if (step === 'CONFIRM') setStep('DETAILS');
    };

    return (
        <div className={`w-full max-w-md mx-auto my-12 ${s.container} relative`}>
            {/* Pixel Simulation Toast */}
            <AnimatePresence>
                {pixelToast && (
                    <Motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-12 left-0 right-0 mx-auto w-fit bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 z-50"
                    >
                        <Activity size={12} />
                        {pixelToast}
                    </Motion.div>
                )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="flex gap-2 mb-6">
                {['PACKAGE', 'DATE', 'DETAILS', 'CONFIRM'].map((sName, i) => (
                    <div key={sName} className={`h-1 flex-1 rounded-full ${['PACKAGE', 'DATE', 'DETAILS', 'CONFIRM'].indexOf(step) >= i ? 'bg-current opacity-100' : 'bg-current opacity-20'}`}></div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 'PACKAGE' && (
                    <Motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-xl font-bold mb-4 ${s.accent}`}>Select a Package</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {packages.filter(p => p.active).map(pkg => (
                                <div 
                                    key={pkg.id} 
                                    onClick={() => handleSelectPackage(pkg)}
                                    className={`${s.card} ${selectedPackage?.id === pkg.id ? 'ring-2 ring-current opacity-100' : 'opacity-80'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold">{pkg.name}</span>
                                        <span className="text-sm opacity-70">Rp {(pkg.price/1000).toFixed(0)}k</span>
                                    </div>
                                    <p className="text-xs opacity-60">{pkg.duration} Hours • {pkg.features[0]}</p>
                                </div>
                            ))}
                        </div>
                    </Motion.div>
                )}

                {step === 'DATE' && (
                    <Motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-xl font-bold mb-4 ${s.accent}`}>Choose Date & Time</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Date</label>
                                <input 
                                    type="date" 
                                    className={`w-full ${s.input}`}
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Available Times</label>
                                {!selectedDate ? (
                                    <p className="text-sm opacity-50 italic">Please select a date first.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableTimeSlots.map(slot => (
                                            <button 
                                                key={slot.time}
                                                onClick={() => slot.available && setSelectedTime(slot.time)}
                                                disabled={!slot.available}
                                                className={`py-2 text-sm border rounded transition-all relative overflow-hidden
                                                    ${selectedTime === slot.time ? 'bg-current text-white md:text-black md:invert' : 
                                                      slot.available ? 'border-current opacity-50 hover:opacity-100' : 'border-current/20 opacity-30 cursor-not-allowed bg-black/5'}
                                                `}
                                            >
                                                {slot.time}
                                                {!slot.available && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[1px] bg-current rotate-45"></div></div>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedDate && <p className="text-[10px] mt-2 opacity-60 flex items-center gap-1"><AlertCircle size={10}/> Times shown are based on {selectedPackage?.duration}h duration.</p>}
                            </div>
                        </div>
                    </Motion.div>
                )}

                {step === 'DETAILS' && (
                    <Motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-xl font-bold mb-4 ${s.accent}`}>Your Information</h3>
                        <div className="space-y-3">
                            <input 
                                placeholder="Full Name" 
                                className={`w-full ${s.input}`}
                                value={clientInfo.name}
                                onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                            />
                            <input 
                                placeholder="Phone Number" 
                                className={`w-full ${s.input}`}
                                value={clientInfo.phone}
                                onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                            />
                            <input 
                                placeholder="Email Address" 
                                className={`w-full ${s.input}`}
                                value={clientInfo.email}
                                onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                            />
                        </div>
                    </Motion.div>
                )}

                {step === 'CONFIRM' && (
                    <Motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-xl font-bold mb-4 ${s.accent}`}>Summary</h3>
                        <div className={`${s.card} mb-6 cursor-default`}>
                            <div className="flex items-center gap-3 mb-3 border-b border-current/10 pb-3">
                                <CheckCircle2 className="w-5 h-5 opacity-70"/>
                                <div>
                                    <p className="font-bold">{selectedPackage?.name}</p>
                                    <p className="text-xs opacity-70">Rp {selectedPackage?.price.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm opacity-80">
                                <div className="flex items-center gap-2"><Calendar size={14}/> {selectedDate}</div>
                                <div className="flex items-center gap-2"><Clock size={14}/> {selectedTime}</div>
                                <div className="flex items-center gap-2"><User size={14}/> {clientInfo.name}</div>
                            </div>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between mt-6 pt-4 border-t border-current/10">
                {step !== 'PACKAGE' ? (
                    <button onClick={handleBack} className="flex items-center gap-1 text-sm font-bold opacity-60 hover:opacity-100">
                        <ArrowLeft size={16} /> Back
                    </button>
                ) : <div></div>}
                
                <button 
                    onClick={handleNext}
                    disabled={
                        (step === 'PACKAGE' && !selectedPackage) || 
                        (step === 'DATE' && (!selectedDate || !selectedTime)) ||
                        (step === 'DETAILS' && !clientInfo.name) ||
                        isSubmitting
                    }
                    className={`${s.button} flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : step === 'CONFIRM' ? 'Confirm Booking' : 'Next'}
                    {!isSubmitting && step !== 'CONFIRM' && <ChevronRight size={16} />}
                </button>
            </div>
        </div>
    );
};

export default BookingWidget;
