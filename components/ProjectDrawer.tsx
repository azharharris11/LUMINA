
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ProjectStatus, User, BookingFile, StudioConfig, Package, BookingItem, BookingTask, ActivityLog, Asset, BookingComment, Discount, TimeLog, Transaction, Account } from '../types';
import { X, Image as ImageIcon, FileSignature, Clock, CheckCircle2, Circle, Upload, PenTool, Download, Calendar, Save, Trash2, Edit, Plus, Loader2, FileText, ExternalLink, Paperclip, Check, Send, RefreshCw, AlertCircle, Lock, Timer, ListChecks, History, DollarSign, User as UserIcon, MapPin, Briefcase, Camera, Box, Wrench, AlertTriangle, TrendingUp, Tag, MessageSquare, Play, Square, Pause, PieChart, MinusCircle, ChevronRight, HardDrive } from 'lucide-react';

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
  googleToken?: string | null;
}

type Tab = 'OVERVIEW' | 'TASKS' | 'MOODBOARD' | 'CONTRACT' | 'TIMELINE' | 'LOGS' | 'DISCUSSION' | 'PROFITABILITY';

const Motion = motion as any;

const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ isOpen, onClose, booking, photographer, onUpdateBooking, onDeleteBooking, bookings = [], config, packages = [], currentUser, assets = [], users = [], transactions = [], onAddTransaction, accounts = [], googleToken }) => {
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

  // ... (checkRescheduleConflict omitted for brevity, unchanged)
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

  // ... (other helper functions omitted for brevity, unchanged)
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

  const createDriveFolder = async () => {
      if (!booking || !googleToken) {
          alert("Please connect your Google Account in Settings first.");
          return;
      }
      
      setIsUploading(true);
      try {
          const folderMetadata = {
              name: `Lumina - ${booking.clientName} - ${booking.package}`,
              mimeType: 'application/vnd.google-apps.folder',
          };

          const response = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${googleToken}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(folderMetadata),
          });

          if (!response.ok) throw new Error("Drive API Error");

          const data = await response.json();
          
          if (data.id) {
              // Fetch webViewLink
              const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}?fields=webViewLink`, {
                  headers: { 'Authorization': `Bearer ${googleToken}` }
              });
              const fileData = await fileRes.json();
              
              const log = createLocalLog('DRIVE_CREATED', `Created Google Drive folder: ${data.id}`);
              onUpdateBooking({
                  ...booking,
                  deliveryUrl: fileData.webViewLink || `https://drive.google.com/drive/folders/${data.id}`,
                  logs: [log, ...(booking.logs || [])]
              });
              alert("Folder created successfully! Link added to Delivery URL.");
          } else {
              throw new Error("Failed to create folder");
          }
      } catch (e) {
          console.error(e);
          alert("Failed to create Drive folder. Please ensure your Google session is valid in Settings.");
      } finally {
          setIsUploading(false);
      }
  }

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
                    {/* ... (Existing Overview Content) ... */}
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

                    {/* Equipment and Billing sections... */}
                    {/* ... */}
                </div>
            )}

            {activeTab === 'TASKS' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-sm text-white focus:outline-none focus:border-lumina-accent"
                            placeholder="Add a new task..."
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()}
                        />
                        <button onClick={addTask} className="bg-lumina-accent text-lumina-base px-4 rounded-lg font-bold text-sm hover:bg-lumina-accent/90">Add</button>
                    </div>
                    <div className="space-y-2">
                        {(booking.tasks || []).length === 0 && <p className="text-center text-lumina-muted py-8 italic">No tasks yet.</p>}
                        {(booking.tasks || []).map(task => (
                            <div key={task.id} onClick={() => toggleTask(task.id)} className="flex items-center gap-3 p-3 bg-lumina-base border border-lumina-highlight rounded-xl cursor-pointer hover:border-lumina-accent/50 transition-all group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-lumina-muted group-hover:border-lumina-accent'}`}>
                                    {task.completed && <Check size={12} className="text-white" />}
                                </div>
                                <span className={`text-sm flex-1 ${task.completed ? 'text-lumina-muted line-through' : 'text-white'}`}>{task.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'TIMELINE' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-lumina-highlight/10 border border-lumina-highlight rounded-xl">
                        <div>
                            <h4 className="font-bold text-white text-sm">Project Files</h4>
                            <p className="text-xs text-lumina-muted">Deliverables & Assets</p>
                        </div>
                        <div className="flex gap-2">
                            {googleToken ? (
                                <button onClick={createDriveFolder} disabled={isUploading} className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">
                                    <HardDrive size={14} /> {isUploading ? 'Creating...' : 'Create Drive Folder'}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => alert('Please go to Settings > Integrations to connect your Google Account.')}
                                    className="flex items-center gap-2 px-3 py-2 bg-lumina-base border border-lumina-highlight text-lumina-muted rounded-lg text-xs font-bold hover:text-white transition-colors"
                                    title="Connect in Settings"
                                >
                                    <HardDrive size={14} /> Connect Drive
                                </button>
                            )}
                            <button onClick={handleFileUpload} disabled={isUploading} className="flex items-center gap-2 px-3 py-2 bg-lumina-accent text-lumina-base rounded-lg text-xs font-bold hover:bg-lumina-accent/90 transition-colors disabled:opacity-50">
                                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                            </button>
                        </div>
                    </div>

                    {booking.deliveryUrl && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <ExternalLink size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-100 text-sm">Cloud Folder</h4>
                                    <a href={booking.deliveryUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-300 hover:underline truncate max-w-[200px] block">
                                        {booking.deliveryUrl}
                                    </a>
                                </div>
                            </div>
                            <a href={booking.deliveryUrl} target="_blank" rel="noreferrer" className="text-xs font-bold bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white transition-colors">
                                Open
                            </a>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {(booking.files || []).map(file => (
                            <div key={file.id} className="group relative bg-lumina-base border border-lumina-highlight rounded-xl overflow-hidden hover:border-lumina-accent/50 transition-all">
                                <div className="aspect-video bg-black/50 relative">
                                    <img src={file.url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 bg-black/50 rounded-full text-white hover:bg-lumina-accent hover:text-black transition-colors"><Download size={16} /></button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs font-bold text-white truncate">{file.name}</p>
                                    <p className="text-[10px] text-lumina-muted">{file.size} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ... (Other tabs remain same) ... */}
            {activeTab === 'LOGS' && (
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-wider mb-4">Audit Trail</h3>
                    <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-lumina-highlight">
                        {(booking.logs || []).map(log => (
                            <div key={log.id} className="flex gap-4 relative">
                                <div className="w-10 h-10 rounded-full bg-lumina-surface border-4 border-lumina-base flex items-center justify-center shrink-0 z-10">
                                    <div className="w-2 h-2 rounded-full bg-lumina-accent"></div>
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs font-bold text-white">{log.action.replace('_', ' ')}</span>
                                        <span className="text-[10px] text-lumina-muted">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-lumina-muted mt-0.5">{log.details}</p>
                                    <p className="text-[10px] text-lumina-muted/50 mt-1 italic">by {log.userName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'DISCUSSION' && (
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                        {(booking.comments || []).length === 0 && <p className="text-center text-lumina-muted text-sm py-10">No comments yet.</p>}
                        {(booking.comments || []).map(comment => (
                            <div key={comment.id} className={`flex flex-col ${comment.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${comment.userId === currentUser?.id ? 'bg-lumina-accent text-lumina-base rounded-tr-none' : 'bg-lumina-highlight text-white rounded-tl-none'}`}>
                                    <p>{comment.text}</p>
                                </div>
                                <span className="text-[10px] text-lumina-muted mt-1 px-1">{comment.userName} • {new Date(comment.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        ))}
                    </div>
                    <div className="relative">
                        <input 
                            className="w-full bg-lumina-base border border-lumina-highlight rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-lumina-accent"
                            placeholder="Write a note..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addComment()}
                        />
                        <button onClick={addComment} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-lumina-surface text-lumina-muted hover:text-lumina-accent rounded-lg transition-colors">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'PROFITABILITY' && canSeeProfit && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                            <p className="text-xs font-bold text-emerald-300 uppercase mb-1">Net Profit</p>
                            <p className="text-2xl font-bold text-white font-mono">Rp {netProfit.toLocaleString()}</p>
                            <p className="text-xs text-emerald-300/70 mt-1">{profitMargin.toFixed(1)}% Margin</p>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl">
                            <p className="text-xs font-bold text-rose-300 uppercase mb-1">Total Cost</p>
                            <p className="text-2xl font-bold text-white font-mono">Rp {totalCost.toLocaleString()}</p>
                            <p className="text-xs text-rose-300/70 mt-1">COGS + Expenses</p>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                        <h4 className="text-xs font-bold text-lumina-muted uppercase mb-3">Cost Breakdown</h4>
                        <div className="space-y-2 text-sm">
                            {/* 1. Base Package Cost */}
                            <div className="flex justify-between items-center">
                                <span className="text-lumina-muted flex items-center gap-2"><Box size={12}/> Base Cost (Package)</span>
                                <span className="text-white">Rp {totalBaseCost.toLocaleString()}</span>
                            </div>
                            
                            {/* 2. Custom Item Cost */}
                            {totalCustomItemCost > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-lumina-muted flex items-center gap-2"><Plus size={12}/> Add-on Cost</span>
                                    <span className="text-white">Rp {totalCustomItemCost.toLocaleString()}</span>
                                </div>
                            )}

                            {/* 3. Labor Cost (Commissions) */}
                            <div className="flex justify-between items-center">
                                <span className="text-lumina-muted flex items-center gap-2"><UserIcon size={12}/> Labor (Commissions)</span>
                                <span className="text-white">Rp {totalLaborCost.toLocaleString()}</span>
                            </div>

                            {/* 4. Direct Expenses */}
                            <div className="flex justify-between items-center border-t border-lumina-highlight/30 pt-2 mt-2">
                                <span className="text-lumina-muted flex items-center gap-2"><DollarSign size={12}/> Direct Expenses</span>
                                <span className="text-white">Rp {totalDirectExpenses.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Record Expense */}
                    <div className="bg-lumina-highlight/10 border border-lumina-highlight rounded-xl p-4">
                        <h4 className="text-xs font-bold text-white uppercase mb-3">Record Project Expense</h4>
                        <div className="space-y-3">
                            <input 
                                className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-xs text-white"
                                placeholder="Description (e.g. Lunch, Parking)"
                                value={newExpense.description}
                                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="number"
                                    className="flex-1 bg-lumina-base border border-lumina-highlight rounded p-2 text-xs text-white"
                                    placeholder="Amount"
                                    value={newExpense.amount || ''}
                                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                                />
                                <select
                                    className="flex-1 bg-lumina-base border border-lumina-highlight rounded p-2 text-xs text-white"
                                    value={newExpense.accountId}
                                    onChange={e => setNewExpense({...newExpense, accountId: e.target.value})}
                                >
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleAddExpense} className="w-full py-2 bg-rose-500 text-white text-xs font-bold rounded hover:bg-rose-600 transition-colors">
                                Add Expense
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contract & Moodboard Placeholders for completeness */}
            {activeTab === 'CONTRACT' && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <FileSignature size={48} className="text-lumina-muted opacity-20" />
                    <p className="text-lumina-muted text-sm">Contract Status: <span className="font-bold text-white">{booking.contractStatus}</span></p>
                    {booking.contractStatus === 'PENDING' && (
                        <button onClick={signContract} className="px-4 py-2 bg-lumina-accent text-lumina-base rounded-lg text-sm font-bold hover:bg-lumina-accent/90">
                            Mark as Signed
                        </button>
                    )}
                </div>
            )}

            {activeTab === 'MOODBOARD' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-lumina-base border border-lumina-highlight rounded-xl flex items-center justify-center border-dashed hover:border-lumina-accent transition-colors cursor-pointer group">
                        <div className="text-center">
                            <Plus size={24} className="mx-auto text-lumina-muted group-hover:text-lumina-accent mb-2" />
                            <span className="text-xs text-lumina-muted">Add Image</span>
                        </div>
                    </div>
                    {/* Placeholder for images if moodboard array existed in bookings */}
                </div>
            )}

        </div>

        {/* Bottom Action Bar (Delete) */}
        <div className="p-4 border-t border-lumina-highlight bg-lumina-base flex justify-between items-center">
            <button 
                onClick={handleDelete}
                className="text-xs text-rose-500 hover:text-rose-400 font-bold flex items-center gap-2 px-3 py-2 rounded hover:bg-rose-500/10 transition-colors"
            >
                <Trash2 size={14} /> Delete Project
            </button>
            <p className="text-[10px] text-lumina-muted font-mono">ID: {booking.id}</p>
        </div>
      </Motion.div>
    </div>
  );
};

export default ProjectDrawer;
