import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Download, Aperture } from 'lucide-react';
import { Booking, StudioConfig } from '../types';

const Motion = motion as any;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  config: StudioConfig;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, booking, config }) => {
  if (!isOpen || !booking) return null;

  // Determine Tax Rate: Use Snapshot if available, else fallback to current global config
  const applicableTaxRate = booking.taxSnapshot !== undefined ? booking.taxSnapshot : (config.taxRate || 0);

  // Calculate Totals with Discount Logic
  // 1. Calculate Base Total from Items (or fallback price)
  const items = booking.items && booking.items.length > 0 ? booking.items : [
      {
          id: 'legacy',
          description: `${booking.package} (${booking.duration} Hours)`,
          quantity: 1,
          unitPrice: booking.price,
          total: booking.price
      }
  ];
  
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // 2. Apply Discount
  const discount = booking.discount || { type: 'FIXED', value: 0 };
  const discountAmount = discount.type === 'PERCENT' 
    ? subtotal * (discount.value / 100) 
    : discount.value;
    
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // 3. Calculate Tax on discounted amount
  const taxAmount = (subtotalAfterDiscount * applicableTaxRate) / 100;
  
  // 4. Final Total
  const totalAmount = subtotalAfterDiscount + taxAmount;
  const balanceDue = totalAmount - booking.paidAmount;

  // Professional Invoice ID Generator
  const generateInvoiceId = () => {
      const dateStr = booking.date.replace(/-/g, '');
      const uniqueSuffix = booking.id.substring(booking.id.length - 4).toUpperCase();
      return `INV-${dateStr}-${uniqueSuffix}`;
  };

  // Determine "Issue Date" - prefer contract signed date, fallback to booking date
  const invoiceDate = booking.contractSignedDate 
    ? new Date(booking.contractSignedDate).toLocaleDateString() 
    : new Date(booking.date).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 print:p-0">
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body > *:not(#root) { display: none; }
            #root > *:not(.fixed) { display: none; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:text-black { color: black !important; }
            .print\\:bg-white { background-color: white !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border-none { border: none !important; }
            .fixed { position: static !important; inset: 0 !important; }
            .print\\:p-0 { padding: 0 !important; }
            .print\\:h-auto { height: auto !important; }
            .print\\:w-full { width: 100% !important; max-width: 100% !important; }
            .print\\:overflow-visible { overflow: visible !important; }
          }
        `}
      </style>

      <div className="absolute inset-0 bg-black/90 backdrop-blur-md print:hidden" onClick={onClose}></div>
      
      <Motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-3xl h-[85vh] flex flex-col print:h-auto print:shadow-none print:w-full"
      >
        <div className="flex justify-between items-center mb-4 text-white print:hidden">
            <h2 className="text-xl font-bold font-display">Invoice Preview</h2>
            <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-lumina-surface border border-lumina-highlight rounded-lg hover:bg-lumina-highlight transition-colors text-sm">
                    <Printer size={16} /> Print
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-lumina-accent text-lumina-base rounded-lg font-bold hover:bg-lumina-accent/90 transition-colors text-sm">
                    <Download size={16} /> Download PDF
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg ml-2">
                    <X size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 bg-white text-stone-900 rounded-lg shadow-2xl overflow-y-auto custom-scrollbar relative font-sans print:overflow-visible print:rounded-none">
            <div className="p-12 min-h-full flex flex-col justify-between print:p-0">
                
                <div>
                    <div className="flex justify-between items-start border-b-2 border-stone-900 pb-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-stone-900">
                                {config.logoUrl ? (
                                    <img src={config.logoUrl} alt="Logo" className="h-10 w-auto" />
                                ) : (
                                    <Aperture className="w-8 h-8" />
                                )}
                                <span className="font-display font-bold text-2xl tracking-tight uppercase">{config.name}</span>
                            </div>
                            <div className="text-sm text-stone-600 space-y-1">
                                <p>{config.address}</p>
                                <p>{config.phone}</p>
                                <p>{config.website}</p>
                                {config.npwp && <p className="text-xs mt-2 text-stone-400">NPWP: {config.npwp}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-5xl font-display font-bold text-stone-200 mb-2">INVOICE</h1>
                            <p className="text-stone-500 font-mono font-bold tracking-widest">{generateInvoiceId()}</p>
                            <p className="text-sm font-bold text-stone-900 mt-2">Date: {invoiceDate}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Billed To</h3>
                            <p className="font-bold text-xl">{booking.clientName}</p>
                            <p className="text-stone-600">{booking.clientPhone}</p>
                        </div>
                        <div>
                             <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Project Details</h3>
                             <p className="font-bold">{booking.package}</p>
                             <p className="text-stone-600">Session Date: {booking.date}</p>
                             <p className="text-stone-600">Studio: {booking.studio}</p>
                        </div>
                    </div>

                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b border-stone-300">
                                <th className="text-left py-3 text-sm font-bold uppercase text-stone-500">Description</th>
                                <th className="text-right py-3 text-sm font-bold uppercase text-stone-500">Price</th>
                                <th className="text-right py-3 text-sm font-bold uppercase text-stone-500">Qty</th>
                                <th className="text-right py-3 text-sm font-bold uppercase text-stone-500">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-4">
                                        <p className="font-bold text-stone-800">{item.description}</p>
                                    </td>
                                    <td className="text-right py-4 font-mono text-stone-600">{item.unitPrice.toLocaleString('id-ID')}</td>
                                    <td className="text-right py-4 font-mono">{item.quantity}</td>
                                    <td className="text-right py-4 font-mono font-bold">Rp {item.total.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end mb-12">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm text-stone-600">
                                <span>Subtotal</span>
                                <span className="font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            
                            {discount.value > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount {discount.type === 'PERCENT' ? `(${discount.value}%)` : ''}</span>
                                    <span className="font-mono">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm text-stone-600">
                                <span>Tax (PPN {applicableTaxRate}%)</span>
                                <span className="font-mono">Rp {taxAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="border-t border-stone-300 pt-3 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                <span>Amount Paid</span>
                                <span className="font-mono">- Rp {booking.paidAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="bg-stone-900 text-white p-3 rounded-lg flex justify-between font-bold text-xl mt-4 print:bg-stone-200 print:text-black">
                                <span>Balance Due</span>
                                <span className="font-mono">Rp {balanceDue.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-stone-200 pt-8 flex justify-between items-end">
                    <div>
                        <h4 className="font-bold text-sm mb-2">Payment Methods</h4>
                        <div className="text-sm text-stone-600">
                            <p><span className="font-bold">{config.bankName}</span>: {config.bankAccount}</p>
                            <p>A/N: {config.bankHolder}</p>
                        </div>
                        {config.invoiceFooter && (
                            <p className="text-xs text-stone-400 mt-4 italic max-w-sm">{config.invoiceFooter}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-stone-400">Authorized Signature</p>
                        <div className="h-16 flex items-end justify-end">
                            <p className="font-display font-bold text-lg">{config.name}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default InvoiceModal;