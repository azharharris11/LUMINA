


import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowRightLeft, Wallet, FileText, AlertCircle, CheckCircle, ArrowUpRight, MessageCircle, FileInput, MinusCircle, CheckSquare, Search, Filter, Download, RotateCcw, Trash2, History, Upload, Repeat, Paperclip, ArrowDownLeft, Calendar, Edit2, Plus, X, Save } from 'lucide-react';
import { FinanceViewProps, Account } from '../types';
import { STUDIO_CONFIG } from '../data';
import InvoiceModal from '../components/InvoiceModal';
import WhatsAppModal from '../components/WhatsAppModal';

const Motion = motion as any;

const FinanceView: React.FC<FinanceViewProps> = ({ accounts, metrics, bookings, transactions = [], onTransfer, onRecordExpense, onSettleBooking, onDeleteTransaction, config, onAddAccount, onUpdateAccount }) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVOICES' | 'EXPENSES' | 'LEDGER'>('OVERVIEW');
  
  // Account Management State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState<Partial<Account>>({ name: '', type: 'BANK', balance: 0, accountNumber: '' });

  const [invoiceFilter, setInvoiceFilter] = useState<'UNPAID' | 'PAID'>('UNPAID');

  const [transferForm, setTransferForm] = useState({ fromId: accounts[1]?.id || '', toId: accounts[0]?.id || '', amount: '' });

  // Expense Form - Added Recurring & Receipt Support
  const [expenseForm, setExpenseForm] = useState({
      description: '',
      amount: '',
      category: 'Utilities & Rent',
      accountId: accounts[0]?.id || '',
      isRecurring: false,
      receiptUrl: ''
  });

  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<any | null>(null);
  const [selectedBookingForWA, setSelectedBookingForWA] = useState<any | null>(null);
  
  // Improved Settlement Form state
  const [settleForm, setSettleForm] = useState<{ bookingId: string | null, amount: number, maxAmount: number, currentPaidAmount: number, accountId: string, mode: 'PAYMENT' | 'REFUND' }>({
      bookingId: null, amount: 0, maxAmount: 0, currentPaidAmount: 0, accountId: accounts[0]?.id || '', mode: 'PAYMENT'
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

  const displayBookings = invoiceFilter === 'UNPAID' ? unpaidBookings : paidBookings;

  // --- CASH FLOW CHART DATA ---
  const cashFlowData = useMemo(() => {
      const dataMap = new Map<string, { date: string, income: number, expense: number }>();
      
      transactions.forEach(t => {
          const dateKey = new Date(t.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
          const entry = dataMap.get(dateKey) || { date: dateKey, income: 0, expense: 0 };
          
          if (t.type === 'INCOME') entry.income += t.amount;
          if (t.type === 'EXPENSE') entry.expense += t.amount;
          
          dataMap.set(dateKey, entry);
      });

      // Fill last 7 days if empty
      const result = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      return result.slice(-14); // Last 14 active days
  }, [transactions]);

  const expenseBreakdown = useMemo(() => {
      const breakdown = new Map<string, number>();
      transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            const cat = t.category || 'Other';
            breakdown.set(cat, (breakdown.get(cat) || 0) + t.amount);
      });
      const colors = ['#f43f5e', '#f59e0b', '#3b82f6', '#a855f7', '#10b981', '#6366f1'];
      return Array.from(breakdown.entries()).map(([name, value], index) => ({
          name, value, color: colors[index % colors.length]
      }));
  }, [transactions]);

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
              accountId: expenseForm.accountId,
              isRecurring: expenseForm.isRecurring,
              receiptUrl: expenseForm.receiptUrl
          });
          setShowExpenseModal(false);
          setExpenseForm({ description: '', amount: '', category: 'Utilities & Rent', accountId: accounts[0]?.id || '', isRecurring: false, receiptUrl: '' });
      }
  };

  const handleSettleSubmit = () => {
      if (onSettleBooking && settleForm.bookingId) {
          // Validation Logic
          if (settleForm.mode === 'PAYMENT') {
              if (settleForm.amount <= 0) { alert("Please enter a valid positive amount."); return; }
              if (settleForm.amount > settleForm.maxAmount) { alert("Amount exceeds remaining balance!"); return; }
              onSettleBooking(settleForm.bookingId, settleForm.amount, settleForm.accountId);
          } else {
              // REFUND Mode
              if (settleForm.amount <= 0) { alert("Please enter a valid positive amount to refund."); return; }
              if (settleForm.amount > settleForm.currentPaidAmount) { alert("Refund exceeds total paid amount."); return; }
              
              const sourceAccount = accounts.find(a => a.id === settleForm.accountId);
              if (sourceAccount && sourceAccount.balance < settleForm.amount) {
                  alert(`Insufficient funds in ${sourceAccount.name}.`); 
                  return;
              }
              // Pass as negative to handler
              onSettleBooking(settleForm.bookingId, -settleForm.amount, settleForm.accountId);
          }
          setSettleForm({ bookingId: null, amount: 0, maxAmount: 0, currentPaidAmount: 0, accountId: accounts[0]?.id || '', mode: 'PAYMENT' });
      }
  };

  const isOverdue = (dateStr: string) => {
      const due = new Date(dateStr);
      due.setDate(due.getDate() + (config.paymentDueDays || 0));
      return new Date() > due;
  };

  // Account Management Handlers
  const handleEditAccount = (acc: Account) => {
      setEditingAccount(acc);
      setAccountForm({ ...acc });
      setShowAccountModal(true);
  };

  const handleOpenAddAccount = () => {
      setEditingAccount(null);
      setAccountForm({ name: '', type: 'BANK', balance: 0, accountNumber: '' });
      setShowAccountModal(true);
  };

  const handleAccountSubmit = () => {
      if (editingAccount && onUpdateAccount) {
          onUpdateAccount({ ...editingAccount, ...accountForm } as Account);
      } else if (onAddAccount && accountForm.name) {
          onAddAccount({
              id: `acc-${Date.now()}`,
              name: accountForm.name!,
              type: accountForm.type as any,
              balance: Number(accountForm.balance),
              accountNumber: accountForm.accountNumber
          } as Account);
      }
      setShowAccountModal(false);
  };

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
      {/* Header */}
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
            <MinusCircle className="w-4 h-4 mr-2" /> Record Expense
          </button>
          <button 
            onClick={() => setShowTransferModal(!showTransferModal)}
            className="bg-lumina-surface border border-lumina-highlight text-white hover:bg-lumina-highlight px-4 py-2 rounded-xl font-bold transition-all flex items-center text-sm"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Funds
          </button>
        </div>
      </div>

      <div className="flex border-b border-lumina-highlight shrink-0 overflow-x-auto">
        {[
            { id: 'OVERVIEW', label: 'Overview', icon: Wallet },
            { id: 'INVOICES', label: 'Invoices', icon: FileText, count: unpaidBookings.length },
            { id: 'EXPENSES', label: 'Expense Analysis', icon: PieChart },
            { id: 'LEDGER', label: 'Ledger', icon: ArrowRightLeft },
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
        
        {activeTab === 'OVERVIEW' && (
            <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((acc) => (
                    <Motion.div 
                        key={acc.id}
                        whileHover={{ y: -2 }}
                        className="p-5 rounded-2xl border bg-lumina-surface border-lumina-highlight relative overflow-hidden group transition-all"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded border uppercase 
                                ${acc.type === 'CASH' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>
                                {(acc.type || 'BANK').replace('_', ' ')}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditAccount(acc)} className="p-1 hover:bg-lumina-highlight rounded text-lumina-muted hover:text-white transition-colors" title="Edit Account">
                                    <Edit2 size={14} />
                                </button>
                                <Wallet className="text-lumina-muted w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-lumina-muted text-sm">{acc.name}</h3>
                        <p className="text-2xl font-display font-bold text-white mt-1">
                            Rp {acc.balance.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-lumina-muted mt-1 font-mono">{acc.accountNumber}</p>
                    </Motion.div>
                    ))}
                    
                    {/* Add Account Button */}
                    <button
                        onClick={handleOpenAddAccount}
                        className="p-5 rounded-2xl border border-dashed border-lumina-highlight hover:border-lumina-accent hover:bg-lumina-highlight/10 flex flex-col items-center justify-center transition-all group min-h-[160px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-lumina-highlight/50 flex items-center justify-center mb-3 group-hover:bg-lumina-accent group-hover:text-lumina-base transition-colors">
                            <Plus size={24} className="text-lumina-muted group-hover:text-lumina-base" />
                        </div>
                        <span className="text-sm font-bold text-lumina-muted group-hover:text-white">Add New Account</span>
                    </button>
                </div>

                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><History size={18} className="text-lumina-accent"/> Cash Flow (Last 14 Days)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashFlowData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(str) => new Date(str).getDate().toString()} />
                                <YAxis stroke="#666" fontSize={12} tickFormatter={(val) => `${val/1000000}m`} />
                                <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #333', color: '#fff' }} />
                                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Motion.div>
        )}

        {activeTab === 'INVOICES' && (
            <Motion.div key="invoices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center bg-lumina-surface border border-lumina-highlight p-4 rounded-xl">
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
                        const overdue = isOverdue(booking.date);

                        return (
                            <div key={booking.id} className={`bg-lumina-surface border rounded-2xl p-6 relative overflow-hidden group transition-all
                                ${isFullyPaid ? 'border-emerald-500/20' : overdue ? 'border-rose-500/30 shadow-rose-500/5' : 'border-lumina-highlight hover:border-lumina-accent/50'}
                            `}>
                                {overdue && !isFullyPaid && (
                                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg z-10">OVERDUE</div>
                                )}
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{booking.clientName}</h3>
                                        <p className="text-xs text-lumina-muted">{booking.package} • {new Date(booking.date).toLocaleDateString()}</p>
                                    </div>
                                    {/* Quick Action for Unpaid: Full Settle */}
                                    {!isFullyPaid && (
                                        <button 
                                            onClick={() => setSettleForm({ bookingId: booking.id, amount: dueAmount, maxAmount: dueAmount, currentPaidAmount: booking.paidAmount, accountId: accounts[0]?.id || '', mode: 'PAYMENT' })}
                                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20 transition-colors"
                                            title="Quick Settle (Full Amount)"
                                        >
                                            <CheckSquare size={16} />
                                        </button>
                                    )}
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

                                    <div className="flex justify-between items-center py-3 border-t border-lumina-highlight/30">
                                        <span className="text-sm text-lumina-muted">Balance Due</span>
                                        <span className={`text-xl font-mono font-bold ${isFullyPaid ? 'text-emerald-500' : 'text-rose-400'}`}>
                                            Rp {dueAmount.toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex gap-2 flex-1">
                                            <button onClick={() => setSelectedBookingForInvoice(booking)} className="flex-1 py-2 bg-lumina-base hover:bg-lumina-highlight text-white text-xs font-bold rounded-lg border border-lumina-highlight">
                                                <FileInput size={14} className="inline mr-1"/> Invoice
                                            </button>
                                            <button onClick={() => setSelectedBookingForWA(booking)} className="py-2 px-3 bg-lumina-highlight hover:bg-emerald-500/20 hover:text-emerald-400 text-white text-xs font-bold rounded-lg border border-lumina-highlight transition-colors">
                                                <MessageCircle size={14} />
                                            </button>
                                        </div>
                                        
                                        {/* Secondary Menu for Refund / Partial */}
                                        {isFullyPaid && (
                                            <button 
                                                onClick={() => setSettleForm({ bookingId: booking.id, amount: 0, maxAmount: 0, currentPaidAmount: booking.paidAmount, accountId: accounts[0]?.id || '', mode: 'REFUND' })}
                                                className="py-2 px-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 text-xs font-bold"
                                            >
                                                Refund
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Motion.div>
        )}

        {activeTab === 'LEDGER' && (
            <Motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-lumina-surface border border-lumina-highlight rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-lumina-base text-lumina-muted uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Account</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Receipt</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-lumina-highlight/50">
                        {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                            <tr key={t.id} className="hover:bg-lumina-highlight/10 transition-colors group">
                                <td className="p-4 font-mono text-xs text-lumina-muted">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="p-4 font-bold text-white">{t.description}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded bg-lumina-highlight text-xs text-lumina-muted">{t.category}</span>
                                </td>
                                <td className="p-4 text-xs text-lumina-muted">
                                    {accounts.find(a => a.id === t.accountId)?.name}
                                </td>
                                <td className={`p-4 text-right font-mono font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'} Rp {t.amount.toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                    {t.receiptUrl ? (
                                        <a href={t.receiptUrl} target="_blank" className="text-blue-400 hover:underline text-xs flex items-center justify-center gap-1">
                                            <Paperclip size={12}/> View
                                        </a>
                                    ) : <span className="text-lumina-muted/30">-</span>}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => onDeleteTransaction && onDeleteTransaction(t.id)} className="text-lumina-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Motion.div>
        )}

        {/* EXPENSES TAB SAME AS BEFORE */}
        {activeTab === 'EXPENSES' && (
             <Motion.div key="expenses" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 {/* Existing Pie Chart Logic */}
                 <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 flex justify-center">
                    <PieChart width={400} height={400}>
                        <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {expenseBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                 </div>
             </Motion.div>
        )}
        
      </AnimatePresence>
      </div>

      {/* SETTLEMENT MODAL (Split Payment vs Refund) */}
      {settleForm.bookingId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
               <div className="flex justify-between items-center mb-4">
                   <h2 className={`text-2xl font-display font-bold ${settleForm.mode === 'REFUND' ? 'text-rose-500' : 'text-emerald-400'}`}>
                       {settleForm.mode === 'REFUND' ? 'Process Refund' : 'Receive Payment'}
                   </h2>
                   <button onClick={() => setSettleForm({...settleForm, bookingId: null})}><RotateCcw size={18} className="text-lumina-muted"/></button>
               </div>
               
               <div className="space-y-4">
                    <div className="p-3 bg-lumina-base border border-lumina-highlight rounded-lg mb-4 flex justify-between items-center">
                         <span className="text-xs text-lumina-muted font-bold uppercase">Current Paid:</span>
                         <span className="font-mono font-bold text-white">Rp {settleForm.currentPaidAmount.toLocaleString('id-ID')}</span>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-lumina-muted mb-1 block">Amount (Positive Value)</label>
                         <div className="relative">
                           <span className="absolute left-3 top-3 text-lumina-muted font-bold">Rp</span>
                           <input 
                                type="number" 
                                min="0"
                                value={settleForm.amount}
                                onChange={e => setSettleForm({...settleForm, amount: Number(e.target.value)})}
                                className={`w-full bg-lumina-base border rounded-lg p-3 pl-10 text-white font-mono focus:outline-none 
                                    ${settleForm.mode === 'REFUND' ? 'border-rose-500/50 focus:border-rose-500' : 'border-emerald-500/50 focus:border-emerald-500'}
                                `}
                           />
                        </div>
                        {settleForm.mode === 'PAYMENT' && settleForm.amount > settleForm.maxAmount && (
                            <p className="text-[10px] text-rose-500 mt-1">Amount exceeds remaining balance.</p>
                        )}
                        {settleForm.mode === 'REFUND' && settleForm.amount > settleForm.currentPaidAmount && (
                            <p className="text-[10px] text-rose-500 mt-1">Cannot refund more than paid amount.</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-wider text-lumina-muted mb-1 block">
                            {settleForm.mode === 'REFUND' ? 'Refund From Account' : 'Deposit To Account'}
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
                  <button onClick={() => setSettleForm({...settleForm, bookingId: null})} className="py-3 text-lumina-muted font-bold hover:text-white transition-colors">CANCEL</button>
                  <button 
                    onClick={handleSettleSubmit} 
                    className={`py-3 text-white rounded-xl font-bold transition-colors shadow-lg
                        ${settleForm.mode === 'REFUND' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}
                    `}
                  >
                      CONFIRM
                  </button>
               </div>
            </Motion.div>
          </div>
      )}

      {/* EXPENSE MODAL (Updated) */}
      {showExpenseModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <Motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-4">Record Expense</h2>
                  <div className="space-y-4">
                      <input className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" placeholder="Description (e.g. Electricity Bill)" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                          <input type="number" className="bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                          <select className="bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                              <option>Utilities & Rent</option>
                              <option>Equipment Maint.</option>
                              <option>Marketing / Ads</option>
                              <option>Staff Salaries</option>
                              <option>Consumables</option>
                              <option>Other</option>
                          </select>
                      </div>
                      
                      {/* New Features */}
                      <div className="flex items-center justify-between p-3 bg-lumina-base rounded-lg border border-lumina-highlight">
                          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                              <input type="checkbox" checked={expenseForm.isRecurring} onChange={e => setExpenseForm({...expenseForm, isRecurring: e.target.checked})} className="rounded bg-lumina-surface border-lumina-highlight text-lumina-accent"/>
                              <span>Recurring Monthly</span>
                          </label>
                          <Repeat size={16} className="text-lumina-muted"/>
                      </div>

                      <div className="p-3 bg-lumina-base rounded-lg border border-dashed border-lumina-highlight flex items-center justify-center cursor-pointer hover:border-lumina-accent transition-colors">
                          <div className="text-center">
                              <Upload size={20} className="mx-auto text-lumina-muted mb-1"/>
                              <p className="text-xs text-lumina-muted">Upload Receipt (Simulation)</p>
                          </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                          <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 text-lumina-muted font-bold">Cancel</button>
                          <button onClick={handleExpenseSubmit} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600">Save Expense</button>
                      </div>
                  </div>
              </Motion.div>
          </div>
      )}

      {/* MANAGE ACCOUNT MODAL */}
      <AnimatePresence>
          {showAccountModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <Motion.div 
                    initial={{scale:0.95, opacity:0}} 
                    animate={{scale:1, opacity:1}} 
                    exit={{scale:0.95, opacity:0}}
                    className="bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
                  >
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-white">{editingAccount ? 'Edit Account' : 'Add New Account'}</h2>
                          <button onClick={() => setShowAccountModal(false)} className="text-lumina-muted hover:text-white"><X size={20}/></button>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Account Name</label>
                              <input 
                                  className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                  placeholder="e.g. BCA Main"
                                  value={accountForm.name}
                                  onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Type</label>
                                  <select 
                                      className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                      value={accountForm.type}
                                      onChange={e => setAccountForm({...accountForm, type: e.target.value as any})}
                                  >
                                      <option value="BANK">Bank</option>
                                      <option value="CASH">Cash</option>
                                      <option value="PETTY_CASH">Petty Cash</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Initial/Current Balance</label>
                                  <input 
                                      type="number"
                                      className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                      value={accountForm.balance}
                                      onChange={e => setAccountForm({...accountForm, balance: Number(e.target.value)})}
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Account Number (Optional)</label>
                              <input 
                                  className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                  placeholder="e.g. 123-456-789"
                                  value={accountForm.accountNumber || ''}
                                  onChange={e => setAccountForm({...accountForm, accountNumber: e.target.value})}
                              />
                          </div>
                          
                          <button 
                              onClick={handleAccountSubmit}
                              className="w-full py-3 bg-lumina-accent text-lumina-base font-bold rounded-xl hover:bg-lumina-accent/90 transition-colors mt-4 shadow-lg shadow-lumina-accent/10"
                          >
                              {editingAccount ? 'Update Account' : 'Create Account'}
                          </button>
                      </div>
                  </Motion.div>
              </div>
          )}
      </AnimatePresence>

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
