
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ProjectStatus, User, StudioConfig } from '../types';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, GripVertical, CheckSquare } from 'lucide-react';

const Motion = motion as any;

interface ProductionViewProps {
  bookings: Booking[];
  onSelectBooking: (bookingId: string) => void; 
  currentUser?: User; 
  onUpdateBooking?: (booking: Booking) => void;
  config: StudioConfig; // Added config prop
}

const ProductionView: React.FC<ProductionViewProps> = ({ bookings, onSelectBooking, currentUser, onUpdateBooking, config }) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINE'>('ALL');
  
  // Drag State
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<ProjectStatus | null>(null);
  
  const columns: { id: ProjectStatus; label: string; color: string; borderColor: string }[] = [
    { id: 'INQUIRY', label: 'Inquiry / Lead', color: 'bg-gray-500/10', borderColor: 'border-gray-500/50' },
    { id: 'BOOKED', label: 'Confirmed (DP Paid)', color: 'bg-indigo-500/10', borderColor: 'border-indigo-500/50' },
    { id: 'SHOOTING', label: 'In Studio', color: 'bg-blue-500/10', borderColor: 'border-blue-500/50' },
    { id: 'CULLING', label: 'Selection', color: 'bg-amber-500/10', borderColor: 'border-amber-500/50' },
    { id: 'EDITING', label: 'Retouching', color: 'bg-purple-500/10', borderColor: 'border-purple-500/50' },
    { id: 'REVIEW', label: 'Quality Check', color: 'bg-pink-500/10', borderColor: 'border-pink-500/50' },
    { id: 'COMPLETED', label: 'Ready / Done', color: 'bg-emerald-500/10', borderColor: 'border-emerald-500/50' },
  ];

  // --- LOGIC ---

  const isPaymentSettled = (booking: Booking) => {
      const taxRate = config.taxRate || 0;
      const totalDue = booking.price + (booking.price * taxRate / 100);
      return booking.paidAmount >= totalDue;
  }

  const getNextStage = (status: ProjectStatus): ProjectStatus | null => {
      const flow: ProjectStatus[] = ['INQUIRY', 'BOOKED', 'SHOOTING', 'CULLING', 'EDITING', 'REVIEW', 'COMPLETED'];
      const idx = flow.indexOf(status);
      if (idx !== -1 && idx < flow.length - 1) {
          return flow[idx + 1];
      }
      return null;
  };

  const handleAdvance = (e: React.MouseEvent, booking: Booking) => {
      e.stopPropagation();
      const next = getNextStage(booking.status);
      
      if (next === 'COMPLETED' && !isPaymentSettled(booking)) {
          alert(`GATEKEEPER ALERT\n\nCannot move to COMPLETED.\nClient has outstanding balance.\nPlease settle payment in Finance tab first.`);
          return;
      }

      if (next && onUpdateBooking) {
          onUpdateBooking({ ...booking, status: next });
      }
  };

  const isOverdue = (booking: Booking) => {
      if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') return false;
      const bookingDate = new Date(booking.date);
      const today = new Date();
      // Only overdue if date is in the past (yesterday or earlier)
      today.setHours(0,0,0,0);
      bookingDate.setHours(0,0,0,0);
      return bookingDate < today;
  };

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedBookingId(id);
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: ProjectStatus) => {
      e.preventDefault(); 
      if (activeDropColumn !== status) {
          setActiveDropColumn(status);
      }
  };

  const handleDrop = (e: React.DragEvent, status: ProjectStatus) => {
      e.preventDefault();
      e.stopPropagation(); 
      
      const id = e.dataTransfer.getData("text/plain");
      
      if (id && onUpdateBooking) {
          const booking = bookings.find(b => b.id === id);
          if (booking && booking.status !== status) {
              // GATEKEEPER CHECK FOR COMPLETION
              if (status === 'COMPLETED' && !isPaymentSettled(booking)) {
                   alert(`GATEKEEPER ALERT\n\nCannot move to COMPLETED.\nClient has outstanding balance.\nPlease settle payment in Finance tab first.`);
                   resetDragState();
                   return;
              }

              onUpdateBooking({ ...booking, status: status });
          }
      }
      resetDragState();
  };

  const handleDragEnd = () => {
      resetDragState();
  };

  const resetDragState = () => {
      setDraggedBookingId(null);
      setActiveDropColumn(null);
  };

  // --- RENDER ---

  const filteredBookings = bookings.filter(b => {
      if (b.status === 'CANCELLED') return false; 
      if (filterMode === 'MINE' && currentUser) {
          return b.photographerId === currentUser.id || b.editorId === currentUser.id;
      }
      return true;
  });

  const getTasksByStatus = (status: ProjectStatus) => filteredBookings.filter(b => b.status === status);

  return (
    <div className="h-[calc(100vh-100px)] overflow-hidden flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-display font-bold text-white mb-2">Production Board</h1>
           <p className="text-lumina-muted">Drag and drop cards to move projects through the pipeline.</p>
        </div>
        <div className="flex gap-3">
             <div className="bg-lumina-surface border border-lumina-highlight p-1 rounded-lg flex">
                 <button 
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'ALL' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}
                 >
                     All Tasks
                 </button>
                 <button 
                    onClick={() => setFilterMode('MINE')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${filterMode === 'MINE' ? 'bg-lumina-accent text-lumina-base' : 'text-lumina-muted hover:text-white'}`}
                 >
                     My Tasks
                 </button>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-[1800px]">
          {columns.map((col) => {
            const tasks = getTasksByStatus(col.id);
            const isTarget = activeDropColumn === col.id;
            
            return (
              <div 
                key={col.id} 
                className={`flex-1 flex flex-col min-w-[280px] h-full rounded-xl border-2 transition-all duration-200
                    ${isTarget 
                        ? 'border-lumina-accent bg-lumina-accent/5 ring-4 ring-lumina-accent/10' 
                        : 'border-transparent bg-lumina-highlight/10'}
                `}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between p-3 border-b ${col.borderColor} bg-lumina-surface/50 rounded-t-lg backdrop-blur-sm select-none`}>
                  <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.borderColor.replace('border-', 'bg-').replace('/50', '')}`}></span>
                      {col.label}
                  </h3>
                  <span className="text-xs bg-lumina-base px-2 py-0.5 rounded-full text-lumina-muted font-mono">{tasks.length}</span>
                </div>

                {/* Drop Zone / Card List */}
                <div className="flex-1 p-2 overflow-y-auto space-y-3 custom-scrollbar relative">
                  <AnimatePresence>
                    {tasks.map((task) => {
                        const overdue = isOverdue(task);
                        const isDragging = draggedBookingId === task.id;
                        
                        // Progress Calculation
                        const totalTasks = task.tasks?.length || 0;
                        const completedTasks = task.tasks?.filter(t => t.completed).length || 0;
                        const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                        return (
                            <Motion.div
                                layoutId={task.id}
                                key={task.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: isDragging ? 0.4 : 1, scale: isDragging ? 0.95 : 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                draggable
                                onDragStart={(e: React.DragEvent) => handleDragStart(e, task.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e: React.DragEvent) => handleDragOver(e, col.id)}
                                onDrop={(e: React.DragEvent) => handleDrop(e, col.id)}
                                onClick={() => onSelectBooking(task.id)}
                                className={`
                                    bg-lumina-surface p-4 rounded-xl border shadow-sm group cursor-grab active:cursor-grabbing relative overflow-hidden select-none z-10
                                    ${overdue ? 'border-red-500/40 shadow-red-500/5' : 'border-lumina-highlight hover:border-lumina-accent/50 hover:shadow-lumina-accent/5'}
                                    ${isDragging ? 'ring-2 ring-lumina-accent rotate-2 opacity-50' : ''}
                                `}
                            >
                                {/* Overdue Indicator */}
                                {overdue && (
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-lg z-10" title="Overdue"></div>
                                )}

                                {/* Drag Handle */}
                                <div className="absolute top-1/2 left-1.5 -translate-y-1/2 text-lumina-highlight opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical size={14} />
                                </div>

                                <div className="pl-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono text-lumina-muted bg-lumina-base px-1.5 py-0.5 rounded border border-lumina-highlight truncate max-w-[120px]">
                                            {task.package}
                                        </span>
                                        {task.status !== 'COMPLETED' && !isDragging && (
                                            <button 
                                                onClick={(e) => handleAdvance(e, task)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-lumina-accent hover:text-lumina-base text-lumina-muted transition-colors z-20"
                                                title="Quick Advance"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <h4 className="font-bold text-white mb-1 group-hover:text-lumina-accent transition-colors truncate">{task.clientName}</h4>
                                    
                                    <div className={`flex items-center text-xs mb-3 ${overdue ? 'text-red-400 font-bold' : 'text-lumina-muted'}`}>
                                        {overdue ? <AlertCircle size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                                        {overdue ? 'Overdue' : task.date}
                                    </div>

                                    {/* Task Progress Bar */}
                                    {totalTasks > 0 && (
                                        <div className="mb-3">
                                            <div className="flex justify-between text-[9px] text-lumina-muted mb-0.5">
                                                <span className="flex items-center gap-1"><CheckSquare size={8} /> Tasks</span>
                                                <span>{completedTasks}/{totalTasks}</span>
                                            </div>
                                            <div className="h-1 w-full bg-lumina-base rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-lumina-accent transition-all duration-300"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-lumina-highlight/50">
                                        <div className="flex -space-x-2">
                                            <img src={`https://ui-avatars.com/api/?name=${task.photographerId}&background=random`} className="w-6 h-6 rounded-full border-2 border-lumina-surface" title="Photographer" />
                                            {task.editorId && (
                                                <img src={`https://ui-avatars.com/api/?name=${task.editorId}&background=random`} className="w-6 h-6 rounded-full border-2 border-lumina-surface" title="Editor" />
                                            )}
                                        </div>
                                        {task.status === 'COMPLETED' ? (
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        ) : (
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${task.status === 'INQUIRY' ? 'bg-gray-400' : 'bg-lumina-accent'}`}></div>
                                        )}
                                    </div>
                                </div>
                            </Motion.div>
                        );
                    })}
                  </AnimatePresence>
                  
                  {tasks.length === 0 && (
                     <div className={`h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors
                         ${isTarget ? 'border-lumina-accent bg-lumina-accent/10 scale-95' : 'border-lumina-highlight/30 text-lumina-muted/30'}`}>
                         <p className="text-xs font-bold uppercase tracking-widest opacity-50 animate-pulse">
                             {isTarget ? 'Drop Here' : 'Empty Stage'}
                         </p>
                     </div>
                  )}
                  <div className="h-20 w-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductionView;
