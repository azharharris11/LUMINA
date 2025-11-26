
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Image as ImageIcon, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { User, Booking, Transaction, StudioConfig } from '../types';

const Motion = motion as any;

interface DashboardProps {
  user: User;
  bookings: Booking[];
  transactions?: Transaction[];
  onSelectBooking: (bookingId: string) => void; 
  selectedDate: string; 
  onNavigate: (view: string) => void;
  config?: StudioConfig;
}

const DashboardView: React.FC<DashboardProps> = ({ user, bookings, transactions = [], onSelectBooking, selectedDate, onNavigate, config }) => {
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
  // LOGIC FIX: Check against Grand Total (inc. Tax)
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
          onClick: () => onSelectBooking(b.id)
      })),
      ...approvalNeeded.map(b => ({
          id: b.id,
          title: 'Review Needed',
          subtitle: `${b.clientName} waiting for approval`,
          type: 'normal',
          onClick: () => onSelectBooking(b.id)
      })),
       ...pendingEdits.slice(0, 2).map(b => ({
          id: b.id,
          title: 'Production Queue',
          subtitle: `${b.clientName} is in ${b.status.toLowerCase()}`,
          type: 'normal',
          onClick: () => onSelectBooking(b.id)
      }))
  ].slice(0, 5); // Limit to 5 items

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center">
        <div>
          <h1 className="text-4xl font-display font-bold text-lumina-text mb-2">
            Good Afternoon, <span className="text-lumina-accent">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-lumina-muted">Schedule for <span className="text-lumina-text font-bold">{formattedDate}</span></p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-2 bg-lumina-highlight/50 rounded-full border border-lumina-highlight flex items-center">
          <span className="w-2 h-2 rounded-full bg-lumina-accent animate-pulse mr-2"></span>
          <span className="text-sm font-mono text-lumina-accent">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Sessions Today" 
          value={todayBookings.length.toString()} 
          icon={Users} 
          trend={todayBookings.length > 0 ? "+1" : "0"} 
        />
        <StatCard 
          title="Cash Collected (Mo)" 
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
        <Motion.div variants={itemVariants} className="lg:col-span-2 bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lumina-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-lumina-accent/10"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-xl text-lumina-text">Schedule for {selectedDate}</h2>
            <button 
              onClick={() => onNavigate('calendar')}
              className="text-xs font-mono text-lumina-accent border border-lumina-accent/30 px-3 py-1 rounded hover:bg-lumina-accent hover:text-lumina-base transition-colors"
            >
              VIEW CALENDAR
            </button>
          </div>

          <div className="space-y-4">
            {todayBookings.length === 0 ? (
              <p className="text-lumina-muted py-8 text-center italic">No sessions scheduled for this date.</p>
            ) : (
              todayBookings.map((booking) => (
                <div key={booking.id} onClick={() => onSelectBooking(booking.id)} className="flex items-center p-4 bg-lumina-base/50 rounded-xl border border-lumina-highlight/50 hover:border-lumina-accent/50 transition-colors cursor-pointer">
                  <div className="w-16 flex flex-col items-center justify-center border-r border-lumina-highlight pr-4 mr-4">
                    <span className="font-display font-bold text-lg text-lumina-text">{booking.timeStart}</span>
                    <span className="text-xs text-lumina-muted font-mono">{booking.duration}h</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lumina-text">{booking.clientName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-lumina-muted bg-lumina-highlight px-2 py-0.5 rounded">{booking.package}</span>
                      <span className="text-xs text-lumina-accent bg-lumina-accent/10 px-2 py-0.5 rounded border border-lumina-accent/20">{booking.studio}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${booking.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-lumina-highlight text-lumina-muted'}`}>
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
                 onClick={item.onClick}
                 className={`p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all shadow-sm
                    ${item.type === 'urgent' ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' : 'bg-lumina-surface border-lumina-highlight hover:border-lumina-accent/50'}
                 `}
               >
                  <div className="flex justify-between items-start">
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
  <div className={`p-6 rounded-2xl border transition-all shadow-sm ${highlight ? 'bg-gradient-to-br from-lumina-highlight to-lumina-surface border-lumina-accent/50 shadow-lg shadow-lumina-accent/5' : 'bg-lumina-surface border-lumina-highlight'}`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-bold text-lumina-muted uppercase tracking-wider">{title}</p>
        <h3 className={`text-2xl font-display font-bold mt-1 ${highlight ? 'text-lumina-accent' : 'text-lumina-text'}`}>{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${highlight ? 'bg-lumina-accent/20 text-lumina-accent' : 'bg-lumina-base text-lumina-muted'}`}>
        <Icon size={20} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trendDown ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {trend}
        </span>
      </div>
    )}
  </div>
);

export default DashboardView;
