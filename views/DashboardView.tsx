
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Image as ImageIcon, Clock, AlertCircle, ArrowRight, Camera, MessageCircle, CheckSquare } from 'lucide-react';
import { DashboardProps } from '../types';

const Motion = motion as any;

const DashboardView: React.FC<DashboardProps> = ({ user, bookings, transactions = [], onSelectBooking, selectedDate, onNavigate, config, onOpenWhatsApp }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const todayBookings = bookings.filter(b => b.date === selectedDate && b.status !== 'CANCELLED');
  
  // REAL REVENUE CALCULATION (CASH COLLECTED)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const revenueThisMonth = transactions
    .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'INCOME' && 
               t.status === 'COMPLETED' &&
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);
  
  // REAL OCCUPANCY CALCULATION
  const OPERATING_HOURS = 13; // 09:00 - 22:00
  const TOTAL_ROOMS = 3;
  const TOTAL_CAPACITY_HOURS = OPERATING_HOURS * TOTAL_ROOMS;
  
  const hoursBookedToday = todayBookings.reduce((acc, b) => acc + b.duration, 0);
  const utilizationRate = Math.round((hoursBookedToday / TOTAL_CAPACITY_HOURS) * 100);

  // Smart Action Items Logic
  const taxRate = config?.taxRate || 0;
  
  const unpaidBookings = bookings.filter(b => {
      if (b.status === 'CANCELLED') return false;
      const totalDue = b.price * (1 + taxRate/100);
      // Tolerance of 100 rupiah for float errors
      return (totalDue - b.paidAmount) > 100;
  });

  const pendingEdits = bookings.filter(b => ['CULLING', 'EDITING'].includes(b.status));
  const approvalNeeded = bookings.filter(b => b.status === 'REVIEW');
  
  const actionItems = [
      ...unpaidBookings.map(b => ({
          id: b.id,
          title: 'Payment Outstanding',
          subtitle: `Order #${b.id.substring(0,4)} - ${b.clientName}`,
          type: 'urgent',
          booking: b,
          onClick: () => onSelectBooking(b.id)
      })),
      ...approvalNeeded.map(b => ({
          id: b.id,
          title: 'Review Needed',
          subtitle: `${b.clientName} waiting for approval`,
          type: 'normal',
          booking: b,
          onClick: () => onSelectBooking(b.id)
      })),
       ...pendingEdits.slice(0, 2).map(b => ({
          id: b.id,
          title: 'Production Queue',
          subtitle: `${b.clientName} is in ${b.status.toLowerCase()}`,
          type: 'normal',
          booking: b,
          onClick: () => onSelectBooking(b.id)
      }))
  ].slice(0, 5); 

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // --- ON-SET MODE LOGIC (For Photographers) ---
  const activeShoot = todayBookings.find(b => 
      b.status === 'SHOOTING' && b.photographerId === user.id
  );

  return (
    <Motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 lg:space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-lumina-text mb-1 lg:mb-2">
            Good Afternoon, <span className="text-lumina-accent">{(user.name || '').split(' ')[0]}</span>
          </h1>
          <p className="text-lumina-muted text-sm lg:text-base">Schedule for <span className="text-lumina-text font-bold">{formattedDate}</span></p>
        </div>
        <div className="px-4 py-2 bg-lumina-highlight/50 rounded-full border border-lumina-highlight flex items-center self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-lumina-accent animate-pulse mr-2"></span>
          <span className="text-xs lg:text-sm font-mono text-lumina-accent">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* ON-SET MODE CARD (Photographers Only) */}
      {activeShoot && (
          <Motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 flex gap-2">
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">LIVE SESSION</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">On-Set Mode</h2>
              <p className="text-blue-200 text-sm mb-4">You are currently shooting for <span className="font-bold text-white">{activeShoot.clientName}</span>.</p>
              
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                  <button onClick={() => onSelectBooking(activeShoot.id)} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm">
                      <Camera size={18}/> View Session Details
                  </button>
                  <button onClick={() => onNavigate('inventory')} className="bg-lumina-surface border border-lumina-highlight text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-lumina-highlight transition-colors text-sm">
                      <CheckSquare size={18}/> Check Assets
                  </button>
              </div>
          </Motion.div>
      )}

      {/* Stats Grid - Scrollable on Mobile or Stacked */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard 
          title="Sessions Today" 
          value={todayBookings.length.toString()} 
          icon={Users} 
          trend={todayBookings.length > 0 ? "+1" : "0"} 
        />
        <StatCard 
          title="Cash Collected" 
          value={`Rp ${(revenueThisMonth / 1000000).toFixed(1)}M`} 
          icon={TrendingUp} 
          trend="Realized" 
          highlight
        />
        <StatCard 
          title="In Production" 
          value={pendingEdits.length.toString()} 
          icon={ImageIcon} 
          trend={pendingEdits.length > 5 ? "Busy" : "Normal"} 
          trendDown={pendingEdits.length > 5}
        />
        <StatCard 
          title="Studio Util." 
          value={`${utilizationRate}%`} 
          icon={Clock} 
          trend="Capacity" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule List */}
        <Motion.div variants={itemVariants} className="lg:col-span-2 bg-lumina-surface border border-lumina-highlight rounded-2xl p-4 lg:p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lumina-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-lumina-accent/10"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-lg lg:text-xl text-lumina-text">Schedule for {selectedDate}</h2>
            <button 
              onClick={() => onNavigate('calendar')}
              className="text-[10px] lg:text-xs font-mono text-lumina-accent border border-lumina-accent/30 px-3 py-1 rounded hover:bg-lumina-accent hover:text-lumina-base transition-colors"
            >
              VIEW CALENDAR
            </button>
          </div>

          <div className="space-y-3 lg:space-y-4">
            {todayBookings.length === 0 ? (
              <p className="text-lumina-muted py-8 text-center italic text-sm">No sessions scheduled for this date.</p>
            ) : (
              todayBookings.map((booking) => (
                <div key={booking.id} onClick={() => onSelectBooking(booking.id)} className="flex items-center p-3 lg:p-4 bg-lumina-base/50 rounded-xl border border-lumina-highlight/50 hover:border-lumina-accent/50 transition-colors cursor-pointer">
                  <div className="w-14 lg:w-16 flex flex-col items-center justify-center border-r border-lumina-highlight pr-3 lg:pr-4 mr-3 lg:mr-4">
                    <span className="font-display font-bold text-base lg:text-lg text-lumina-text">{booking.timeStart}</span>
                    <span className="text-[10px] lg:text-xs text-lumina-muted font-mono">{booking.duration}h</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lumina-text text-sm lg:text-base truncate">{booking.clientName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] lg:text-xs text-lumina-muted bg-lumina-highlight px-2 py-0.5 rounded truncate">{booking.package}</span>
                      <span className="text-[10px] lg:text-xs text-lumina-accent bg-lumina-accent/10 px-2 py-0.5 rounded border border-lumina-accent/20 truncate hidden sm:inline-block">{booking.studio}</span>
                    </div>
                  </div>
                  <div className={`px-2 lg:px-3 py-1 rounded text-[9px] lg:text-[10px] font-bold uppercase tracking-wider shrink-0 ${booking.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-lumina-highlight text-lumina-muted'}`}>
                    {booking.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </Motion.div>

        {/* Quick Actions */}
        <div className="space-y-4">
           <h3 className="font-bold text-lumina-text px-2">Action Items</h3>
           {actionItems.map(item => (
               <Motion.div 
                 variants={itemVariants}
                 key={item.id}
                 className={`p-4 rounded-xl border transition-all shadow-sm flex flex-col gap-3
                    ${item.type === 'urgent' ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' : 'bg-lumina-surface border-lumina-highlight hover:border-lumina-accent/50'}
                 `}
               >
                  <div className="flex justify-between items-start cursor-pointer" onClick={item.onClick}>
                      <div className="flex items-center gap-3">
                          {item.type === 'urgent' ? <AlertCircle className="text-rose-500 w-5 h-5"/> : <Clock className="text-lumina-muted w-5 h-5"/>}
                          <div>
                              <h4 className={`font-bold text-sm ${item.type === 'urgent' ? 'text-rose-400' : 'text-lumina-text'}`}>{item.title}</h4>
                              <p className="text-xs text-lumina-muted">{item.subtitle}</p>
                          </div>
                      </div>
                      <div className="bg-lumina-base p-1.5 rounded text-lumina-muted">
                          <ArrowRight size={14} />
                      </div>
                  </div>
                  
                  {/* Smart Action Buttons */}
                  {item.title === 'Payment Outstanding' && onOpenWhatsApp && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenWhatsApp(item.booking); }}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                          <MessageCircle size={14}/> Send Reminder (WA)
                      </button>
                  )}
               </Motion.div>
           ))}
           {actionItems.length === 0 && (
               <div className="p-8 text-center text-lumina-muted border border-dashed border-lumina-highlight rounded-xl">
                   <p className="text-sm">All caught up! No pending actions.</p>
               </div>
           )}
        </div>
      </div>
    </Motion.div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendDown, highlight }: any) => (
  <div className={`p-4 lg:p-6 rounded-2xl border transition-all shadow-sm ${highlight ? 'bg-gradient-to-br from-lumina-highlight to-lumina-surface border-lumina-accent/50 shadow-lg shadow-lumina-accent/5' : 'bg-lumina-surface border-lumina-highlight'}`}>
    <div className="flex justify-between items-start mb-3 lg:mb-4">
      <div>
        <p className="text-[10px] lg:text-xs font-bold text-lumina-muted uppercase tracking-wider">{title}</p>
        <h3 className={`text-xl lg:text-2xl font-display font-bold mt-1 ${highlight ? 'text-lumina-accent' : 'text-lumina-text'}`}>{value}</h3>
      </div>
      <div className={`p-1.5 lg:p-2 rounded-lg ${highlight ? 'bg-lumina-accent/20 text-lumina-accent' : 'bg-lumina-base text-lumina-muted'}`}>
        <Icon size={18} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-2">
        <span className={`text-[10px] lg:text-xs font-bold px-1.5 py-0.5 rounded ${trendDown ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {trend}
        </span>
      </div>
    )}
  </div>
);

export default DashboardView;
