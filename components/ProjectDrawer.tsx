

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ProjectStatus, User, BookingFile, StudioConfig, Package, BookingItem, BookingTask, ActivityLog, Asset, BookingComment, Discount, TimeLog, Transaction, Account } from '../types';
import { X, Image as ImageIcon, FileSignature, Clock, CheckCircle2, Circle, Upload, PenTool, Download, Calendar, Save, Trash2, Edit, Plus, Loader2, FileText, ExternalLink, Paperclip, Check, Send, RefreshCw, AlertCircle, Lock, Timer, ListChecks, History, DollarSign, User as UserIcon, MapPin, Briefcase, Camera, Box, Wrench, AlertTriangle, TrendingUp, Tag, MessageSquare, Play, Square, Pause, PieChart, MinusCircle, ChevronRight, HardDrive, LayoutDashboard, FolderOpen, Palette, ArrowLeft, Folder, MoreVertical, FolderPlus } from 'lucide-react';

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

interface DriveFolder {
    id: string;
    name: string;
}

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
  
  // --- DRIVE PICKER STATE ---
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveBreadcrumbs, setDriveBreadcrumbs] = useState<DriveFolder[]>([{id: 'root', name: 'My Drive'}]);
  const [driveFolderList, setDriveFolderList] = useState<DriveFolder[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); 
  
  // Drive Actions State
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [renamingItem, setRenamingItem] = useState<DriveFolder | null>(null);
  const [renameInput, setRenameInput] = useState('');
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const currentDriveFolderId = driveBreadcrumbs[driveBreadcrumbs.length - 1].id;

  const [newLineItem, setNewLineItem] = useState<Partial<BookingItem>>({ description: '', quantity: 1, unitPrice: 0, cost: 0 });
  const [editDiscount, setEditDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Production Cost', accountId: accounts[0]?.id || '' });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [revenueWarning, setRevenueWarning] = useState<string | null>(null);
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false); // NEW

  const [activeTimerStart, setActiveTimerStart] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  // Calculations for Payment Status
  const isPaymentSettled = useMemo(() => {
      if (!booking) return false;
      const tax = booking.taxSnapshot || 0;
      const grandTotal = booking.price * (1 + tax / 100); // Simplification, proper logic below
      // Using robust calculation from render
      return true; // Placeholder, recalculated below properly
  }, [booking]);

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
      setShowOvertimePrompt(false);
      setEditDiscount(booking.discount || { type: 'FIXED', value: 0 });
      setNewExpense({ description: '', amount: 0, category: 'Production Cost', accountId: accounts[0]?.id || '' });
      
      setActiveTimerStart(null);
      setElapsedSeconds(0);
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      setDriveBreadcrumbs([{id: 'root', name: 'My Drive'}]);
      setShowDrivePicker(false);
      setShowNewFolderInput(false);
      setNewFolderName('');
      setActiveMenuId(null);
    }
  }, [booking, isOpen]);

  useEffect(() => {
      return () => {
          if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
  }, []);

  // ... (Drive Functions remain the same) ...
  const fetchDriveFolders = async (parentId: string) => {
      if (!googleToken) return;
      setIsLoadingDrive(true);
      try {
          const query = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
          const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&orderBy=name`;
          
          const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${googleToken}` }
          });
          
          if (!res.ok) {
              if(res.status === 401) alert("Session expired. Reconnect in Settings.");
              else if(res.status === 403) alert("Permission denied. Ensure you granted access.");
              else throw new Error("Failed to fetch drive folders");
              return;
          }
          
          const data = await res.json();
          setDriveFolderList(data.files || []);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingDrive(false);
      }
  };

  useEffect(() => {
      if(showDrivePicker) {
          fetchDriveFolders(currentDriveFolderId);
      }
  }, [showDrivePicker, currentDriveFolderId]);

  const handleNavigateDrive = (folder: DriveFolder) => {
      setDriveBreadcrumbs(prev => [...prev, folder]);
      setActiveMenuId(null); 
  };

  const handleDriveBack = () => {
      if (driveBreadcrumbs.length > 1) {
          setDriveBreadcrumbs(prev => prev.slice(0, -1));
          setActiveMenuId(null);
      }
  };

  const createSubFolder = async () => {
      if (!newFolderName.trim() || !googleToken) return;
      setActionLoading(true);
      try {
          const folderMetadata = {
              name: newFolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [currentDriveFolderId]
          };

          const response = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${googleToken}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(folderMetadata),
          });

          if (!response.ok) throw new Error("Failed to create folder");
          await fetchDriveFolders(currentDriveFolderId);
          setShowNewFolderInput(false);
          setNewFolderName('');
      } catch (e: any) {
          alert(`Error: ${e.message}`);
      } finally {
          setActionLoading(false);
      }
  };

  const renameItem = async () => {
      if (!renamingItem || !renameInput.trim() || !googleToken) return;
      setActionLoading(true);
      try {
          const response = await fetch(`https://www.googleapis.com/drive/v3/files/${renamingItem.id}`, {
              method: 'PATCH',
              headers: {
                  'Authorization': `Bearer ${googleToken}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: renameInput }),
          });

          if (!response.ok) throw new Error("Failed to rename folder");

          await fetchDriveFolders(currentDriveFolderId);
          setRenamingItem(null);
          setRenameInput('');
          setActiveMenuId(null);
      } catch (e: any) {
          alert(`Error: ${e.message}`);
      } finally {
          setActionLoading(false);
      }
  };

  const trashItem = async (item: DriveFolder) => {
      if (!googleToken) return;
      if (!window.confirm(`Are you sure you want to move '${item.name}' to trash?`)) return;
      
      setActionLoading(true);
      try {
          const response = await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}`, {
              method: 'PATCH',
              headers: {
                  'Authorization': `Bearer ${googleToken}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ trashed: true }),
          });

          if (!response.ok) throw new Error("Failed to delete folder");

          await fetchDriveFolders(currentDriveFolderId);
          setActiveMenuId(null);
      } catch (e: any) {
          alert(`Error: ${e.message}`);
      } finally {
          setActionLoading(false);
      }
  };

  // ... (Log functions, Timer functions remain same) ...
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
          b.status !== 'CANCELLED' &&
          b.status !== 'REFUNDED'
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
              durationMinutes: durationMins || 1, 
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

          // Detect Overtime
          if (logisticsForm.duration > booking.duration) {
               const extraHours = logisticsForm.duration - booking.duration;
               setRevenueWarning(`Duration increased by ${extraHours}h.`);
               setShowOvertimePrompt(true);
          } else {
               setRevenueWarning(null);
               setShowOvertimePrompt(false);
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

  const handleAddOvertimeFee = () => {
      if (booking && showOvertimePrompt) {
          const extraHours = logisticsForm.duration - booking.duration;
          // Example Rate: 500k per hour (Should be in config)
          const rate = 500000; 
          const fee = extraHours * rate;
          
          const newItem: BookingItem = {
              id: `item-${Date.now()}`,
              description: `Overtime Fee (${extraHours}h)`,
              quantity: 1,
              unitPrice: fee,
              total: fee
          };
          
          const log = createLocalLog('OVERTIME_ADDED', `Added overtime fee: Rp ${fee}`);
          
          onUpdateBooking({
              ...booking,
              items: [...(booking.items || []), newItem],
              logs: [log, ...(booking.logs || [])]
          });
          
          setShowOvertimePrompt(false);
          setRevenueWarning(null);
      }
  }

  const handleDelete = () => {
      if (booking && onDeleteBooking) {
          if (window.confirm('Delete this project permanently?')) {
              onDeleteBooking(booking.id);
              onClose();
          }
      }
  };

  // ... (Remaining functions: handleAddExpense, toggleTask, addTask, addComment, signContract, handleFileUpload, createDriveFolder) ...
  
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

  const toggleTask = (taskId: string) => {
      if (booking && booking.tasks) {
          const updatedTasks = booking.tasks.map(t => 
              t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          const task = booking.tasks.find(t => t.id === taskId);
          const log = createLocalLog('TASK_UPDATE', `${task?.title} marked as ${!task?.completed ? 'Done' : 'Pending'}`);
          onUpdateBooking({ ...booking, tasks: updatedTasks, logs: [log, ...(booking.logs || [])] });
      }
  };

  const addTask = () => {
      if (booking && newTaskTitle.trim()) {
          const newTask: BookingTask = { id: `t-${Date.now()}`, title: newTaskTitle, completed: false, assignedTo: currentUser?.id };
          const log = createLocalLog('TASK_ADDED', `New Task: ${newTaskTitle}`);
          onUpdateBooking({ ...booking, tasks: [newTask, ...(booking.tasks || [])], logs: [log, ...(booking.logs || [])] });
          setNewTaskTitle('');
      }
  };

  const addComment = () => {
      if (booking && newComment.trim()) {
          const comment: BookingComment = { id: `c-${Date.now()}`, text: newComment, userId: currentUser?.id || 'sys', userName: currentUser?.name || 'System', timestamp: new Date().toISOString() };
          onUpdateBooking({ ...booking, comments: [comment, ...(booking.comments || [])] });
          setNewComment('');
      }
  };

  const signContract = () => {
      if (booking) {
          const log = createLocalLog('CONTRACT_SIGNED', 'Digital signature captured');
          onUpdateBooking({ ...booking, contractStatus: 'SIGNED', contractSignedDate: new Date().toISOString(), logs: [log, ...(booking.logs || [])] });
      }
  }

  const handleFileUpload = () => {
      setIsUploading(true);
      setTimeout(() => {
          if (booking) {
              const newFile: BookingFile = { id: `f-${Date.now()}`, name: `Upload_${new Date().getTime()}.jpg`, url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2', type: 'image/jpeg', size: '2.4 MB', uploadedAt: new Date().toISOString() };
              onUpdateBooking({ ...booking, files: [...(booking.files || []), newFile] });
          }
          setIsUploading(false);
      }, 1500);
  };

  const createDriveFolder = async (parentId: string) => {
      if (!booking || !googleToken) {
          alert("Please connect your Google Account in Settings first.");
          return;
      }
      setIsUploading(true);
      try {
          const folderMetadata = { name: `Lumina - ${booking.clientName} - ${booking.package}`, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
          const response = await fetch('https://www.googleapis.com/drive/v3/files', { method: 'POST', headers: { 'Authorization': `Bearer ${googleToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(folderMetadata) });
          if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 401) throw new Error("Session expired. Please Disconnect & Reconnect Google in Settings.");
              if (response.status === 403) throw new Error("Permission denied. Ensure you granted sufficient permissions in Settings.");
              throw new Error(errorData.error?.message || "Unknown Drive API Error");
          }
          const data = await response.json();
          if (data.id) {
              const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}?fields=webViewLink`, { headers: { 'Authorization': `Bearer ${googleToken}` } });
              if (!fileRes.ok) throw new Error("Created folder but failed to get link.");
              const fileData = await fileRes.json();
              const log = createLocalLog('DRIVE_CREATED', `Created Google Drive folder: ${data.id}`);
              onUpdateBooking({ ...booking, deliveryUrl: fileData.webViewLink || `https://drive.google.com/drive/folders/${data.id}`, logs: [log, ...(booking.logs || [])] });
              alert("Folder created successfully! Link added to Delivery URL.");
              setShowDrivePicker(false);
          } else {
              throw new Error("Failed to create folder - no ID returned.");
          }
      } catch (e: any) {
          console.error(e);
          alert(`Google Drive Error: ${e.message}`);
      } finally {
          setIsUploading(false);
      }
  }

  const getStatusColor = (status: ProjectStatus) => {
      switch(status) {
          case 'INQUIRY': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
          case 'SHOOTING': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
          case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
          case 'CANCELLED': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
          case 'REFUNDED': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
          default: return 'bg-lumina-highlight text-white border-lumina-highlight';
      }
  }

  if (!isOpen || !booking) return null;

  // Calculations
  const currentItems = booking.items || [];
  const calculatedSubtotal = currentItems.length > 0 ? currentItems.reduce((acc, item) => acc + item.total, 0) : booking.price;
  const currentDiscount = booking.discount || { type: 'FIXED', value: 0 };
  const discountAmount = currentDiscount.type === 'PERCENT' ? calculatedSubtotal * (currentDiscount.value / 100) : currentDiscount.value;
  const subtotalAfterDiscount = Math.max(0, calculatedSubtotal - discountAmount);
  const taxRate = booking.taxSnapshot !== undefined ? booking.taxSnapshot : (config?.taxRate || 0);
  const taxAmount = subtotalAfterDiscount * (taxRate / 100);
  const grandTotal = subtotalAfterDiscount + taxAmount;
  const fullyPaid = booking.paidAmount >= (grandTotal - 100); // Tolerance for float

  // ... (Profit calcs) ...
  const projectExpenses = transactions.filter(t => t.bookingId === booking.id && t.type === 'EXPENSE');
  const totalDirectExpenses = projectExpenses.reduce((acc, t) => acc + t.amount, 0);
  let packageCostBreakdown: any[] = [];
  if (booking.costSnapshot && booking.costSnapshot.length > 0) {
      packageCostBreakdown = booking.costSnapshot;
  } else {
      const matchedPackage = packages?.find(p => p.name === booking.package);
      packageCostBreakdown = matchedPackage?.costBreakdown || [];
  }
  const totalBaseCost = packageCostBreakdown.reduce((acc, item) => acc + item.amount, 0);
  const totalCustomItemCost = currentItems.reduce((acc, item) => acc + (item.cost || 0), 0);
  const netSalesBase = Math.max(0, grandTotal - (totalBaseCost + totalCustomItemCost + totalDirectExpenses));
  const photographerCommission = photographer?.commissionRate ? netSalesBase * (photographer.commissionRate / 100) : 0;
  let editorCommission = 0;
  if (booking.editorId) {
      const editor = users.find(u => u.id === booking.editorId);
      if (editor?.commissionRate) editorCommission = netSalesBase * (editor.commissionRate / 100);
  }
  const totalLaborCost = photographerCommission + editorCommission;
  const totalCost = totalDirectExpenses + totalLaborCost + totalBaseCost + totalCustomItemCost;
  const netProfit = grandTotal - totalCost;
  const profitMargin = grandTotal > 0 ? (netProfit / grandTotal) * 100 : 0;
  const trackedMinutes = getTotalTrackedTime();
  const canSeeProfit = currentUser?.role === 'OWNER' || currentUser?.role === 'FINANCE';

  const tabs = [
      { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
      { id: 'TASKS', label: 'Tasks', icon: ListChecks },
      { id: 'DISCUSSION', label: 'Discussion', icon: MessageSquare },
      { id: 'TIMELINE', label: 'Files', icon: FolderOpen },
      { id: 'CONTRACT', label: 'Contract', icon: FileSignature },
      { id: 'MOODBOARD', label: 'Moodboard', icon: Palette },
      { id: 'LOGS', label: 'Logs', icon: History },
      ...(canSeeProfit ? [{ id: 'PROFITABILITY', label: 'Finance', icon: DollarSign }] : [])
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <Motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-lumina-surface border border-lumina-highlight rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Section */}
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

            <div className="flex items-center gap-4 mt-6 relative z-10 flex-wrap">
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
                        <option value="REFUNDED">Refunded</option>
                    </select>
                    <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs font-bold text-lumina-muted bg-lumina-surface/50 px-3 py-2 rounded-lg border border-lumina-highlight">
                    <UserIcon size={14} />
                    {photographer?.name.split(' ')[0] || 'Unassigned'}
                 </div>

                 {!fullyPaid && booking.status !== 'CANCELLED' && booking.status !== 'REFUNDED' && (
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-bold animate-pulse">
                         <AlertCircle size={14} /> Unpaid Balance
                     </div>
                 )}
            </div>
        </div>

        {/* Tabs */}
        <div className="flex-none bg-lumina-surface border-b border-lumina-highlight sticky top-0 z-20 shadow-sm p-4">
            <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all
                            ${activeTab === tab.id 
                                ? 'bg-lumina-accent text-lumina-base ring-2 ring-lumina-accent/20 shadow-lg shadow-lumina-accent/10' 
                                : 'bg-lumina-base border border-lumina-highlight text-lumina-muted hover:text-white hover:border-lumina-accent/50'}
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-lumina-surface">
            
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-8 animate-in fade-in duration-300">
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
                                {revenueWarning && (
                                     <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-200 text-xs">
                                         <AlertTriangle size={14} className="shrink-0" />
                                         <div>
                                             <p className="font-bold">Duration Change Detected</p>
                                             <p>{revenueWarning}</p>
                                             {showOvertimePrompt && (
                                                 <button 
                                                    onClick={handleAddOvertimeFee}
                                                    className="mt-2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded hover:bg-amber-400"
                                                 >
                                                     + Add Overtime Fee (Rp 500k/hr)
                                                 </button>
                                             )}
                                         </div>
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
                </div>
            )}

            {activeTab === 'TIMELINE' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between p-4 bg-lumina-highlight/10 border border-lumina-highlight rounded-xl">
                        <div>
                            <h4 className="font-bold text-white text-sm">Project Files</h4>
                            <p className="text-xs text-lumina-muted">Deliverables & Assets</p>
                        </div>
                        <div className="flex gap-2">
                            {googleToken ? (
                                <button onClick={() => setShowDrivePicker(true)} disabled={isUploading} className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50">
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

                    {/* Payment Lock for Deliverables */}
                    {!fullyPaid && booking.status !== 'CANCELLED' && booking.status !== 'REFUNDED' && currentUser?.role !== 'OWNER' && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 mb-4">
                            <Lock className="text-rose-500 w-5 h-5" />
                            <div className="flex-1">
                                <h4 className="font-bold text-rose-400 text-sm">Delivery Locked</h4>
                                <p className="text-xs text-rose-200">Outstanding balance must be settled before files can be downloaded.</p>
                            </div>
                        </div>
                    )}

                    {booking.deliveryUrl && (
                        <div className={`p-4 border rounded-xl flex justify-between items-center
                            ${!fullyPaid && currentUser?.role !== 'OWNER' ? 'bg-gray-900 border-gray-800 opacity-50 pointer-events-none' : 'bg-blue-500/10 border-blue-500/30'}
                        `}>
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
                                    {(!fullyPaid && currentUser?.role !== 'OWNER') ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                            <Lock className="text-white/50" size={20} />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 bg-black/50 rounded-full text-white hover:bg-lumina-accent hover:text-black transition-colors"><Download size={16} /></button>
                                        </div>
                                    )}
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

            {/* ... (Rest of Tabs) ... */}
            {activeTab === 'CONTRACT' && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 animate-in fade-in duration-300">
                    <FileSignature size={48} className="text-lumina-muted opacity-20" />
                    <p className="text-lumina-muted text-sm">Contract Status: <span className="font-bold text-white">{booking.contractStatus}</span></p>
                    {booking.contractStatus === 'PENDING' && (
                        <button onClick={signContract} className="px-4 py-2 bg-lumina-accent text-lumina-base rounded-lg text-sm font-bold hover:bg-lumina-accent/90">
                            Mark as Signed
                        </button>
                    )}
                </div>
            )}

            {/* --- DRIVE PICKER MODAL --- */}
            <AnimatePresence>
                {showDrivePicker && (
                    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {driveBreadcrumbs.length > 1 && (
                                    <button onClick={handleDriveBack} className="p-1 hover:bg-white/10 rounded text-white">
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <div>
                                    <h3 className="font-bold text-white">Select Location</h3>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        {driveBreadcrumbs.map(b => b.name).join(' > ')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowNewFolderInput(!showNewFolderInput)} 
                                    className="p-2 bg-white/10 rounded-full hover:bg-white/20"
                                    title="New Folder"
                                >
                                    <FolderPlus size={20} />
                                </button>
                                <button onClick={() => setShowDrivePicker(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* New Folder Input */}
                        {showNewFolderInput && (
                            <div className="p-4 bg-white/5 border-b border-white/10 flex gap-2">
                                <input 
                                    autoFocus
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="flex-1 bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Folder Name..."
                                />
                                <button 
                                    onClick={createSubFolder}
                                    disabled={!newFolderName || actionLoading}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {actionLoading ? '...' : 'Create'}
                                </button>
                            </div>
                        )}

                        {/* Rename Input */}
                        {renamingItem && (
                            <div className="p-4 bg-white/5 border-b border-white/10 flex gap-2 items-center">
                                <span className="text-xs text-gray-400 uppercase font-bold">Rename:</span>
                                <input 
                                    autoFocus
                                    value={renameInput}
                                    onChange={(e) => setRenameInput(e.target.value)}
                                    className="flex-1 bg-black border border-white/20 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                />
                                <button 
                                    onClick={renameItem}
                                    disabled={!renameInput || actionLoading}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {actionLoading ? '...' : 'Save'}
                                </button>
                                <button 
                                    onClick={() => setRenamingItem(null)}
                                    className="px-3 py-2 text-gray-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {isLoadingDrive ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <Loader2 size={32} className="animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {driveFolderList.map(folder => (
                                        <div 
                                            key={folder.id}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 cursor-pointer select-none group relative"
                                            onDoubleClick={() => handleNavigateDrive(folder)}
                                        >
                                            <div className="flex items-center gap-3 flex-1" onClick={() => { /* Selection Logic could go here */ }}>
                                                <Folder size={24} className="text-yellow-500 fill-yellow-500/20" />
                                                <span className="text-sm text-gray-200">{folder.name}</span>
                                            </div>
                                            
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === folder.id ? null : folder.id); }}
                                                    className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                
                                                {activeMenuId === folder.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-32 bg-black border border-white/20 rounded shadow-xl z-20 overflow-hidden">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setRenamingItem(folder); setRenameInput(folder.name); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2"
                                                        >
                                                            <Edit size={12} /> Rename
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); trashItem(folder); }}
                                                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/10 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={12} /> Trash
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {driveFolderList.length === 0 && (
                                        <div className="text-center text-gray-500 py-10 italic">Empty Folder</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black">
                            <button onClick={() => setShowDrivePicker(false)} className="px-4 py-2 text-gray-400 font-bold text-xs hover:text-white">Cancel</button>
                            <button 
                                onClick={() => createDriveFolder(currentDriveFolderId)}
                                disabled={isUploading || actionLoading}
                                className="px-6 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
                                Use This Folder
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

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
