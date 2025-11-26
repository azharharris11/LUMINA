
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, MessageCircle, Copy, Check } from 'lucide-react';
import { Booking, StudioConfig, WhatsAppModalProps } from '../types'; // Update type import

const Motion = motion as any;

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, booking, config, onLogActivity }) => {
  if (!isOpen || !booking) return null;

  const [activeTemplate, setActiveTemplate] = useState<'booking' | 'reminder' | 'thanks'>('reminder');
  const [copied, setCopied] = useState(false);

  // Interpolation helper
  const interpolate = (template: string) => {
      // Calculate Price safely (handle NaN or corrupt data)
      const basePrice = Number(booking.price) || 0;
      const taxAmount = basePrice * (config.taxRate / 100);
      const totalDue = basePrice + taxAmount;
      const remainingBalance = totalDue - (booking.paidAmount || 0);
      
      return template
        .replace('{clientName}', booking.clientName)
        .replace('{package}', booking.package)
        .replace('{date}', booking.date)
        .replace('{time}', booking.timeStart)
        .replace('{studio}', booking.studio)
        .replace('{studioName}', config.name)
        .replace('{balance}', `Rp ${remainingBalance.toLocaleString('id-ID')}`)
        .replace('{bankName}', config.bankName)
        .replace('{bankAccount}', config.bankAccount);
  };

  const messageText = interpolate(config.templates[activeTemplate] || '');

  const templateOptions: { id: 'booking' | 'reminder' | 'thanks'; label: string }[] = [
    { id: 'booking', label: 'Booking Confirmation' },
    { id: 'reminder', label: 'Payment Reminder' },
    { id: 'thanks', label: 'Thank You Note' }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    // Log Activity
    if (onLogActivity) {
        onLogActivity(booking.id, 'COMMUNICATION', `Sent WhatsApp ${activeTemplate} message to client.`);
    }

    // Format Phone: Replace 08 with 628, remove non-digits
    let phone = booking.clientPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <Motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-4 border-b border-lumina-highlight bg-lumina-base flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle size={18} className="text-emerald-400" />
                WhatsApp Automation
            </h3>
            <button onClick={onClose} className="text-lumina-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Template Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-lumina-muted uppercase tracking-wider">Select Template</label>
                <div className="flex gap-2 flex-wrap">
                    {templateOptions.map(option => (
                        <button 
                            type="button"
                            key={option.id}
                            onClick={() => setActiveTemplate(option.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border
                            ${activeTemplate === option.id 
                                ? 'bg-lumina-accent text-lumina-base border-lumina-accent shadow-lg shadow-lumina-accent/10' 
                                : 'bg-lumina-base hover:bg-lumina-highlight text-lumina-muted hover:text-white border-lumina-highlight'}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Preview */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-lumina-muted uppercase tracking-wider">Message Preview</label>
                    <span className="text-[10px] text-lumina-muted">To: {booking.clientPhone}</span>
                </div>
                <div className="bg-lumina-base p-4 rounded-xl border border-lumina-highlight relative group">
                    <p className="text-sm text-white whitespace-pre-wrap leading-relaxed font-sans">
                        {messageText}
                    </p>
                    <button 
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-1.5 bg-lumina-surface rounded text-lumina-muted hover:text-white transition-opacity border border-lumina-highlight"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                </div>
            </div>
            
            <button 
                onClick={handleSend}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
                <Send size={18} /> Send Message
            </button>
        </div>
      </Motion.div>
    </div>
  );
};

export default WhatsAppModal;