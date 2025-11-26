import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ProjectStatus, User, BookingFile, StudioConfig, Package, BookingItem, BookingTask, ActivityLog, Asset, BookingComment, Discount, TimeLog, Transaction, Account } from '../types';
import { X, Image as ImageIcon, FileSignature, Clock, CheckCircle2, Circle, Upload, PenTool, Download, Calendar, Save, Trash2, Edit, Plus, Loader2, FileText, ExternalLink, Paperclip, Check, Send, RefreshCw, AlertCircle, Lock, Timer, ListChecks, History, DollarSign, User as UserIcon, MapPin, Briefcase, Camera, Box, Wrench, AlertTriangle, TrendingUp, Tag, MessageSquare, Play, Square, Pause, PieChart, MinusCircle, ChevronRight, HardDrive, LayoutDashboard, FolderOpen, Palette, ArrowLeft, Folder, MoreVertical, FolderPlus, Eye, MessageCircle, Copy } from 'lucide-react';
import WhatsAppModal from './WhatsAppModal'; 

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
  onLogActivity?: (bookingId: string, action: string, details: string) => void;
}

type Tab = 'OVERVIEW' | 'TASKS' | 'MOODBOARD' | 'TIMELINE' | 'LOGS' | 'PROFITABILITY' | 'PROOFING';

const Motion = motion as any;

interface DriveFolder {
    id: string;
    name: string;
}

const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ isOpen, onClose, booking, photographer, onUpdateBooking, onDeleteBooking, bookings = [], config, packages = [], currentUser, assets = [], users = [], transactions = [], onAddTransaction, accounts = [], googleToken, onLogActivity }) => {
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
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false); 
  
  // WhatsApp Prompt State
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);

  const [activeTimerStart, setActiveTimerStart] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  // Calculations for Payment Status
  const isPaymentSettled = useMemo(() => {
      if (!booking) return false;
      // Re-calculate total to be safe
      const tax = booking.taxSnapshot || 0;
      let subtotal = booking.price;
      if (booking.items && booking.items.length > 0) {
          subtotal = booking.items.reduce((acc, item) => acc + item.total, 0);
      }
      let discountVal = 0;
      if (booking.discount) {
          discountVal = booking.discount.type === 'PERCENT' ? subtotal * (booking.discount.value/100) : booking.discount.value;
      }
      const total = (subtotal - discountVal) * (1 + tax/100);
      return booking.paidAmount >= (total - 100);
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
      setShowWhatsAppPrompt(false);
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

  // --- DRIVE FUNCTIONS ---
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

  const handleUploadToDrive = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!googleToken) {
          alert("Google Drive not connected. Please go to Settings > Integrations.");
          return;
      }

      // Extract ID from url: https://drive.google.com/drive/u/0/folders/123456...
      const match = booking?.deliveryUrl?.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      const folderId = match ? match[1] : null;

      if (!folderId) {
          alert("No valid Drive Folder linked. Please click 'Create / Link Folder' first.");
          return;
      }

      setIsUploading(true);
      try {
          const metadata = {
              name: file.name,
              mimeType: file.type,
              parents: [folderId]
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', file);

          const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${googleToken}`,
              },
              body: form
          });

          if (!res.ok) {
              if (res.status === 401) {
                  alert("Google Session Expired. Please reconnect in Settings.");
              } else {
                  const err = await res.json();
                  throw new Error(err.error?.message || "Upload failed");
              }
              return;
          }
          
          if(booking && onLogActivity) {
              onLogActivity(booking.id, 'DRIVE_UPLOAD', `Uploaded ${file.name} to Drive`);
          }
          
          alert(`'${file.name}' uploaded successfully to the project folder!`);
          
      } catch (error: any) {
          console.error("Drive Upload Error:", error);
          alert("Upload failed: " + error.message);
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleUploadClick = () => {
      if (!booking?.deliveryUrl) {
          alert("Please link a Google Drive folder first.");
          return;
      }
      fileInputRef.current?.click();
  };

  // ... (Log functions, Timer functions) ...
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
          let newTasks: BookingTask[] = [];
          const automations = config?.workflowAutomations || [];
          const automation = automations.find(a => a.triggerStatus === status);
          
          if (automation && automation.tasks.length > 0) {
              newTasks = automation.tasks.map(title => ({
                  id: `at-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  title: title,
                  completed: false,
                  assignedTo: currentUser?.id
              }));
          }

          if (status === 'CULLING') {
              setRevenueWarning("Tip: Did the shoot run late? Check if Overtime Fee is needed.");
              setShowOvertimePrompt(true);
          } else if (status === 'COMPLETED') {
              setShowWhatsAppPrompt(true);
          } else {
              setShowOvertimePrompt(false);
              setShowWhatsAppPrompt(false);
          }

          onUpdateBooking({ 
              ...booking, 
              status, 
              tasks: [...(booking.tasks || []), ...newTasks],
              logs: newTasks.length > 0 ? [createLocalLog('AUTOMATION', `Generated tasks for ${status}`), log, ...(booking.logs || [])] : [log, ...(booking.logs || [])] 
          });
      }
  };

  const handleSaveLogistics = () => {
      if(booking) {
          const newDuration = logisticsForm.duration;
          const originalDuration = booking.duration;
          
          if (newDuration > originalDuration) {
              setRevenueWarning(`Duration increased by ${newDuration - originalDuration}h. Consider adding Overtime Fee.`);
              setShowOvertimePrompt(true);
          }

          onUpdateBooking({
              ...booking,
              ...logisticsForm,
              logs: [createLocalLog('RESCHEDULE', `Changed to ${logisticsForm.date} @ ${logisticsForm.timeStart}`), ...(booking.logs || [])]
          });
          setIsLogisticsEditing(false);
      }
  };

  const handleDelete = () => {
      if (booking && onDeleteBooking && window.confirm('Are you sure you want to archive this project?')) {
          onDeleteBooking(booking.id);
          onClose();
      }
  };

  const handleAddTask = () => {
      if (booking && newTaskTitle) {
          const task: BookingTask = { id: `t-${Date.now()}`, title: newTaskTitle, completed: false };
          onUpdateBooking({ ...booking, tasks: [...(booking.tasks || []), task] });
          setNewTaskTitle('');
      }
  };

  const handleToggleTask = (taskId: string) => {
      if (booking && booking.tasks) {
          const updatedTasks = booking.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
          onUpdateBooking({ ...booking, tasks: updatedTasks });
      }
  };

  const handleLinkDriveFolder = () => {
      if (booking) {
          const folderName = driveBreadcrumbs[driveBreadcrumbs.length - 1].name;
          const folderLink = `https://drive.google.com/drive/u/0/folders/${currentDriveFolderId}`;
          
          onUpdateBooking({
              ...booking,
              deliveryUrl: folderLink,
              logs: [createLocalLog('DRIVE_LINK', `Linked Drive folder: ${folderName}`), ...(booking.logs || [])]
          });
          setShowDrivePicker(false);
      }
  };

  const handleQuickWhatsApp = () => {
      const msg = `Hi ${booking?.clientName}, just checking in on your project!`;
      const phone = booking?.clientPhone.replace(/\D/g, '') || '';
      const url = `https://wa.me/${phone.startsWith('0') ? '62'+phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      if(booking && onLogActivity) onLogActivity(booking.id, 'COMMUNICATION', 'Sent Quick WhatsApp');
  };

  const handleCopyPortalLink = () => {
      const link = `${window.location.origin}/?site=${config?.ownerId || ''}&booking=${booking?.id}`;
      navigator.clipboard.writeText(link);
      alert("Client Portal Link Copied to Clipboard!");
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <Motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-lumina-surface border border-lumina-highlight w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="p-6 border-b border-lumina-highlight bg-lumina-base flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-display font-bold text-white">{booking.clientName}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider
                            ${booking.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-lumina-highlight text-lumina-muted border-lumina-highlight'}
                        `}>
                            {booking.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-lumina-muted mt-1">
                        <span className="flex items-center gap-1"><Tag size={12}/> {booking.package}</span>
                        <span className="flex items-center gap-1"><MapPin size={12}/> {booking.studio}</span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(booking.date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <select 
                    className="bg-lumina-surface border border-lumina-highlight text-white text-xs rounded-lg p-2 font-bold uppercase tracking-wide focus:border-lumina-accent outline-none"
                    value={booking.status}
                    onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                >
                    {['INQUIRY', 'BOOKED', 'SHOOTING', 'CULLING', 'EDITING', 'REVIEW', 'COMPLETED', 'CANCELLED'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <button onClick={handleDelete} className="p-2 hover:bg-rose-500/20 text-lumina-muted hover:text-rose-500 rounded-lg transition-colors">
                    <Trash2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-lumina-highlight text-lumina-muted hover:text-white rounded-lg transition-colors">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* TABS */}
        <div className="bg-lumina-surface border-b border-lumina-highlight px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {[
                { id: 'OVERVIEW', icon: LayoutDashboard, label: 'Overview' },
                { id: 'TASKS', icon: ListChecks, label: 'Tasks' },
                { id: 'TIMELINE', icon: HardDrive, label: 'Files & Delivery' },
                { id: 'PROOFING', icon: Eye, label: 'Client Proofing' },
                { id: 'MOODBOARD', icon: Palette, label: 'Moodboard' },
                { id: 'LOGS', icon: History, label: 'Activity' },
                { id: 'PROFITABILITY', icon: PieChart, label: 'Financials' }
            ].map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all
                        ${activeTab === tab.id ? 'bg-lumina-accent text-lumina-base shadow-lg shadow-lumina-accent/20' : 'text-lumina-muted hover:text-white hover:bg-lumina-highlight'}
                    `}
                >
                    <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-lumina-base/50 p-6 pb-24">
            
            {activeTab === 'OVERVIEW' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Logistics Card */}
                    <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 lg:col-span-2">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2"><Clock size={18} className="text-lumina-accent"/> Session Logistics</h3>
                            {!isLogisticsEditing ? (
                                <button onClick={() => setIsLogisticsEditing(true)} className="text-xs font-bold text-lumina-accent hover:underline">Edit Details</button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsLogisticsEditing(false)} className="text-xs font-bold text-lumina-muted">Cancel</button>
                                    <button onClick={handleSaveLogistics} className="text-xs font-bold text-emerald-400">Save</button>
                                </div>
                            )}
                        </div>

                        {isLogisticsEditing ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-lumina-muted block mb-1">Date</label>
                                    <input type="date" className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white" value={logisticsForm.date} onChange={e => setLogisticsForm({...logisticsForm, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-lumina-muted block mb-1">Time</label>
                                    <input type="time" className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white" value={logisticsForm.timeStart} onChange={e => setLogisticsForm({...logisticsForm, timeStart: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-lumina-muted block mb-1">Duration (h)</label>
                                    <input type="number" className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white" value={logisticsForm.duration} onChange={e => setLogisticsForm({...logisticsForm, duration: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs text-lumina-muted block mb-1">Studio</label>
                                    <input className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white" value={logisticsForm.studio} onChange={e => setLogisticsForm({...logisticsForm, studio: e.target.value})} />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="p-3 bg-lumina-base rounded-xl border border-lumina-highlight">
                                    <p className="text-xs text-lumina-muted mb-1">Date</p>
                                    <p className="font-bold text-white">{new Date(booking.date).toLocaleDateString()}</p>
                                </div>
                                <div className="p-3 bg-lumina-base rounded-xl border border-lumina-highlight">
                                    <p className="text-xs text-lumina-muted mb-1">Time</p>
                                    <p className="font-bold text-white">{booking.timeStart} ({booking.duration}h)</p>
                                </div>
                                <div className="p-3 bg-lumina-base rounded-xl border border-lumina-highlight">
                                    <p className="text-xs text-lumina-muted mb-1">Studio</p>
                                    <p className="font-bold text-white">{booking.studio}</p>
                                </div>
                                <div className="p-3 bg-lumina-base rounded-xl border border-lumina-highlight">
                                    <p className="text-xs text-lumina-muted mb-1">Photographer</p>
                                    <div className="flex items-center gap-2">
                                        <img src={photographer?.avatar} className="w-5 h-5 rounded-full" />
                                        <p className="font-bold text-white truncate">{photographer?.name || 'Unassigned'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {showOvertimePrompt && (
                            <Motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex justify-between items-center">
                                <div className="text-amber-200 text-xs">
                                    <p className="font-bold flex items-center gap-2"><AlertTriangle size={12}/> Overtime Detected</p>
                                    <p>{revenueWarning}</p>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('PROFITABILITY')}
                                    className="text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded hover:bg-amber-500 hover:text-black transition-colors"
                                >
                                    Add Charge
                                </button>
                            </Motion.div>
                        )}

                        {showWhatsAppPrompt && (
                            <Motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex justify-between items-center">
                                <div className="text-emerald-200 text-xs">
                                    <p className="font-bold flex items-center gap-2"><MessageCircle size={12}/> Job Completed</p>
                                    <p>Send Thank You message & Delivery Link?</p>
                                </div>
                                <button 
                                    onClick={handleQuickWhatsApp}
                                    className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-500 hover:text-black transition-colors"
                                >
                                    Send WA
                                </button>
                            </Motion.div>
                        )}
                    </div>

                    {/* Team Card */}
                    <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><UserIcon size={18} className="text-blue-400"/> Team</h3>
                        <div className="space-y-3">
                            {photographer && (
                                <div className="flex items-center justify-between p-2 bg-lumina-base rounded-lg border border-lumina-highlight">
                                    <div className="flex items-center gap-3">
                                        <img src={photographer.avatar} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="text-sm font-bold text-white">{photographer.name}</p>
                                            <p className="text-[10px] text-lumina-muted">Lead Photographer</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {booking.editorId && (
                                <div className="flex items-center justify-between p-2 bg-lumina-base rounded-lg border border-lumina-highlight">
                                    <div className="flex items-center gap-3">
                                        <img src={`https://ui-avatars.com/api/?name=${booking.editorId}&background=random`} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="text-sm font-bold text-white">Editor Assigned</p>
                                            <p className="text-[10px] text-lumina-muted">Post-Production</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'TASKS' && (
                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 max-w-3xl mx-auto">
                    <div className="flex gap-2 mb-6">
                        <input 
                            className="flex-1 bg-lumina-base border border-lumina-highlight rounded-xl px-4 text-sm text-white focus:border-lumina-accent outline-none"
                            placeholder="Add a new task..."
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                        />
                        <button onClick={handleAddTask} className="bg-lumina-highlight hover:bg-lumina-accent hover:text-lumina-base text-white p-3 rounded-xl transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {(booking.tasks || []).map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-lumina-base/50 rounded-lg transition-colors group">
                                <button 
                                    onClick={() => handleToggleTask(task.id)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                        ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-lumina-muted text-transparent hover:border-emerald-500'}
                                    `}
                                >
                                    <Check size={14} />
                                </button>
                                <span className={`text-sm flex-1 ${task.completed ? 'text-lumina-muted line-through' : 'text-white'}`}>{task.title}</span>
                                <button 
                                    onClick={() => {
                                        const newTasks = booking.tasks?.filter(t => t.id !== task.id);
                                        onUpdateBooking({...booking, tasks: newTasks});
                                    }}
                                    className="text-lumina-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        ))}
                        {(booking.tasks || []).length === 0 && (
                            <p className="text-center text-lumina-muted text-sm py-8 italic">No tasks yet. Add one above.</p>
                        )}
                    </div>
                </div>
            )}

            {/* TIMELINE / FILES TAB */}
            {activeTab === 'TIMELINE' && (
                <div className="space-y-6">
                    <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><HardDrive size={18} className="text-lumina-accent"/> Project Files</h3>
                        
                        {/* Drive Link Section */}
                        <div className="p-4 bg-lumina-base border border-lumina-highlight rounded-xl flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">Google Drive Folder</p>
                                    {booking.deliveryUrl ? (
                                        <a href={booking.deliveryUrl} target="_blank" className="text-xs text-blue-400 hover:underline truncate block max-w-[200px]">{booking.deliveryUrl}</a>
                                    ) : (
                                        <p className="text-xs text-lumina-muted">Not connected yet.</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {booking.deliveryUrl ? (
                                    <a href={booking.deliveryUrl} target="_blank" className="px-4 py-2 bg-lumina-surface border border-lumina-highlight hover:bg-lumina-highlight text-white text-xs font-bold rounded-lg transition-colors">
                                        Open Folder
                                    </a>
                                ) : (
                                    <button 
                                        onClick={() => setShowDrivePicker(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={14}/> Create / Link Folder
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Delivery Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                                onClick={handleUploadClick}
                                className="p-4 border border-dashed border-lumina-highlight rounded-xl flex flex-col items-center justify-center text-center hover:border-lumina-accent/50 transition-colors bg-lumina-base/30 h-32 cursor-pointer group relative"
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleUploadToDrive} 
                                />
                                {isUploading ? (
                                    <Loader2 className="animate-spin text-lumina-accent mb-2" />
                                ) : (
                                    <Upload className="text-lumina-muted group-hover:text-white mb-2 transition-colors" />
                                )}
                                <p className="text-sm font-bold text-white">{isUploading ? 'Uploading to Drive...' : 'Upload Deliverables'}</p>
                                <p className="text-xs text-lumina-muted">{isUploading ? 'Please wait' : 'Click to upload to linked Drive folder'}</p>
                            </div>
                            
                            <div className="p-4 bg-lumina-base border border-lumina-highlight rounded-xl relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white text-sm">Client Access</h4>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPaymentSettled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {isPaymentSettled ? 'Unlocked' : 'Locked'}
                                    </div>
                                </div>
                                <p className="text-xs text-lumina-muted mb-4">
                                    {isPaymentSettled 
                                        ? "Payment complete. You can send the download link to the client." 
                                        : "Outstanding balance detected. Download access is restricted until settled."}
                                </p>
                                <button 
                                    disabled={!isPaymentSettled && currentUser?.role !== 'OWNER'}
                                    onClick={handleQuickWhatsApp}
                                    className="w-full py-2 bg-lumina-surface border border-lumina-highlight hover:bg-lumina-highlight text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {!isPaymentSettled && <Lock size={12}/>} Send Delivery Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'PROOFING' && (
                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2"><Eye size={18} className="text-lumina-accent"/> Client Proofing Portal</h3>
                        <div className="text-xs text-lumina-muted font-mono">0 Selected</div>
                    </div>
                    
                    <div className="p-8 text-center border border-dashed border-lumina-highlight rounded-xl bg-lumina-base/20 mb-6">
                        <p className="text-sm text-lumina-muted mb-2">Client Selection View (Simulation)</p>
                        <p className="text-xs text-lumina-muted/50">This is where clients would select their favorite photos.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="aspect-square bg-lumina-base border border-lumina-highlight rounded-lg flex items-center justify-center relative group hover:border-lumina-accent transition-colors">
                                <ImageIcon className="text-lumina-muted/20 w-8 h-8" />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="w-6 h-6 rounded-full bg-black/50 border border-white/20 flex items-center justify-center hover:bg-lumina-accent hover:text-black">
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 text-center">
                                    <span className="text-[10px] bg-black/50 px-1 rounded text-white">IMG_00{i}.jpg</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'LOGS' && (
                <div className="space-y-4">
                    {(booking.logs || []).map((log) => (
                        <div key={log.id} className="flex gap-3 p-3 border-b border-lumina-highlight/50 last:border-0">
                            <div className="mt-1">
                                {log.action === 'COMMUNICATION' ? (
                                    <MessageCircle size={14} className="text-emerald-400" />
                                ) : log.action === 'STATUS_CHANGE' ? (
                                    <RefreshCw size={14} className="text-blue-400" />
                                ) : (
                                    <Circle size={8} className="text-lumina-muted fill-lumina-muted" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-white font-bold">{log.action.replace('_', ' ')}</p>
                                <p className="text-xs text-lumina-muted">{log.details}</p>
                                <p className="text-[10px] text-lumina-muted/50 mt-1">{new Date(log.timestamp).toLocaleString()} by {log.userName}</p>
                            </div>
                        </div>
                    ))}
                    {(booking.logs || []).length === 0 && <p className="text-center text-lumina-muted text-xs py-4">No activity recorded.</p>}
                </div>
            )}

            {activeTab === 'PROFITABILITY' && (
                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 max-w-4xl mx-auto">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><PieChart size={18} className="text-emerald-400"/> Project Financials</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="p-4 bg-lumina-base rounded-xl border border-lumina-highlight">
                            <p className="text-xs text-lumina-muted uppercase font-bold">Revenue</p>
                            <p className="text-xl font-mono font-bold text-white mt-1">Rp {booking.price.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-lumina-base rounded-xl border border-lumina-highlight">
                            <p className="text-xs text-lumina-muted uppercase font-bold">Expenses (COGS)</p>
                            <p className="text-xl font-mono font-bold text-rose-400 mt-1">
                                Rp {(booking.items?.reduce((sum, i) => sum + (i.cost || 0), 0) || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-lumina-base rounded-xl border border-lumina-highlight">
                            <p className="text-xs text-lumina-muted uppercase font-bold">Net Profit</p>
                            <p className="text-xl font-mono font-bold text-emerald-400 mt-1">
                                Rp {(booking.price - (booking.items?.reduce((sum, i) => sum + (i.cost || 0), 0) || 0)).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-lumina-muted uppercase border-b border-lumina-highlight pb-2">Line Items & Costs</h4>
                        {booking.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-lumina-base rounded">
                                <div>
                                    <p className="font-bold text-white">{item.description}</p>
                                    <p className="text-xs text-lumina-muted">Qty: {item.quantity} x {item.unitPrice.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-mono">Rp {item.total.toLocaleString()}</p>
                                    <p className="text-xs text-rose-400 font-mono">Cost: Rp {(item.cost || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                        
                        {/* Quick Add Item */}
                        <div className="flex gap-2 mt-4">
                            <input placeholder="Item desc" className="flex-[2] bg-lumina-base border border-lumina-highlight rounded px-2 py-1 text-xs text-white" 
                                value={newLineItem.description} onChange={e => setNewLineItem({...newLineItem, description: e.target.value})} />
                            <input placeholder="Price" type="number" className="flex-1 bg-lumina-base border border-lumina-highlight rounded px-2 py-1 text-xs text-white" 
                                value={newLineItem.unitPrice || ''} onChange={e => setNewLineItem({...newLineItem, unitPrice: Number(e.target.value)})} />
                            <input placeholder="Cost" type="number" className="flex-1 bg-lumina-base border border-lumina-highlight rounded px-2 py-1 text-xs text-white" 
                                value={newLineItem.cost || ''} onChange={e => setNewLineItem({...newLineItem, cost: Number(e.target.value)})} />
                            <button 
                                onClick={() => {
                                    if(newLineItem.description && newLineItem.unitPrice) {
                                        const item: BookingItem = {
                                            id: `i-${Date.now()}`,
                                            description: newLineItem.description,
                                            quantity: 1,
                                            unitPrice: Number(newLineItem.unitPrice),
                                            total: Number(newLineItem.unitPrice),
                                            cost: Number(newLineItem.cost || 0)
                                        };
                                        onUpdateBooking({...booking, items: [...(booking.items || []), item]});
                                        setNewLineItem({description:'', unitPrice:0, cost:0});
                                    }
                                }}
                                className="bg-emerald-500 text-white px-3 rounded font-bold text-xs"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DRIVE PICKER MODAL (Nested) */}
            <AnimatePresence>
                {showDrivePicker && (
                    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
                        <Motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-lumina-surface border border-lumina-highlight w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[600px]"
                        >
                            <div className="p-4 border-b border-lumina-highlight flex justify-between items-center bg-lumina-base rounded-t-xl">
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5" />
                                        Select Project Folder
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-lumina-muted mt-1">
                                        {driveBreadcrumbs.map((crumb, i) => (
                                            <React.Fragment key={crumb.id}>
                                                <span 
                                                    onClick={() => {
                                                        setDriveBreadcrumbs(prev => prev.slice(0, i + 1));
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="hover:text-white cursor-pointer hover:underline"
                                                >
                                                    {crumb.name}
                                                </span>
                                                {i < driveBreadcrumbs.length - 1 && <ChevronRight size={10} />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowNewFolderInput(!showNewFolderInput)} className="p-2 hover:bg-lumina-highlight rounded text-lumina-muted hover:text-white" title="New Folder">
                                        <FolderPlus size={18} />
                                    </button>
                                    <button onClick={() => setShowDrivePicker(false)} className="p-2 hover:bg-lumina-highlight rounded text-lumina-muted hover:text-white">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {showNewFolderInput && (
                                <div className="p-2 bg-lumina-highlight/20 border-b border-lumina-highlight flex gap-2">
                                    <input 
                                        autoFocus
                                        placeholder="New Folder Name"
                                        className="flex-1 bg-lumina-base border border-lumina-highlight rounded px-3 py-1.5 text-sm text-white focus:border-lumina-accent outline-none"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && createSubFolder()}
                                    />
                                    <button onClick={createSubFolder} disabled={actionLoading} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold">Create</button>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                {isLoadingDrive ? (
                                    <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-lumina-accent"/></div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-1">
                                        {driveBreadcrumbs.length > 1 && (
                                            <div onClick={handleDriveBack} className="flex items-center gap-3 p-2 hover:bg-lumina-highlight rounded cursor-pointer text-lumina-muted">
                                                <ArrowLeft size={16} /> <span className="text-sm font-bold">Back</span>
                                            </div>
                                        )}
                                        {driveFolderList.map(folder => (
                                            <div 
                                                key={folder.id} 
                                                className="flex items-center justify-between p-2 hover:bg-lumina-highlight rounded cursor-pointer group relative"
                                                onClick={() => handleNavigateDrive(folder)}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Folder className="text-blue-400 shrink-0 fill-blue-400/20" size={18} />
                                                    {renamingItem?.id === folder.id ? (
                                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                            <input 
                                                                autoFocus
                                                                className="bg-black border border-lumina-accent rounded px-2 py-0.5 text-sm text-white"
                                                                value={renameInput}
                                                                onChange={e => setRenameInput(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && renameItem()}
                                                            />
                                                            <button onClick={renameItem} className="text-xs bg-lumina-accent text-black px-2 rounded">Save</button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-white truncate">{folder.name}</span>
                                                    )}
                                                </div>
                                                
                                                <div className="relative" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        className="p-1 text-lumina-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setActiveMenuId(activeMenuId === folder.id ? null : folder.id)}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {activeMenuId === folder.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-black border border-lumina-highlight rounded shadow-xl z-50 overflow-hidden">
                                                            <button onClick={() => { setRenamingItem(folder); setRenameInput(folder.name); setActiveMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-lumina-highlight flex items-center gap-2"><Edit size={12}/> Rename</button>
                                                            <button onClick={() => trashItem(folder)} className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-lumina-highlight flex items-center gap-2"><Trash2 size={12}/> Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {driveFolderList.length === 0 && (
                                            <p className="text-center text-lumina-muted text-sm py-8">No sub-folders found.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-lumina-highlight bg-lumina-base rounded-b-xl flex justify-between items-center">
                                <p className="text-xs text-lumina-muted">Current: <span className="text-white font-bold">{driveBreadcrumbs[driveBreadcrumbs.length-1].name}</span></p>
                                <button 
                                    onClick={handleLinkDriveFolder}
                                    className="px-4 py-2 bg-lumina-accent text-lumina-base font-bold text-xs rounded-lg hover:bg-lumina-accent/90"
                                >
                                    Select This Folder
                                </button>
                            </div>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>

        {/* STICKY QUICK ACTIONS FOOTER */}
        <div className="border-t border-lumina-highlight bg-lumina-base p-4 flex justify-between items-center">
            <div className="text-[10px] text-lumina-muted uppercase tracking-wider">Quick Actions</div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('TIMELINE')} className="flex items-center gap-2 px-4 py-2 bg-lumina-surface border border-lumina-highlight rounded-xl hover:bg-lumina-highlight text-white text-xs font-bold transition-colors">
                    <Upload size={14}/> Upload
                </button>
                <button onClick={handleQuickWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white text-emerald-400 text-xs font-bold transition-colors">
                    <MessageCircle size={14}/> WhatsApp
                </button>
                <button onClick={handleCopyPortalLink} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white text-blue-400 text-xs font-bold transition-colors">
                    <Copy size={14}/> Copy Portal Link
                </button>
            </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default ProjectDrawer;