
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ProjectStatus, User, BookingFile, StudioConfig, Package, BookingItem, BookingTask, ActivityLog, Asset, BookingComment, Discount, TimeLog, Transaction, Account } from '../types';
import { X, Image as ImageIcon, FileSignature, Clock, CheckCircle2, Circle, Upload, PenTool, Download, Calendar, Save, Trash2, Edit, Plus, Loader2, FileText, ExternalLink, Paperclip, Check, Send, RefreshCw, AlertCircle, Lock, Timer, ListChecks, History, DollarSign, User as UserIcon, MapPin, Briefcase, Camera, Box, Wrench, AlertTriangle, TrendingUp, Tag, MessageSquare, Play, Square, Pause, PieChart, MinusCircle, ChevronRight } from 'lucide-react';

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  photographer: User | undefined;
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking?: (id: string) => void;
  bookings?: Booking[]; 
  config?: StudioConfig; 
  packages?: Package[]; 
  currentUser?: User;
  assets?: Asset[];
  users?: User[];
  transactions?: Transaction[];
  onAddTransaction?: (data: { description: string; amount: number; category: string; accountId: string; bookingId?: string }) => void;
  accounts?: Account[];
}

type Tab = 'OVERVIEW' | 'TASKS' | 'MOODBOARD' | 'CONTRACT' | 'TIMELINE' | 'LOGS' | 'DISCUSSION' | 'PROFITABILITY';

const Motion = motion as any;

const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ isOpen, onClose, booking, photographer, onUpdateBooking, onDeleteBooking, bookings = [], config, packages = [], currentUser, assets = [], users = [], transactions = [], onAddTransaction, accounts = [] }) => {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  
  const [isLogisticsEditing, setIsLogisticsEditing] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState<{
      date: string;
      timeStart: string;
      duration: number;
      studio: string;
      photographerId: string;
  }>({ date: '', timeStart: '', duration: 1, studio: '', photographerId: '' });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newLineItem, setNewLineItem] = useState<Partial<BookingItem>>({ description: '', quantity: 1, unitPrice: 0, cost: 0 });
  const [editDiscount, setEditDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Production Cost', accountId: accounts[0]?.id || '' });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [revenueWarning, setRevenueWarning] = useState<string | null>(null);

  const [activeTimerStart, setActiveTimerStart] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (booking) {
      setActiveTab('OVERVIEW');
      setLogisticsForm({
          date: booking.date,
          timeStart: booking.timeStart,
          duration: booking.duration,
          studio: booking.studio,
          photographerId: booking.photographerId
      });
      setIsLogisticsEditing(false);
      setRescheduleError(null);
      setRevenueWarning(null);
      setEditDiscount(booking.discount || { type: 'FIXED', value: 0 });
      setNewExpense({ description: '', amount: 0, category: 'Production Cost', accountId: accounts[0]?.id || '' });
      
      setActiveTimerStart(null);
      setElapsedSeconds(0);
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [booking, isOpen]);

  useEffect(() => {
      return () => {
          if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
  }, []);

  const createLocalLog = (action: string, details?: string): ActivityLog => ({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'System'
  });

  const handleStatusChange = (status: ProjectStatus) => {
      if (booking) {
          const log = createLocalLog('STATUS_CHANGE', `Status updated to ${status}`);
          onUpdateBooking({ ...booking, status, logs: [log, ...(booking.logs || [])] });
      }
  };

  const checkRescheduleConflict = () => {
      if (!bookings) return null;
      
      const BUFFER_MINUTES = config?.bufferMinutes || 15;
      const [startH, startM] = logisticsForm.timeStart.split(':').map(Number);
      const newStartTime = startH * 60 + startM;
      const newEndTime = newStartTime + (logisticsForm.duration * 60);

      const STUDIO_OPEN_HOUR = 8;
      const STUDIO_CLOSE_HOUR = 22;
      if (newStartTime < STUDIO_OPEN_HOUR * 60 || newEndTime > STUDIO_CLOSE_HOUR * 60) {
          return `Operating Hours: Studio is open from ${STUDIO_OPEN_HOUR}:00 to ${STUDIO_CLOSE_HOUR}:00`;
      }

      const staffMember = users.find(u => u.id === logisticsForm.photographerId);
      if (staffMember) {
          if (staffMember.status !== 'ACTIVE') {
              return `Staff Unavailable: ${staffMember.name} is currently marked as ${staffMember.status}`;
          }
          if (staffMember.unavailableDates && staffMember.unavailableDates.includes(logisticsForm.date)) {
              return `Staff Unavailable: ${staffMember.name} has blocked this date (Off-day).`;
          }
      }

      const others = bookings.filter(b => 
          b.id !== booking?.id && 
          b.date === logisticsForm.date && 
          b.status !== 'CANCELLED'
      );

      for (const b of others) {
          const [bStartH, bStartM] = b.timeStart.split(':').map(Number);
          const bStartTime = bStartH * 60 + bStartM;
          const bEndTime = bStartTime + (b.duration * 60);
          
          const bStartWithBuffer = bStartTime - BUFFER_MINUTES;
          const bEndWithBuffer = bEndTime + BUFFER_MINUTES;
          
          const isOverlapping = (newStartTime < bEndWithBuffer) && (newEndTime > bStartWithBuffer);

          if (isOverlapping) {
              if (b.studio === logisticsForm.studio) {
                  return `Studio Conflict: ${b.studio} is booked by ${b.clientName} (${b.timeStart}).`;
              }
              if (b.photographerId === logisticsForm.photographerId) {
                  return `Staff Conflict: Photographer is busy with ${b.clientName} (${b.timeStart}).`;
              }
          }
      }
      return null;
  };

  const getUnavailableAssets = useMemo(() => {
      if (!booking || !bookings) return new Map<string, string>(); 

      const unavailableMap = new Map<string, string>();
      const targetDate = isLogisticsEditing ? logisticsForm.date : booking.date;
      const targetTime = isLogisticsEditing ? logisticsForm.timeStart : booking.timeStart;
      const targetDuration = isLogisticsEditing ? logisticsForm.duration : booking.duration;

      const [startH, startM] = targetTime.split(':').map(Number);
      const myStart = startH * 60 + startM;
      const myEnd = myStart + (targetDuration * 60);

      const overlaps = bookings.filter(b => {
          if (b.id === booking.id) return false; 
          if (b.date !== targetDate) return false;
          if (b.status === 'CANCELLED' || b.status === 'COMPLETED') return false; 

          const [bStartH, bStartM] = b.timeStart.split(':').map(Number);
          const bStart = bStartH * 60 + bStartM;
          const bEnd = bStart + (b.duration * 60);

          return (myStart < bEnd) && (myEnd > bStart);
      });

      overlaps.forEach(b => {
          if (b.assetIds) {
              b.assetIds.forEach(assetId => {
                  unavailableMap.set(assetId, b.clientName);
              });
          }
      });

      return unavailableMap;
  }, [bookings, booking, logisticsForm, isLogisticsEditing]);

  const startTimer = () => {
      if (!activeTimerStart) {
          setActiveTimerStart(Date.now());
          timerIntervalRef.current = window.setInterval(() => {
              setElapsedSeconds(prev => prev + 1);
          }, 1000);
      }
  };

  const stopTimer = () => {
      if (activeTimerStart && booking) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          
          const endTime = Date.now();
          const durationMins = Math.round((endTime - activeTimerStart) / 1000 / 60);
          
          const newTimeLog: TimeLog = {
              id: `tl-${Date.now()}`,
              userId: currentUser?.id || 'unknown',
              userName: currentUser?.name || 'Unknown',
              startTime: new Date(activeTimerStart).toISOString(),
              endTime: new Date(endTime).toISOString(),
              durationMinutes: durationMins || 1, // Minimum 1 min
              notes: 'Manual timer entry'
          };

          const log = createLocalLog('WORK_LOGGED', `Recorded ${durationMins} minutes of work.`);
          
          onUpdateBooking({
              ...booking,
              timeLogs: [newTimeLog, ...(booking.timeLogs || [])],
              logs: [log, ...(booking.logs || [])]
          });

          setActiveTimerStart(null);
          setElapsedSeconds(0);
      }
  };

  const formatTimer = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const getTotalTrackedTime = () => {
      if (!booking?.timeLogs) return 0;
      return booking.timeLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  };

  const handleSaveLogistics = () => {
      if (booking) {
          const conflict = checkRescheduleConflict();
          if (conflict) {
              setRescheduleError(conflict);
              return;
          }

          if (logisticsForm.duration > booking.duration) {
               const extraHours = logisticsForm.duration - booking.duration;
               setRevenueWarning(`Duration increased by ${extraHours}h. Don't forget to add an Overtime Fee in Financials.`);
          } else {
               setRevenueWarning(null);
          }

          const log = createLocalLog('RESCHEDULED', `Logistics updated: ${logisticsForm.date} @ ${logisticsForm.timeStart} in ${logisticsForm.studio}`);
          onUpdateBooking({
              ...booking,
              ...logisticsForm,
              logs: [log, ...(booking.logs || [])]
          });
          setIsLogisticsEditing(false);
          setRescheduleError(null);
      }
  };

  const handleDelete = () => {
      if (booking && onDeleteBooking) {
          if (window.confirm('Delete this project permanently?')) {
              onDeleteBooking(booking.id);
              onClose();
          }
      }
  };

  const addLineItem = () => {
      if (booking && newLineItem.description && newLineItem.unitPrice !== undefined) {
          let currentItems = [...(booking.items || [])];

          if (currentItems.length === 0 && booking.price > 0) {
              currentItems.push({
                  id: `item-base-${booking.id}`,
                  description: `${booking.package} (Base Package)`,
                  quantity: 1,
                  unitPrice: booking.price,
                  total: booking.price,
                  cost: 0 
              });
          }

          const newItem: BookingItem = {
              id: `item-${Date.now()}`,
              description: newLineItem.description,
              quantity: newLineItem.quantity || 1,
              unitPrice: newLineItem.unitPrice,
              total: (newLineItem.quantity || 1) * newLineItem.unitPrice,
              cost: newLineItem.cost || 0 // Add COGS
          };

          const updatedItems = [...currentItems, newItem];
          const newTotalPrice = updatedItems.reduce((sum, i) => sum + i.total, 0);

          const log = createLocalLog('ITEM_ADDED', `Added: ${newItem.description} (+Rp ${newItem.total.toLocaleString()})`);

          onUpdateBooking({
              ...booking,
              items: updatedItems,
              price: newTotalPrice,
              logs: [log, ...(booking.logs || [])]
          });

          setNewLineItem({ description: '', quantity: 1, unitPrice: 0, cost: 0 });
      }
  };

  const removeLineItem = (itemId: string) => {
      if (booking && booking.items) {
          const itemToRemove = booking.items.find(i => i.id === itemId);
          const updatedItems = booking.items.filter(i => i.id !== itemId);
          const newTotalPrice = updatedItems.reduce((sum, i) => sum + i.total, 0);

          const log = createLocalLog('ITEM_REMOVED', `Removed: ${itemToRemove?.description}`);

          onUpdateBooking({
              ...booking,
              items: updatedItems,
              price: newTotalPrice,
              logs: [log, ...(booking.logs || [])]
          });
      }
  };
  
  const saveDiscount = () => {
      if (booking) {
          const log = createLocalLog('DISCOUNT_UPDATED', `Set to ${editDiscount.type === 'PERCENT' ? editDiscount.value + '%' : 'Rp ' + editDiscount.value}`);
          onUpdateBooking({
              ...booking,
              discount: editDiscount,
              logs: [log, ...(booking.logs || [])]
          });
      }
  }

  const handleAddExpense = () => {
      if (onAddTransaction && booking && newExpense.description && newExpense.amount > 0) {
          onAddTransaction({
              description: newExpense.description,
              amount: newExpense.amount,
              category: newExpense.category,
              accountId: newExpense.accountId,
              bookingId: booking.id
          });
          setNewExpense({ description: '', amount: 0, category: 'Production Cost', accountId: accounts[0]?.id || '' });
      }
  }

  const toggleAsset = (assetId: string, isBlocked: boolean) => {
      if (isBlocked) {
          alert("This asset is booked by another project at the same time.");
          return;
      }

      if (booking) {
          const currentAssets = booking.assetIds || [];
          const exists = currentAssets.includes(assetId);
          
          let newAssets;
          if (exists) {
              newAssets = currentAssets.filter(id => id !== assetId);
          } else {
              newAssets = [...currentAssets, assetId];
          }
          
          onUpdateBooking({
              ...booking,
              assetIds: newAssets
          });
      }
  };

  const toggleTask = (taskId: string) => {
      if (booking && booking.tasks) {
          const updatedTasks = booking.tasks.map(t => 
              t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          
          const task = booking.tasks.find(t => t.id === taskId);
          const log = createLocalLog('TASK_UPDATE', `${task?.title} marked as ${!task?.completed ? 'Done' : 'Pending'}`);

          onUpdateBooking({
              ...booking,
              tasks: updatedTasks,
              logs: [log, ...(booking.logs || [])]
          });
      }
  };

  const addTask = () => {
      if (booking && newTaskTitle.trim()) {
          const newTask: BookingTask = {
              id: `t-${Date.now()}`,
              title: newTaskTitle,
              completed: false,
              assignedTo: currentUser?.id
          };
          
          const log = createLocalLog('TASK_ADDED', `New Task: ${newTaskTitle}`);

          onUpdateBooking({
              ...booking,
              tasks: [newTask, ...(booking.tasks || [])],
              logs: [log, ...(booking.logs || [])]
          });
          setNewTaskTitle('');
      }
  };

  const addComment = () => {
      if (booking && newComment.trim()) {
          const comment: BookingComment = {
              id: `c-${Date.now()}`,
              text: newComment,
              userId: currentUser?.id || 'sys',
              userName: currentUser?.name || 'System',
              timestamp: new Date().toISOString()
          };
          
          onUpdateBooking({
              ...booking,
              comments: [comment, ...(booking.comments || [])]
          });
          setNewComment('');
      }
  };

  const signContract = () => {
      if (booking) {
          const log = createLocalLog('CONTRACT_SIGNED', 'Digital signature captured');
          onUpdateBooking({
              ...booking,
              contractStatus: 'SIGNED',
              contractSignedDate: new Date().toISOString(),
              logs: [log, ...(booking.logs || [])]
          });
      }
  }

  const handleFileUpload = () => {
      setIsUploading(true);
      setTimeout(() => {
          if (booking) {
              const newFile: BookingFile = {
                  id: `f-${Date.now()}`,
                  name: `Upload_${new Date().getTime()}.jpg`,
                  url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2',
                  type: 'image/jpeg',
                  size: '2.4 MB',
                  uploadedAt: new Date().toISOString()
              };
              onUpdateBooking({
                  ...booking,
                  files: [...(booking.files || []), newFile]
              });
          }
          setIsUploading(false);
      }, 1500);
  };

  const getTabStyle = (tab: Tab) => `px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-lumina-accent text-white' : 'border-transparent text-lumina-muted hover:text-white'}`;
  const getStatusColor = (status: ProjectStatus) => {
      switch(status) {
          case 'INQUIRY': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
          case 'SHOOTING': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
          case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
          case 'CANCELLED': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
          default: return 'bg-lumina-highlight text-white border-lumina-highlight';
      }
  }

  if (!isOpen || !booking) return null;

  // Calculate Tax for Overview
  const currentItems = booking.items || [];
  const calculatedSubtotal = currentItems.length > 0 
      ? currentItems.reduce((acc, item) => acc + item.total, 0)
      : booking.price;

  const currentDiscount = booking.discount || { type: 'FIXED', value: 0 };
  const discountAmount = currentDiscount.type === 'PERCENT' 
    ? calculatedSubtotal * (currentDiscount.value / 100) 
    : currentDiscount.value;

  const subtotalAfterDiscount = Math.max(0, calculatedSubtotal - discountAmount);

  const taxRate = booking.taxSnapshot !== undefined ? booking.taxSnapshot : (config?.taxRate || 0);
  const taxAmount = subtotalAfterDiscount * (taxRate / 100);
  const grandTotal = subtotalAfterDiscount + taxAmount;

  // PROFIT & LOSS CALCULATIONS
  const projectExpenses = transactions.filter(t => t.bookingId === booking.id && t.type === 'EXPENSE');
  const totalDirectExpenses = projectExpenses.reduce((acc, t) => acc + t.amount, 0);

  let packageCostBreakdown: any[] = [];
  let isUsingSnapshot = false;

  if (booking.costSnapshot && booking.costSnapshot.length > 0) {
      packageCostBreakdown = booking.costSnapshot;
      isUsingSnapshot = true;
  } else {
      const matchedPackage = packages?.find(p => p.name === booking.package);
      packageCostBreakdown = matchedPackage?.costBreakdown || [];
  }
  
  const totalBaseCost = packageCostBreakdown.reduce((acc, item) => acc + item.amount, 0);
  const totalCustomItemCost = currentItems.reduce((acc, item) => acc + (item.cost || 0), 0);

  // FIX: Calculate Labor Costs based on NET PROFIT, not Gross Revenue
  // Net Sales Base = Revenue - COGS (Base Cost + Custom Item Cost + Direct Expenses)
  const netSalesBase = Math.max(0, grandTotal - (totalBaseCost + totalCustomItemCost + totalDirectExpenses));

  const photographerCommission = photographer?.commissionRate ? netSalesBase * (photographer.commissionRate / 100) : 0;
  let editorCommission = 0;
  if (booking.editorId) {
      const editor = users.find(u => u.id === booking.editorId);
      if (editor?.commissionRate) {
          editorCommission = netSalesBase * (editor.commissionRate / 100);
      }
  }
  const totalLaborCost = photographerCommission + editorCommission;
  
  const totalCost = totalDirectExpenses + totalLaborCost + totalBaseCost + totalCustomItemCost;
  const netProfit = grandTotal - totalCost;
  const profitMargin = grandTotal > 0 ? (netProfit / grandTotal) * 100 : 0;

  const trackedMinutes = getTotalTrackedTime();
  const plannedMinutes = booking.duration * 60;
  const canSeeProfit = currentUser?.role === 'OWNER' || currentUser?.role === 'FINANCE';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <Motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-lumina-surface border-l border-lumina-highlight h-full shadow-2xl flex flex-col"
      >
        <div className="flex-none p-6 border-b border-lumina-highlight bg-lumina-base relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl opacity-10 rounded-full -mt-20 -mr-20 pointer-events-none 
                ${booking.status === 'COMPLETED' ? 'bg-emerald-500' : booking.status === 'CANCELLED' ? 'bg-rose-500' : 'bg-lumina-accent'}`}>
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                     <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-lumina-accent text-xs">#{booking.id.substring(0,6).toUpperCase()}</span>
                        {booking.status === 'INQUIRY' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-bold border border-emerald-500/30">Lead</span>}
                     </div>
                    <h2 className="text-3xl font-bold text-white font-display mb-2">{booking.clientName}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-lumina-muted flex items-center gap-1">
                            <Briefcase size={14} /> {booking.package}
                        </span>
                        <span className="text-lumina-muted flex items-center gap-1">
                            <MapPin size={14} /> {booking.studio}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-lumina-muted hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-6 relative z-10">
                 <div className="relative group">
                    <select 
                        value={booking.status}
                        onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                        className={`appearance-none pl-3 pr-8 py-2 text-xs font-bold uppercase rounded-lg border cursor-pointer outline-none focus:ring-2 focus:ring-white/20 transition-all ${getStatusColor(booking.status)}`}
                    >
                        <option value="INQUIRY">Inquiry</option>
                        <option value="BOOKED">Booked</option>
                        <option value="SHOOTING">Shooting</option>
                        <option value="CULLING">Culling</option>
                        <option value="EDITING">Editing</option>
                        <option value="REVIEW">Review</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs font-bold text-lumina-muted bg-lumina-surface/50 px-3 py-2 rounded-lg border border-lumina-highlight">
                    <UserIcon size={14} />
                    {photographer?.name.split(' ')[0] || 'Unassigned'}
                 </div>

                 <div className="flex-1"></div>

                 {booking.paidAmount < grandTotal && booking.status !== 'CANCELLED' && (
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-bold animate-pulse">
                         <AlertCircle size={14} /> Unpaid Balance
                     </div>
                 )}
            </div>
        </div>

        <div className="flex-none bg-lumina-surface border-b border-lumina-highlight sticky top-0 z-20 shadow-lg">
            <div className="flex px-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('OVERVIEW')} className={getTabStyle('OVERVIEW')}>Overview</button>
                {canSeeProfit && <button onClick={() => setActiveTab('PROFITABILITY')} className={getTabStyle('PROFITABILITY')}>Profitability</button>}
                <button onClick={() => setActiveTab('TASKS')} className={getTabStyle('TASKS')}>Tasks</button>
                <button onClick={() => setActiveTab('DISCUSSION')} className={getTabStyle('DISCUSSION')}>Discussion</button>
                <button onClick={() => setActiveTab('LOGS')} className={getTabStyle('LOGS')}>Activity Log</button>
                <button onClick={() => setActiveTab('MOODBOARD')} className={getTabStyle('MOODBOARD')}>Moodboard</button>
                <button onClick={() => setActiveTab('CONTRACT')} className={getTabStyle('CONTRACT')}>Contract</button>
                <button onClick={() => setActiveTab('TIMELINE')} className={getTabStyle('TIMELINE')}>Files</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-lumina-surface">
            
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4 flex flex-col justify-between">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <p className="text-[10px] text-lumina-muted uppercase font-bold mb-1">Time Tracking</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-mono font-bold ${activeTimerStart ? 'text-emerald-400 animate-pulse' : 'text-white'}`}>
                                            {activeTimerStart ? formatTimer(elapsedSeconds) : `${Math.floor(trackedMinutes/60)}h ${trackedMinutes%60}m`}
                                        </span>
                                        <span className="text-xs text-lumina-muted">/ {booking.duration}h</span>
                                    </div>
                                 </div>
                                 <Timer size={18} className="text-lumina-muted" />
                             </div>
                             
                            {activeTimerStart ? (
                                <button onClick={stopTimer} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-lg hover:bg-rose-500 hover:text-white transition-all font-bold text-xs">
                                    <Square size={12} fill="currentColor" /> Stop Timer
                                </button>
                            ) : (
                                <button onClick={startTimer} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500 hover:text-white transition-all font-bold text-xs">
                                    <Play size={12} fill="currentColor" /> Start Work
                                </button>
                            )}
                        </div>

                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4 relative group">
                             <button 
                                onClick={() => setIsLogisticsEditing(true)}
                                className="absolute top-2 right-2 p-1.5 text-lumina-muted hover:text-white hover:bg-lumina-highlight rounded opacity-0 group-hover:opacity-100 transition-all"
                             >
                                 <Edit size={14} />
                             </button>
                             
                             <div className="space-y-3">
                                 <div>
                                     <span className="text-[10px] text-lumina-muted uppercase font-bold block">Session</span>
                                     <div className="flex items-center gap-2 text-white text-sm font-bold">
                                         <Calendar size={14} className="text-lumina-accent" />
                                         {booking.date} @ {booking.timeStart}
                                     </div>
                                 </div>
                                 <div>
                                     <span className="text-[10px] text-lumina-muted uppercase font-bold block">Location</span>
                                     <div className="flex items-center gap-2 text-white text-sm font-bold">
                                         <MapPin size={14} className="text-lumina-accent" />
                                         {booking.studio} ({booking.duration}h)
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <AnimatePresence>
                    {isLogisticsEditing && (
                        <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-lumina-highlight/10 border border-lumina-highlight rounded-xl p-4 mb-4">
                                <h4 className="font-bold text-white text-xs uppercase mb-3">Reschedule Session</h4>
                                {rescheduleError && (
                                     <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-200 text-xs">
                                         <AlertCircle size={14} className="shrink-0" />
                                         {rescheduleError}
                                     </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[10px] text-lumina-muted uppercase font-bold block mb-1">Date</label>
                                        <input type="date" className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white text-xs" value={logisticsForm.date} onChange={e => setLogisticsForm({...logisticsForm, date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-lumina-muted uppercase font-bold block mb-1">Time</label>
                                        <input type="time" className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white text-xs" value={logisticsForm.timeStart} onChange={e => setLogisticsForm({...logisticsForm, timeStart: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-lumina-muted uppercase font-bold block mb-1">Studio</label>
                                        <select className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white text-xs" value={logisticsForm.studio} onChange={e => setLogisticsForm({...logisticsForm, studio: e.target.value})}>
                                            {config?.rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-lumina-muted uppercase font-bold block mb-1">Duration (h)</label>
                                        <input type="number" step="0.5" className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white text-xs" value={logisticsForm.duration} onChange={e => setLogisticsForm({...logisticsForm, duration: Number(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsLogisticsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-lumina-muted hover:text-white">Cancel</button>
                                    <button onClick={handleSaveLogistics} className="px-3 py-1.5 bg-lumina-accent text-lumina-base text-xs font-bold rounded hover:bg-lumina-accent/90">Confirm Changes</button>
                                </div>
                            </div>
                        </Motion.div>
                    )}
                    </AnimatePresence>

                    <div className="bg-lumina-highlight/10 border border-lumina-highlight rounded-xl overflow-hidden">
                        <div className="p-3 border-b border-lumina-highlight bg-lumina-base/30 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Camera size={14} className="text-blue-400" /> Equipment Packing List
                            </h3>
                            <span className="text-[10px] font-mono bg-lumina-base px-1.5 py-0.5 rounded text-lumina-muted border border-lumina-highlight">
                                {booking.assetIds?.length || 0} Items
                            </span>
                        </div>
                        <div className="p-3 max-h-40 overflow-y-auto custom-scrollbar">
                             {assets.length === 0 ? (
                                 <p className="text-xs text-lumina-muted italic text-center py-2">No inventory items available.</p>
                             ) : (
                                 <div className="grid grid-cols-2 gap-2">
                                     {assets.map(asset => {
                                         const isSelected = booking.assetIds?.includes(asset.id);
                                         const isBroken = asset.status !== 'AVAILABLE' && asset.status !== 'IN_USE';
                                         const bookedBy = getUnavailableAssets.get(asset.id);
                                         const isConflict = !!bookedBy;
                                         const isBlocked = isBroken || (isConflict && !isSelected);

                                         return (
                                             <button 
                                                key={asset.id}
                                                disabled={isBlocked}
                                                onClick={() => toggleAsset(asset.id, isBlocked)}
                                                className={`flex items-center gap-2 p-2 rounded text-left transition-colors border relative
                                                    ${isSelected 
                                                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-100' 
                                                        : isBlocked 
                                                            ? 'bg-lumina-base/50 border-lumina-highlight opacity-50 cursor-not-allowed'
                                                            : 'bg-lumina-base border-lumina-highlight text-lumina-muted hover:border-lumina-muted'}
                                                `}
                                             >
                                                 <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-400 bg-blue-400' : 'border-lumina-muted'}`}>
                                                     {isSelected && <Check size={8} className="text-black" />}
                                                 </div>
                                                 <div className="truncate flex-1">
                                                     <div className="text-xs font-bold truncate flex items-center gap-1">
                                                         {asset.name}
                                                         {isBroken && <Wrench size={10} className="text-amber-500"/>}
                                                         {isConflict && !isSelected && <Lock size={10} className="text-rose-500"/>}
                                                     </div>
                                                 </div>
                                             </button>
                                         );
                                     })}
                                 </div>
                             )}
                        </div>
                    </div>

                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-lumina-highlight bg-lumina-base flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                <DollarSign size={16} className="text-emerald-400" /> Billing Details
                            </h3>
                            <span className="text-xs font-mono text-lumina-muted">{(booking.items || []).length} Items</span>
                        </div>
                        
                        <div className="p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                            <div className="space-y-1 mb-6 font-mono text-xs">
                                {(booking.items || []).length === 0 && (
                                    <div className="py-2 text-lumina-muted italic flex justify-between items-center border-b border-lumina-highlight/30 border-dashed">
                                        <span>Base Package: {booking.package}</span>
                                        <span className="text-white">Rp {booking.price.toLocaleString()}</span>
                                    </div>
                                )}
                                {(booking.items || []).map((item) => (
                                    <div key={item.id} className="flex justify-between items-start group hover:bg-lumina-highlight/20 -mx-2 px-2 py-1 rounded">
                                        <div className="flex-1 pr-4">
                                            <div className="text-white flex items-center gap-2">
                                                {item.description}
                                                <button onClick={() => removeLineItem(item.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400"><X size={10}/></button>
                                            </div>
                                            <div className="text-lumina-muted text-[10px]">{item.quantity} x {item.unitPrice.toLocaleString()}</div>
                                        </div>
                                        <div className="text-white">Rp {item.total.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 items-end py-3 border-t border-b border-lumina-highlight/30 border-dashed mb-6">
                                <div className="flex-1">
                                    <input 
                                        className="w-full bg-transparent border-b border-lumina-highlight p-1 text-xs text-white placeholder-lumina-muted focus:border-lumina-accent outline-none transition-colors"
                                        placeholder="+ Add Item (e.g. Extra Hour)"
                                        value={newLineItem.description}
                                        onChange={e => setNewLineItem({...newLineItem, description: e.target.value})}
                                    />
                                </div>
                                <div className="w-12">
                                    <input 
                                        type="number"
                                        className="w-full bg-transparent border-b border-lumina-highlight p-1 text-xs text-white text-center focus:border-lumina-accent outline-none transition-colors"
                                        placeholder="Qty"
                                        value={newLineItem.quantity}
                                        onChange={e => setNewLineItem({...newLineItem, quantity: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="w-20">
                                    <input 
                                        type="number"
                                        className="w-full bg-transparent border-b border-lumina-highlight p-1 text-xs text-white text-right focus:border-lumina-accent outline-none transition-colors"
                                        placeholder="Price"
                                        value={newLineItem.unitPrice}
                                        onChange={e => setNewLineItem({...newLineItem, unitPrice: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="w-20">
                                    <input 
                                        type="number"
                                        className="w-full bg-transparent border-b border-lumina-highlight p-1 text-xs text-amber-400 text-right focus:border-lumina-accent outline-none transition-colors"
                                        placeholder="Cost (Opt)"
                                        value={newLineItem.cost || ''}
                                        onChange={e => setNewLineItem({...newLineItem, cost: Number(e.target.value)})}
                                        onKeyDown={e => e.key === 'Enter' && addLineItem()}
                                        title="Cost of Goods Sold (Optional)"
                                    />
                                </div>
                                <button onClick={addLineItem} disabled={!newLineItem.description} className="text-lumina-accent hover:text-white disabled:opacity-30"><Plus size={16}/></button>
                            </div>

                            <div className="space-y-1 text-xs font-mono">
                                <div className="flex justify-between text-lumina-muted">
                                    <span>Subtotal</span>
                                    <span>Rp {calculatedSubtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-500">
                                    <span className="flex items-center gap-1">Discount 
                                        <input 
                                            type="number" 
                                            className="w-12 bg-emerald-900/30 text-emerald-500 border-b border-emerald-500/50 text-right px-1 outline-none focus:bg-emerald-900/50"
                                            value={editDiscount.value}
                                            onChange={e => setEditDiscount({...editDiscount, value: Number(e.target.value)})}
                                            onBlur={saveDiscount}
                                        />
                                        <select 
                                            className="bg-emerald-900/30 border-none text-[10px] rounded outline-none cursor-pointer"
                                            value={editDiscount.type}
                                            onChange={e => { setEditDiscount({...editDiscount, type: e.target.value as any}); setTimeout(saveDiscount, 100); }}
                                        >
                                            <option value="PERCENT">%</option>
                                            <option value="FIXED">Rp</option>
                                        </select>
                                    </span>
                                    <span>- Rp {discountAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lumina-muted">
                                    <span>Tax ({taxRate}%)</span>
                                    <span>Rp {taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-white pt-2 mt-2 border-t border-white/20">
                                    <span>Total</span>
                                    <span>Rp {grandTotal.toLocaleString()}</span>
                                </div>
                                 <div className="flex justify-between text-sm text-emerald-400 pt-1">
                                    <span>Paid</span>
                                    <span>- Rp {booking.paidAmount.toLocaleString()}</span>
                                </div>
                                 <div className="flex justify-between text-sm font-bold text-rose-400 pt-1">
                                    <span>Due</span>
                                    <span>Rp {(grandTotal - booking.paidAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={handleDelete} className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                            <Trash2 size={12} /> Delete Project Permanently
                        </button>
                    </div>
                </div>
            )}

             {activeTab === 'PROFITABILITY' && (
                <div className="space-y-6">
                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                            <PieChart size={16} className="text-purple-400" /> Project P&L Analysis
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <span className="font-bold text-emerald-200">Total Revenue (Gross)</span>
                                <span className="font-bold text-emerald-400 font-mono">Rp {grandTotal.toLocaleString()}</span>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-lumina-muted uppercase">Direct Expenses (COGS)</h4>
                                    {isUsingSnapshot && (
                                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">
                                            <Lock size={8}/> Cost Snapshot Used
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {packageCostBreakdown.length > 0 && packageCostBreakdown.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center text-xs text-lumina-muted border-b border-lumina-highlight/50 pb-1">
                                            <span className="flex items-center gap-1">
                                                <TrendingUp size={10} className="text-amber-400" />
                                                {item.description}
                                                <span className={`text-[8px] px-1 rounded uppercase ml-1
                                                    ${item.category === 'LABOR' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {item.category}
                                                </span>
                                            </span>
                                            <span className="font-mono text-rose-300">- Rp {item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}

                                    {projectExpenses.map(t => (
                                        <div key={t.id} className="flex justify-between items-center text-xs text-lumina-muted border-b border-lumina-highlight/50 pb-1">
                                            <span className="flex items-center gap-1">
                                                <AlertCircle size={10} className="text-rose-400" />
                                                {t.description} <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1 rounded">EXTRA</span>
                                            </span>
                                            <span className="font-mono text-rose-300">- Rp {t.amount.toLocaleString()}</span>
                                        </div>
                                    ))}

                                    {currentItems.filter(i => i.cost && i.cost > 0).map(item => (
                                        <div key={`cost-${item.id}`} className="flex justify-between items-center text-xs text-lumina-muted border-b border-lumina-highlight/50 pb-1">
                                            <span className="flex items-center gap-1">
                                                <Tag size={10} className="text-purple-400" />
                                                Cost: {item.description}
                                            </span>
                                            <span className="font-mono text-rose-300">- Rp {(item.cost || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    
                                    {projectExpenses.length === 0 && packageCostBreakdown.length === 0 && totalCustomItemCost === 0 && <p className="text-xs text-lumina-muted italic">No direct expenses recorded.</p>}
                                </div>
                                <div className="flex justify-between items-center pt-2 mt-1">
                                    <span className="text-xs font-bold text-white">Total COGS</span>
                                    <span className="text-sm font-bold font-mono text-rose-400">- Rp {(totalDirectExpenses + totalBaseCost + totalCustomItemCost).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-lumina-highlight/10 p-3 rounded-lg border border-lumina-highlight/30">
                                <h4 className="text-[10px] font-bold text-lumina-muted uppercase mb-2">Record Extra Expense</h4>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input 
                                        className="bg-lumina-base border border-lumina-highlight rounded p-1.5 text-xs text-white" 
                                        placeholder="Item (e.g. Broken Prop)"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                                    />
                                    <input 
                                        type="number" 
                                        className="bg-lumina-base border border-lumina-highlight rounded p-1.5 text-xs text-white" 
                                        placeholder="Cost"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="flex gap-2">
                                     <select 
                                        className="flex-1 bg-lumina-base border border-lumina-highlight rounded p-1.5 text-xs text-white"
                                        value={newExpense.accountId}
                                        onChange={e => setNewExpense({...newExpense, accountId: e.target.value})}
                                     >
                                         {accounts.map(a => <option key={a.id} value={a.id}>Paid from {a.name}</option>)}
                                     </select>
                                     <button 
                                        onClick={handleAddExpense}
                                        disabled={!newExpense.description || newExpense.amount <= 0}
                                        className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded hover:bg-rose-600 disabled:opacity-50"
                                     >
                                         Add
                                     </button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-lumina-muted uppercase mb-2">Estimated Commissions (Net Sales Basis)</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs text-lumina-muted border-b border-lumina-highlight/50 pb-1">
                                        <span>Photographer ({photographer?.commissionRate || 0}%)</span>
                                        <span className="font-mono text-amber-300">- Rp {photographerCommission.toLocaleString()}</span>
                                    </div>
                                    {editorCommission > 0 && (
                                        <div className="flex justify-between items-center text-xs text-lumina-muted border-b border-lumina-highlight/50 pb-1">
                                            <span>Editor Commission</span>
                                            <span className="font-mono text-amber-300">- Rp {editorCommission.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pt-2 mt-1">
                                    <span className="text-xs font-bold text-white">Total Labor</span>
                                    <span className="text-sm font-bold font-mono text-amber-400">- Rp {totalLaborCost.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-lumina-highlight">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-white">Net Profit</span>
                                    <span className={`text-xl font-bold font-display font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        Rp {netProfit.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${profitMargin > 30 ? 'bg-emerald-500/20 text-emerald-400' : profitMargin > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        Margin: {profitMargin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'DISCUSSION' && (
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4">
                        {(booking.comments || []).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-lumina-muted opacity-50">
                                <MessageSquare size={48} className="mb-4 stroke-1"/>
                                <p className="text-sm font-bold">No Discussion Yet</p>
                                <p className="text-xs">Start a thread for internal team notes.</p>
                            </div>
                        ) : (
                            (booking.comments || []).map(comment => (
                                <div key={comment.id} className={`flex flex-col ${comment.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                     <div className={`max-w-[85%] p-3 rounded-xl border ${comment.userId === currentUser?.id ? 'bg-lumina-accent/10 border-lumina-accent/30 rounded-tr-none' : 'bg-lumina-highlight/20 border-lumina-highlight rounded-tl-none'}`}>
                                          <p className="text-sm text-white whitespace-pre-wrap">{comment.text}</p>
                                     </div>
                                     <div className="flex items-center gap-2 mt-1 px-1">
                                         <span className="text-[10px] font-bold text-lumina-muted">{comment.userName}</span>
                                         <span className="text-[10px] text-lumina-muted opacity-60">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-lumina-base border border-lumina-highlight rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-lumina-accent"
                            placeholder="Type an internal note..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addComment()}
                        />
                        <button 
                            onClick={addComment}
                            disabled={!newComment.trim()}
                            className="p-3 bg-lumina-accent text-lumina-base rounded-xl font-bold hover:bg-lumina-accent/90 disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'TASKS' && (
                <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-r from-lumina-highlight to-lumina-base rounded-xl border border-lumina-highlight">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <ListChecks size={18} className="text-lumina-accent" />
                                Operational Checklist
                            </h3>
                            <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-white">
                                {booking.tasks?.filter(t => t.completed).length || 0} / {booking.tasks?.length || 0} Done
                            </span>
                        </div>
                        <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-lumina-accent h-full transition-all duration-500"
                                style={{ width: `${booking.tasks && booking.tasks.length > 0 ? (booking.tasks.filter(t => t.completed).length / booking.tasks.length) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(booking.tasks || []).map(task => (
                            <Motion.div 
                                layout
                                key={task.id} 
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all
                                    ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' : 'bg-lumina-base border-lumina-highlight hover:border-lumina-accent/50'}
                                `}
                            >
                                <button 
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                        ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-lumina-muted hover:border-white'}
                                    `}
                                >
                                    {task.completed && <Check size={12} />}
                                </button>
                                <span className={`flex-1 text-sm font-medium ${task.completed ? 'text-lumina-muted line-through' : 'text-white'}`}>
                                    {task.title}
                                </span>
                                {task.assignedTo && (
                                    <img src={`https://ui-avatars.com/api/?name=${task.assignedTo}&background=random`} className="w-5 h-5 rounded-full border border-lumina-highlight" title="Assigned User" />
                                )}
                            </Motion.div>
                        ))}
                        {(booking.tasks || []).length === 0 && (
                            <p className="text-center text-lumina-muted text-sm py-4">No tasks defined.</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-accent"
                            placeholder="Add new task..."
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()}
                        />
                        <button 
                            onClick={addTask}
                            disabled={!newTaskTitle.trim()}
                            className="px-4 py-2 bg-lumina-highlight rounded-lg text-white font-bold hover:bg-lumina-accent hover:text-lumina-base disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'LOGS' && (
                <div className="space-y-6">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                        <History size={18} className="text-blue-400" />
                        Activity Audit Trail
                    </h3>
                    
                    <div className="relative border-l-2 border-lumina-highlight ml-3 space-y-6">
                        {(booking.logs || []).map((log, index) => (
                             <div key={log.id} className="relative pl-6">
                                 <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-lumina-highlight border-2 border-lumina-base"></div>
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <p className="text-xs font-bold text-lumina-accent uppercase tracking-wider mb-0.5">{(log.action || '').replace('_', ' ')}</p>
                                         <p className="text-sm text-white">{log.details}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-[10px] text-lumina-muted">{new Date(log.timestamp).toLocaleDateString()}</p>
                                         <p className="text-[10px] text-lumina-muted">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-1 mt-1">
                                     <div className="w-4 h-4 rounded-full bg-lumina-highlight flex items-center justify-center text-[8px] text-white">
                                         {log.userName.charAt(0)}
                                     </div>
                                     <span className="text-[10px] text-lumina-muted">by {log.userName}</span>
                                 </div>
                             </div>
                        ))}
                         {(booking.logs || []).length === 0 && (
                            <p className="pl-6 text-sm text-lumina-muted">No activity recorded yet.</p>
                        )}
                    </div>
                </div>
            )}
            {activeTab === 'CONTRACT' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-lumina-highlight rounded-xl bg-lumina-base/30">
                    <FileSignature size={48} className={`mb-4 ${booking.contractStatus === 'SIGNED' ? 'text-emerald-500' : 'text-lumina-muted'}`} />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {booking.contractStatus === 'SIGNED' ? 'Contract Signed' : 'Contract Pending'}
                    </h3>
                    <p className="text-sm text-lumina-muted mb-6 max-w-xs">
                        {booking.contractStatus === 'SIGNED' 
                            ? `Signed on ${new Date(booking.contractSignedDate!).toLocaleDateString()}` 
                            : 'Client has not signed the digital service agreement yet.'}
                    </p>
                    {booking.contractStatus !== 'SIGNED' ? (
                        <button onClick={signContract} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                            Force Sign (Manual)
                        </button>
                    ) : (
                        <button className="px-6 py-2 bg-lumina-highlight text-white font-bold rounded-lg hover:bg-lumina-highlight/80 flex items-center gap-2">
                            <Download size={16} /> Download PDF
                        </button>
                    )}
                </div>
            )}
             {activeTab === 'TIMELINE' && (
                <div className="space-y-4">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white">Project Files</h3>
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-lumina-accent text-lumina-base px-3 py-1.5 rounded font-bold hover:bg-lumina-accent/90 flex items-center gap-2">
                            {isUploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12} />} 
                            Upload File
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                     </div>

                     <div className="space-y-2">
                         {(booking.files || []).map(file => (
                             <div key={file.id} className="flex items-center justify-between p-3 bg-lumina-base border border-lumina-highlight rounded-lg group hover:border-lumina-accent/50 transition-colors">
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 bg-lumina-highlight rounded text-white">
                                         {file.type.includes('image') ? <ImageIcon size={16}/> : <FileText size={16}/>}
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-white">{file.name}</p>
                                         <p className="text-[10px] text-lumina-muted">{new Date(file.uploadedAt).toLocaleDateString()} • {file.size}</p>
                                     </div>
                                 </div>
                                 <button className="p-2 text-lumina-muted hover:text-white"><Download size={16}/></button>
                             </div>
                         ))}
                         {(booking.files || []).length === 0 && (
                             <div className="text-center py-10 text-lumina-muted border border-dashed border-lumina-highlight rounded-lg bg-lumina-base/30">
                                 <Paperclip size={32} className="mx-auto mb-3 opacity-50"/>
                                 <p className="text-sm font-bold text-white">No files uploaded yet.</p>
                                 <p className="text-xs mt-1">Upload assets like moodboards or invoices here.</p>
                             </div>
                         )}
                     </div>

                     <div className="mt-8 pt-8 border-t border-lumina-highlight">
                         <h3 className="font-bold text-white mb-2">Final Delivery</h3>
                         <div className="flex gap-2">
                             <input className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg px-3 py-2 text-sm text-white" placeholder="Google Drive / Dropbox URL" value={booking.deliveryUrl || ''} readOnly />
                             <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600">
                                 {booking.deliveryUrl ? 'Update' : 'Deliver'}
                             </button>
                         </div>
                     </div>
                </div>
            )}
            {activeTab === 'MOODBOARD' && (
                <div className="grid grid-cols-2 gap-4">
                    {(booking.moodboard || []).map((url, idx) => (
                        <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden relative group">
                            <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md">
                                    <ExternalLink size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button className="aspect-[3/4] rounded-lg border-2 border-dashed border-lumina-highlight flex flex-col items-center justify-center text-lumina-muted hover:text-white hover:border-lumina-accent transition-colors gap-2 group bg-lumina-base/30">
                        <Plus size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-wider">Add Image</span>
                    </button>
                </div>
            )}
        </div>
      </Motion.div>
    </div>
  );
};

export default ProjectDrawer;
