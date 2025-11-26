

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowRightLeft, Wallet, FileText, AlertCircle, CheckCircle, ArrowUpRight, MessageCircle, FileInput, MinusCircle, CheckSquare, Search, Filter, Download, RotateCcw, Trash2, History } from 'lucide-react';
import { FinanceViewProps } from '../types';
import { STUDIO_CONFIG } from '../data';
import InvoiceModal from '../components/InvoiceModal';
import WhatsAppModal from '../components/WhatsAppModal';

const Motion = motion as any;

const FinanceView: React.FC<FinanceViewProps> = ({ accounts, metrics, bookings, transactions = [], onTransfer, onRecordExpense, onSettleBooking, onDeleteTransaction, config }) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVOICES' | 'EXPENSES' | 'LEDGER'>('OVERVIEW');
  
  const [invoiceFilter, setInvoiceFilter] = useState<'UNPAID' | 'PAID'>('UNPAID');

  const [transferForm, setTransferForm] = useState({ fromId: accounts[1]?.id || '', toId: accounts[0]?.id || '', amount: '' });

  const [expenseForm, setExpenseForm] = useState({
      description: '',
      amount: '',
      category: 'Utilities & Rent',
      accountId: accounts[0]?.id || ''
  });

  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<any | null>(null);
  const [selectedBookingForWA, setSelectedBookingForWA] = useState<any | null>(null);
  
  const [settleForm, setSettleForm] = useState<{ bookingId: string | null, amount: number, maxAmount: number, currentPaidAmount: number, accountId: string }>({
      bookingId: null, amount: 0, maxAmount: 0, currentPaidAmount: 0, accountId: accounts[0]?.id || ''
  });

  const getBookingFinancials = (b: any) => {
      const applicableTaxRate = b.taxSnapshot !== undefined ? b.taxSnapshot : (config.taxRate || 0);
      
      let subtotal = b.price;
      if (b.items && b.items.length > 0) {
          subtotal = b.items.reduce((acc: number, item: any) => acc + item.total, 0);
      }

      let discountAmount = 0;
      if (b.discount) {
          discountAmount = b.discount.type === 'PERCENT' 
            ? subtotal * (b.discount.value / 100) 
            : b.discount.value;
      }
      const afterDiscount = Math.max(0, subtotal - discountAmount);

      const taxAmount = afterDiscount * (applicableTaxRate / 100);
      const grandTotal = afterDiscount + taxAmount;
      const dueAmount = grandTotal - b.paidAmount;
      return { grandTotal, dueAmount };
  };

  const unpaidBookings = bookings.filter(b => {
      const { dueAmount } = getBookingFinancials(b);
      return dueAmount > 100 && b.status !== 'CANCELLED' && b.status !== 'REFUNDED'; 
  });

  const paidBookings = bookings.filter(b => {
      const { dueAmount } = getBookingFinancials(b);
      return dueAmount <= 100 && b.status !== 'CANCELLED' && b.status !== 'REFUNDED';
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalReceivable = unpaidBookings.reduce((sum, b) => sum + getBookingFinancials(b).dueAmount, 0);
  
  const displayBookings = invoiceFilter === 'UNPAID' ? unpaidBookings : paidBookings;

  const expenseBreakdown = useMemo(() => {
      const breakdown = new Map<string, number>();
      
      transactions
        .filter(t => t.type === 'EXPENSE')
        .forEach(t => {
            const cat = t.category || 'Other';
            const prev = breakdown.get(cat) || 0;
            breakdown.set(cat, prev + t.amount);
        });

      const colors = ['#f43f5e', '#f59e0b', '#3b82f6', '#a855f7', '#10b981', '#6366f1'];
      const data = Array.from(breakdown.entries()).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
      }));

      if (data.length === 0) return [{ name: 'No Data', value: 1, color: '#333' }];
      return data;
  }, [transactions]);
  
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-lumina-surface border border-lumina-highlight p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold font-display">{label}</p>
          <p className="text-emerald-400 text-sm">Income: Rp {(payload[0].value / 1000000).toFixed(1)}M</p>
          <p className="text-rose-400 text-sm">Exp: Rp {(payload[1].value / 1000000).toFixed(1)}M</p>
        </div>
      );
    }
    return null;
  };

  const handleTransferSubmit = () => {
      if (onTransfer && transferForm.amount) {
          onTransfer(transferForm.fromId, transferForm.toId, Number(transferForm.amount));
          setShowTransferModal(false);
          setTransferForm(prev => ({...prev, amount: ''}));
      }
  };

  const handleExpenseSubmit = () => {
      if (onRecordExpense && expenseForm.amount && expenseForm.description) {
          onRecordExpense({
              description: expenseForm.description,
              amount: Number(expenseForm.amount),
              category: expenseForm.category,
              accountId: expenseForm.accountId
          });
          setShowExpenseModal(false);
          setExpenseForm({ description: '', amount: '', category: 'Utilities & Rent', accountId: accounts[0]?.id || '' });
      }
  };

  const handleSettleSubmit = () => {
      if (onSettleBooking && settleForm.bookingId) {
          // Payment Validation
          if (settleForm.amount > 0 && settleForm.amount > settleForm.maxAmount) {
              alert("Amount exceeds remaining balance!");
              return;
          }
          
          // Refund Validation
          if (settleForm.amount < 0) {
              const refundAmount = Math.abs(settleForm.amount);
              if (refundAmount > settleForm.currentPaidAmount) {
                  alert(`Invalid Refund. You cannot refund more than the client has paid (Max Refund: Rp ${settleForm.currentPaidAmount.toLocaleString()}).`);
                  return;
              }

              const sourceAccount = accounts.find(a => a.id === settleForm.accountId);
              if (sourceAccount && sourceAccount.balance < refundAmount) {
                  alert(`Insufficient funds in ${sourceAccount.name} to process this refund.\nCurrent Balance: Rp ${sourceAccount.balance.toLocaleString()}`);
                  return;
              }
          }
          
          onSettleBooking(settleForm.bookingId, settleForm.amount, settleForm.accountId);
          setSettleForm({ bookingId: null, amount: 0, maxAmount: 0, currentPaidAmount: 0, accountId: accounts[0]?.id || '' });
      }
  };

  const handleExportCSV = () => {
      const headers = ['ID', 'Date', 'Description', 'Category', 'Amount', 'Type', 'Account', 'Status'];
      const rows = transactions.map(t => [
          t.id,
          new Date(t.date).toLocaleString(),
          (t.description || '').replace(/,/g, ''),
          t.category,
          t.amount,
          t.type,
          accounts.find(a => a.id === t.accountId)?.name || 'Unknown',
          t.status
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `lumina_finance_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  };

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
      {/* ... (Header and Tabs remain the same) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end shrink-0">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Financial Hub</h1>
          <p className="text-lumina-muted">Master your studio's cash flow, receivables, and profitability.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center text-sm"
          >
            <MinusCircle className="w-4 h-4 mr-2" />
            Record Expense
          </button>
          <button 
            onClick={() => setShowTransferModal(!showTransferModal)}
            className="bg-lumina-surface border border-lumina-highlight text-white hover:bg-lumina-highlight px-4 py-2 rounded-xl font-bold transition-all flex items-center text-sm"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transfer Funds
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-lumina-accent text-lumina-base px-4 py-2 rounded-xl font-bold transition-all flex items-center text-sm shadow-lg shadow-lumina-accent/10 hover:bg-lumina-accent/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      <div className="flex border-b border-lumina-highlight shrink-0 overflow-x-auto">
        {[
            { id: 'OVERVIEW', label: 'Overview', icon: Wallet },
            { id: 'INVOICES', label: 'Invoices', icon: FileText, count: unpaidBookings.length },
            { id: 'EXPENSES', label: 'Expense Analysis', icon: PieChart },
            { id: 'LEDGER', label: 'Transaction Ledger', icon: ArrowRightLeft },
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-bold text-sm transition-colors relative flex items-center whitespace-nowrap
                    ${activeTab === tab.id ? 'text-white' : 'text-lumina-muted hover:text-white'}`}
            >
                <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-lumina-accent' : ''}`} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-lumina-danger text-white text-[10px] rounded-full">{tab.count}</span>
                )}
                {activeTab === tab.id && <Motion.div layoutId="finTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-lumina-accent" />}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
      <AnimatePresence mode="wait">
        
        {/* ... (Overview tab remains unchanged) ... */}
        {activeTab === 'OVERVIEW' && (
            <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accounts.map((acc) => (
                    <Motion.div 
                        key={acc.id}
                        whileHover={{ y: -2 }}
                        className={`p-5 rounded-2xl border relative overflow-hidden group transition-all
                        ${acc.type === 'CASH' ? 'bg-gradient-to-br from-lumina-surface to-amber-950/20 border-amber-500/20' : 
                            acc.type === 'BANK' ? 'bg-gradient-to-br from-lumina-surface to-blue-950/20 border-blue-500/20' : 
                            'bg-lumina-surface border-lumina-highlight'}`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded border 
                                ${acc.type === 'CASH' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 
                                acc.type === 'BANK' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 
                                'text-lumina-muted border-lumina-highlight'}`}>
                                {(acc.type || 'BANK').replace('_', ' ')}
                            </span>
                            <Wallet className="text-lumina-muted w-5 h-5 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lumina-muted text-sm">{acc.name}</h3>
                        <p className="text-2xl font-display font-bold text-white mt-1">
                            Rp {acc.balance.toLocaleString('id-ID')}
                        </p>
                        <div className={`absolute bottom-0 left-0 w-full h-1 
                            ${acc.type === 'CASH' ? 'bg-amber-500' : acc.type === 'BANK' ? 'bg-blue-500' : 'bg-lumina-highlight'}`} 
                        />
                    </Motion.div>
                    ))}
                </div>

                {/* Charts and stats omitted for brevity, same as original */}
            </Motion.div>
        )}

        {activeTab === 'INVOICES' && (
            <Motion.div key="invoices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center bg-lumina-surface border border-lumina-highlight p-4 rounded-xl">
                    <div>
                        <h2 className="text-xl font-bold text-white">Invoice Management</h2>
                        <p className="text-sm text-lumina-muted">Track outstanding payments and paid history.</p>
                    </div>
                    <div className="flex bg-lumina-base p-1 rounded-lg border border-lumina-highlight">
                        <button 
                            onClick={() => setInvoiceFilter('UNPAID')}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${invoiceFilter === 'UNPAID' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}
                        >
                            <AlertCircle size={14} /> Outstanding
                        </button>
                        <button 
                            onClick={() => setInvoiceFilter('PAID')}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${invoiceFilter === 'PAID' ? 'bg-lumina-highlight text-emerald-400' : 'text-lumina-muted hover:text-white'}`}
                        >
                            <History size={14} /> Paid History
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayBookings.map((booking) => {
                        const { grandTotal, dueAmount } = getBookingFinancials(booking);
                        const percentagePaid = grandTotal > 0 ? (booking.paidAmount / grandTotal) * 100 : 100;
                        const isFullyPaid = dueAmount <= 100;

                        return (
                            <div key={booking.id} className={`bg-lumina-surface border rounded-2xl p-6 relative overflow-hidden group hover:border-lumina-accent/50 transition-all
                                ${isFullyPaid ? 'border-emerald-500/20' : 'border-lumina-highlight'}
                            `}>
                                <div className="absolute top-0 right-0 w-16 h-16 bg-lumina-accent/5 rounded-bl-full -mr-8 -mt-8"></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{booking.clientName}</h3>
                                        <p className="text-xs text-lumina-muted">{booking.package}</p>
                                        <p className="text-[10px] text-lumina-muted mt-0.5">{new Date(booking.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-mono 
                                        ${isFullyPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-lumina-highlight text-lumina-muted'}`}>
                                        #{booking.id.substring(0,6)}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-lumina-muted mb-1">
                                            <span className={isFullyPaid ? "text-emerald-500 font-bold" : ""}>{isFullyPaid ? 'Paid in Full' : `Paid: ${percentagePaid.toFixed(0)}%`}</span>
                                            <span>Total: Rp {grandTotal.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="w-full h-2 bg-lumina-base border border-lumina-highlight rounded-full overflow-hidden">
                                            <div className={`h-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percentagePaid}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-t border-b border-lumina-highlight/30">
                                        <span className="text-sm text-lumina-muted">Balance Due</span>
                                        <span className={`text-xl font-mono font-bold ${isFullyPaid ? 'text-emerald-500' : 'text-rose-400'}`}>
                                            Rp {dueAmount.toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        {!isFullyPaid ? (
                                            <button 
                                                onClick={() => setSettleForm({ bookingId: booking.id, amount: dueAmount, maxAmount: dueAmount, currentPaidAmount: booking.paidAmount, accountId: accounts[0]?.id || '' })}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-colors border border-emerald-500/20"
                                            >
                                                <CheckSquare size={14} />
                                                Settle
                                            </button>
                                        ) : (
                                            // Refund Option for Paid Bookings
                                            <button 
                                                onClick={() => setSettleForm({ bookingId: booking.id, amount: -booking.paidAmount, maxAmount: 0, currentPaidAmount: booking.paidAmount, accountId: accounts[0]?.id || '' })}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-colors border border-rose-500/20"
                                            >
                                                <RotateCcw size={14} />
                                                Refund
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setSelectedBookingForInvoice(booking)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-lumina-base hover:bg-lumina-highlight text-white text-xs font-bold rounded-lg transition-colors border border-lumina-highlight"
                                        >
                                            <FileInput size={14} />
                                            {isFullyPaid ? 'Receipt' : 'Invoice'}
                                        </button>
                                        <button 
                                            onClick={() => setSelectedBookingForWA(booking)}
                                            className="w-10 flex items-center justify-center py-2 bg-lumina-highlight hover:bg-lumina-highlight/80 text-white text-xs font-bold rounded-lg transition-colors border border-lumina-highlight"
                                        >
                                            <MessageCircle size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {displayBookings.length === 0 && (
                        <div className="col-span-full py-20 text-center text-lumina-muted border border-dashed border-lumina-highlight rounded-2xl">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-lumina-highlight" />
                            <p className="text-xl font-bold text-white">Nothing here</p>
                            <p>No {invoiceFilter === 'UNPAID' ? 'outstanding' : 'paid'} invoices found.</p>
                        </div>
                    )}
                </div>
            </Motion.div>
        )}

        {/* ... (Expenses and Ledger tabs remain the same) ... */}
        
      </AnimatePresence>
      </div>

      {/* ... (Transfer and Expense Modals) ... */}
      
      {settleForm.bookingId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
               <h2 className="text-2xl font-display font-bold text-white mb-4 text-emerald-400">
                   {settleForm.amount < 0 ? 'Process Refund' : 'Settle Balance'}
               </h2>
               <p className="text-sm text-lumina-muted mb-6">
                   {settleForm.amount < 0 
                        ? 'Issue a refund to the client. This will deduct from your account balance.' 
                        : 'Receive final payment from client.'}
               </p>

               <div className="space-y-4">
                    <div className="p-3 bg-lumina-base border border-lumina-highlight rounded-lg mb-4 flex justify-between items-center">
                         <span className="text-xs text-lumina-muted font-bold uppercase">Total Paid So Far:</span>
                         <span className="font-mono font-bold text-white">Rp {settleForm.currentPaidAmount.toLocaleString('id-ID')}</span>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-lumina-muted mb-1 block">Amount (IDR)</label>
                         <div className="relative">
                           <span className="absolute left-3 top-3 text-lumina-muted font-bold">Rp</span>
                           <input 
                                type="number" 
                                value={settleForm.amount}
                                onChange={e => setSettleForm({...settleForm, amount: Number(e.target.value)})}
                                className={`w-full bg-lumina-base border rounded-lg p-3 pl-10 text-white font-mono focus:outline-none 
                                    ${settleForm.amount < 0 ? 'border-rose-500/50 focus:border-rose-500' : 'border-lumina-highlight focus:border-lumina-accent'}
                                `}
                           />
                        </div>
                        {settleForm.amount > 0 && settleForm.amount > settleForm.maxAmount && (
                            <p className="text-[10px] text-rose-500 mt-1">Amount exceeds remaining balance.</p>
                        )}
                        {settleForm.amount < 0 && Math.abs(settleForm.amount) > settleForm.currentPaidAmount && (
                            <p className="text-[10px] text-rose-500 mt-1">Refund exceeds total paid amount (Max: Rp {settleForm.currentPaidAmount.toLocaleString()}).</p>
                        )}
                        {settleForm.amount < 0 && (
                            <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1"><RotateCcw size={10}/> Warning: Negative amount will be processed as REFUND.</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-wider text-lumina-muted mb-1 block">
                            {settleForm.amount < 0 ? 'Refund From Account' : 'Deposit To Account'}
                        </label>
                        <select 
                            value={settleForm.accountId}
                            onChange={e => setSettleForm({...settleForm, accountId: e.target.value})}
                            className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:outline-none focus:border-lumina-accent"
                        >
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (Rp {a.balance.toLocaleString()})</option>)}
                        </select>
                    </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mt-8">
                  <button onClick={() => setSettleForm({bookingId: null, amount: 0, maxAmount: 0, currentPaidAmount: 0, accountId: ''})} className="py-3 text-lumina-muted font-bold hover:text-white transition-colors">CANCEL</button>
                  <button 
                    onClick={handleSettleSubmit} 
                    disabled={
                        (settleForm.amount > 0 && settleForm.amount > settleForm.maxAmount) || 
                        (settleForm.amount < 0 && Math.abs(settleForm.amount) > settleForm.currentPaidAmount) ||
                        settleForm.amount === 0
                    }
                    className={`py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                        ${settleForm.amount < 0 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}
                    `}
                  >
                      {settleForm.amount < 0 ? 'CONFIRM REFUND' : 'CONFIRM PAYMENT'}
                  </button>
               </div>
            </Motion.div>
          </div>
      )}

      <InvoiceModal 
        isOpen={!!selectedBookingForInvoice}
        onClose={() => setSelectedBookingForInvoice(null)}
        booking={selectedBookingForInvoice}
        config={config}
      />

      <WhatsAppModal
        isOpen={!!selectedBookingForWA}
        onClose={() => setSelectedBookingForWA(null)}
        booking={selectedBookingForWA}
        config={config}
      />
    </div>
  );
};

export default FinanceView;
