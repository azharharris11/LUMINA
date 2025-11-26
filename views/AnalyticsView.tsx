
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Booking, Package, Transaction, User } from '../types';
import { TrendingUp, Clock, Target, CalendarCheck, DollarSign, TrendingDown, FileText, Printer, ArrowRight, Users, Briefcase, Percent } from 'lucide-react';

const Motion = motion as any;

interface AnalyticsViewProps {
  bookings: Booking[];
  packages: Package[];
  transactions?: Transaction[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ bookings, packages, transactions = [] }) => {
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SHAREHOLDER'>('DASHBOARD');
  const [timeRange, setTimeRange] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  const filteredData = useMemo(() => {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      if (timeRange === 'MONTH') {
          startDate.setMonth(now.getMonth());
          startDate.setDate(1); // 1st of this month
          endDate.setMonth(now.getMonth() + 1);
          endDate.setDate(0); // Last of this month
      }
      else if (timeRange === 'QUARTER') startDate.setMonth(now.getMonth() - 3);
      else if (timeRange === 'YEAR') startDate.setFullYear(now.getFullYear() - 1);

      // Filter logic
      const inRangeBookings = bookings.filter(b => {
          const d = new Date(b.date);
          return d >= startDate && d <= endDate;
      });

      const inRangeTransactions = transactions.filter(t => {
          const d = new Date(t.date);
          return d >= startDate && d <= endDate;
      });

      // FORECAST DATA (Next Month)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      
      const forecastBookings = bookings.filter(b => {
          const d = new Date(b.date);
          return d >= nextMonthStart && d <= nextMonthEnd && b.status !== 'CANCELLED';
      });

      return {
          bookings: inRangeBookings,
          transactions: inRangeTransactions,
          forecast: forecastBookings,
          startDate,
          endDate
      };
  }, [bookings, transactions, timeRange]);
  
  // -- REAL TIME CALCULATIONS --
  
  const bookingTrendsData = useMemo(() => {
      const data: any[] = [];
      const periodMap = new Map<string, number>();
      
      filteredData.bookings.forEach(b => {
          const date = new Date(b.date);
          const key = timeRange === 'MONTH' 
            ? `d${date.getDate()}` 
            : date.toLocaleString('default', { month: 'short' });
            
          periodMap.set(key, (periodMap.get(key) || 0) + b.price);
      });

      // Ensure data points
      if (periodMap.size === 0) {
           data.push({name: 'No Data', revenue: 0});
      } else {
           // Sort keys if month (days)
           const sortedKeys = Array.from(periodMap.keys()).sort((a,b) => {
               if (a.startsWith('d')) return parseInt(a.substring(1)) - parseInt(b.substring(1));
               return 0;
           });
           sortedKeys.forEach(key => data.push({ name: key, revenue: periodMap.get(key) }));
      }
      
      return data;
  }, [filteredData, timeRange]);

  const packageStats = useMemo(() => {
    return packages.map(pkg => {
        const count = filteredData.bookings.filter(b => b.package === pkg.name).length;
        return { name: pkg.name, value: count };
    }).filter(p => p.value > 0);
  }, [filteredData.bookings, packages]);

  const COLORS = ['#bef264', '#34d399', '#60a5fa', '#f43f5e', '#a78bfa'];

  // Studio Utilization (Hours)
  const studioUtil = useMemo(() => {
      const studios = ['STUDIO A', 'STUDIO B', 'OUTDOOR'];
      const studioHours = studios.map(s => {
          const hours = filteredData.bookings
            .filter(b => b.studio === s)
            .reduce((acc, b) => acc + b.duration, 0);
          return { name: s, hours };
      });
      const totalHours = studioHours.reduce((acc, s) => acc + s.hours, 0) || 1;
      return studioHours.map(s => ({
          name: s.name,
          value: Math.round((s.hours / totalHours) * 100),
          hours: s.hours
      }));
  }, [filteredData.bookings]);

  // --- P&L DETAILED CALCULATIONS ---
  const incomeTransactions = filteredData.transactions.filter(t => t.type === 'INCOME');
  const expenseTransactions = filteredData.transactions.filter(t => t.type === 'EXPENSE');

  const totalRevenue = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);

  // 1. COGS (Direct Costs linked to bookings + Material/Labor categories)
  const cogsTransactions = expenseTransactions.filter(t => 
      !!t.bookingId || 
      ['Consumables', 'Staff Salaries', 'Equipment Maint.'].includes(t.category)
  );
  const totalCOGS = cogsTransactions.reduce((acc, t) => acc + t.amount, 0);

  // 2. Gross Profit
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // 3. OPEX (Fixed Costs)
  const opexTransactions = expenseTransactions.filter(t => 
      !t.bookingId && 
      !['Consumables', 'Staff Salaries', 'Equipment Maint.'].includes(t.category)
  );
  const totalOPEX = opexTransactions.reduce((acc, t) => acc + t.amount, 0);

  // 4. Net Profit
  const netProfit = grossProfit - totalOPEX;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // --- UNIT ECONOMICS ---
  const totalBookingsCount = filteredData.bookings.length || 1;
  const averageOrderValue = totalRevenue / totalBookingsCount; // AOV
  
  const totalHoursBooked = filteredData.bookings.reduce((acc, b) => acc + b.duration, 0) || 1;
  const revenuePerHour = totalRevenue / totalHoursBooked;

  // --- FORECASTING ---
  const forecastRevenue = filteredData.forecast.reduce((acc, b) => acc + b.price, 0);
  const forecastCount = filteredData.forecast.length;

  // --- STAFF PERFORMANCE ---
  const staffPerformance = useMemo(() => {
      const staffMap = new Map<string, number>();
      filteredData.bookings.forEach(b => {
          staffMap.set(b.photographerId, (staffMap.get(b.photographerId) || 0) + b.price);
      });
      return Array.from(staffMap.entries()).map(([id, rev]) => ({
          id,
          revenue: rev
      })).sort((a,b) => b.revenue - a.revenue);
  }, [filteredData.bookings]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-lumina-surface border border-lumina-highlight p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold font-display mb-1">{label}</p>
          <p className="text-emerald-400 text-sm">
            {payload[0].name === 'revenue' ? `Rp ${payload[0].value.toLocaleString()}` : `${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-8 h-full flex flex-col"
    >
       {/* Header Controls */}
       <div className="flex flex-col md:flex-row justify-between items-end print:hidden">
          <div>
             <h1 className="text-4xl font-display font-bold text-white mb-2">
                 {viewMode === 'DASHBOARD' ? 'Analytics & Reports' : 'Shareholder Briefing'}
             </h1>
             <p className="text-lumina-muted">
                 {viewMode === 'DASHBOARD' ? 'Deep dive into studio performance metrics.' : `Financial Statement for ${filteredData.startDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
             </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
              <div className="bg-lumina-surface border border-lumina-highlight rounded-lg p-1 flex">
                  <button 
                    onClick={() => setViewMode('DASHBOARD')}
                    className={`px-4 py-2 text-xs font-bold rounded transition-all ${viewMode === 'DASHBOARD' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}
                  >
                      Dashboard
                  </button>
                  <button 
                    onClick={() => setViewMode('SHAREHOLDER')}
                    className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-2 transition-all ${viewMode === 'SHAREHOLDER' ? 'bg-lumina-accent text-lumina-base' : 'text-lumina-muted hover:text-white'}`}
                  >
                      <FileText size={14}/> Shareholder Report
                  </button>
              </div>
              
              <select 
                className="bg-lumina-surface border border-lumina-highlight text-white text-sm rounded-lg p-2 focus:border-lumina-accent outline-none cursor-pointer"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                  <option value="MONTH">This Month</option>
                  <option value="QUARTER">Last 3 Months</option>
                  <option value="YEAR">Year to Date</option>
              </select>

              {viewMode === 'SHAREHOLDER' && (
                  <button onClick={() => window.print()} className="p-2 bg-lumina-surface border border-lumina-highlight rounded-lg text-lumina-muted hover:text-white">
                      <Printer size={20} />
                  </button>
              )}
          </div>
       </div>

       {/* ==================== DASHBOARD MODE ==================== */}
       {viewMode === 'DASHBOARD' && (
           <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               {/* KPIs */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="p-6 bg-lumina-surface border border-lumina-highlight rounded-2xl">
                       <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-lumina-muted uppercase">Revenue</p>
                           <TrendingUp className="text-emerald-400 w-5 h-5" />
                       </div>
                       <p className="text-2xl font-bold text-white">Rp {(totalRevenue / 1000000).toFixed(1)}M</p>
                   </div>
                   <div className="p-6 bg-lumina-surface border border-lumina-highlight rounded-2xl">
                       <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-lumina-muted uppercase">Bookings</p>
                           <CalendarCheck className="text-blue-400 w-5 h-5" />
                       </div>
                       <p className="text-2xl font-bold text-white">{filteredData.bookings.length}</p>
                   </div>
                   <div className="p-6 bg-lumina-surface border border-lumina-highlight rounded-2xl">
                       <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-lumina-muted uppercase">Net Profit</p>
                           <DollarSign className={`w-5 h-5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                       </div>
                       <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Rp {(netProfit / 1000000).toFixed(1)}M</p>
                   </div>
                   <div className="p-6 bg-lumina-surface border border-lumina-highlight rounded-2xl">
                       <div className="flex justify-between items-start mb-2">
                           <p className="text-xs font-bold text-lumina-muted uppercase">Avg Session</p>
                           <Clock className="text-purple-400 w-5 h-5" />
                       </div>
                       <p className="text-2xl font-bold text-white">
                           {filteredData.bookings.length > 0 ? (filteredData.bookings.reduce((a,b)=>a+b.duration,0)/filteredData.bookings.length).toFixed(1) : 0}h
                       </p>
                   </div>
               </div>

               {/* Charts Row 1 */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 flex flex-col">
                       <h3 className="text-lg font-bold text-white mb-6">Revenue Trend</h3>
                       <div className="flex-1 w-full min-h-[250px]">
                           <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={bookingTrendsData}>
                                   <defs>
                                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#bef264" stopOpacity={0.3}/>
                                           <stop offset="95%" stopColor="#bef264" stopOpacity={0}/>
                                       </linearGradient>
                                   </defs>
                                   <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                                   <XAxis dataKey="name" stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} />
                                   <YAxis stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000000}m`} />
                                   <Tooltip content={<CustomTooltip />} cursor={{stroke: '#bef264', strokeWidth: 1}} />
                                   <Area type="monotone" dataKey="revenue" stroke="#bef264" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                               </AreaChart>
                           </ResponsiveContainer>
                       </div>
                   </div>

                   {/* Package Distribution */}
                   <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 flex flex-col">
                       <h3 className="text-lg font-bold text-white mb-4">Package Mix</h3>
                       <div className="flex-1 w-full min-h-[200px] relative">
                           <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                   <Pie
                                       data={packageStats}
                                       cx="50%"
                                       cy="50%"
                                       innerRadius={60}
                                       outerRadius={80}
                                       paddingAngle={5}
                                       dataKey="value"
                                   >
                                       {packageStats.map((entry, index) => (
                                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                       ))}
                                   </Pie>
                                   <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', borderRadius: '8px', color: '#fff' }} />
                                   <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(val) => <span className="text-xs text-lumina-muted ml-1">{val}</span>} />
                               </PieChart>
                           </ResponsiveContainer>
                       </div>
                   </div>
               </div>
           </Motion.div>
       )}

       {/* ==================== SHAREHOLDER REPORT MODE ==================== */}
       {viewMode === 'SHAREHOLDER' && (
           <Motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-20 print:pb-0 print:space-y-6">
               
               {/* 1. EXECUTIVE SUMMARY */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
                   <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl print:border-black print:bg-white">
                       <p className="text-xs font-bold text-emerald-300 uppercase mb-2 print:text-black">Net Margin</p>
                       <p className="text-3xl font-mono font-bold text-white print:text-black">{netMargin.toFixed(1)}%</p>
                       <p className="text-[10px] text-emerald-200/70 mt-1 print:text-black">Target: 30%</p>
                   </div>
                   <div className="bg-lumina-surface border border-lumina-highlight p-6 rounded-xl print:border-gray-300 print:bg-white">
                       <p className="text-xs font-bold text-lumina-muted uppercase mb-2">Avg Order Value</p>
                       <p className="text-2xl font-mono font-bold text-white print:text-black">Rp {(averageOrderValue/1000).toFixed(0)}k</p>
                       <p className="text-[10px] text-lumina-muted mt-1">Per Client Transaction</p>
                   </div>
                   <div className="bg-lumina-surface border border-lumina-highlight p-6 rounded-xl print:border-gray-300 print:bg-white">
                       <p className="text-xs font-bold text-lumina-muted uppercase mb-2">Revenue / Hour</p>
                       <p className="text-2xl font-mono font-bold text-white print:text-black">Rp {(revenuePerHour/1000).toFixed(0)}k</p>
                       <p className="text-[10px] text-lumina-muted mt-1">Studio Efficiency</p>
                   </div>
                   <div className="bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-xl print:border-black print:bg-white">
                       <p className="text-xs font-bold text-indigo-300 uppercase mb-2 print:text-black">Pipeline (Next Mo)</p>
                       <p className="text-2xl font-mono font-bold text-white print:text-black">Rp {(forecastRevenue/1000000).toFixed(1)}M</p>
                       <p className="text-[10px] text-indigo-200/70 mt-1 print:text-black">{forecastCount} Bookings confirmed</p>
                   </div>
               </div>

               {/* 2. STATEMENT OF PROFIT OR LOSS */}
               <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl overflow-hidden print:border-gray-300 print:bg-white">
                   <div className="p-6 border-b border-lumina-highlight bg-lumina-base/50 print:bg-gray-100 print:border-gray-300">
                       <h3 className="text-lg font-bold text-white font-display print:text-black">Statement of Profit or Loss</h3>
                       <p className="text-xs text-lumina-muted print:text-black">For the period ending {filteredData.endDate.toLocaleDateString()}</p>
                   </div>
                   <div className="p-0">
                       <table className="w-full text-sm">
                           <tbody className="divide-y divide-lumina-highlight/50 print:divide-gray-300">
                               {/* REVENUE */}
                               <tr className="bg-lumina-highlight/10 print:bg-white">
                                   <td className="px-6 py-3 font-bold text-white print:text-black">Total Revenue</td>
                                   <td className="px-6 py-3 font-bold font-mono text-emerald-400 text-right print:text-black">Rp {totalRevenue.toLocaleString()}</td>
                               </tr>
                               
                               {/* COGS */}
                               <tr className="group hover:bg-lumina-highlight/5">
                                   <td className="px-6 py-3 text-lumina-muted pl-10 print:text-black">Cost of Goods Sold (Direct Expense)</td>
                                   <td className="px-6 py-3 font-mono text-rose-300 text-right print:text-black">(Rp {totalCOGS.toLocaleString()})</td>
                               </tr>
                               
                               {/* GROSS PROFIT */}
                               <tr className="bg-lumina-highlight/20 border-t-2 border-lumina-highlight print:bg-gray-100">
                                   <td className="px-6 py-3 font-bold text-white uppercase tracking-wider print:text-black">Gross Profit</td>
                                   <td className="px-6 py-3 font-bold font-mono text-white text-right print:text-black">Rp {grossProfit.toLocaleString()}</td>
                               </tr>
                               
                               {/* OPEX Breakdown */}
                               <tr>
                                   <td colSpan={2} className="px-6 py-2 text-xs font-bold text-lumina-muted uppercase bg-lumina-base/30 mt-4 print:bg-white print:text-black">Operating Expenses</td>
                               </tr>
                               {['Marketing / Ads', 'Software Subscription', 'Office Rent', 'Utilities & Rent', 'Other'].map(cat => {
                                   const amt = opexTransactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
                                   if(amt === 0) return null;
                                   return (
                                       <tr key={cat} className="group hover:bg-lumina-highlight/5">
                                           <td className="px-6 py-2 text-lumina-muted pl-10 print:text-black">{cat}</td>
                                           <td className="px-6 py-2 font-mono text-lumina-muted text-right print:text-black">({amt.toLocaleString()})</td>
                                       </tr>
                                   )
                               })}
                               <tr className="bg-lumina-highlight/5">
                                   <td className="px-6 py-2 font-bold text-lumina-muted pl-10 print:text-black">Total OPEX</td>
                                   <td className="px-6 py-2 font-mono font-bold text-rose-400 text-right print:text-black">(Rp {totalOPEX.toLocaleString()})</td>
                               </tr>

                               {/* NET PROFIT */}
                               <tr className="bg-lumina-highlight/30 border-t-2 border-lumina-highlight text-lg print:bg-gray-200">
                                   <td className="px-6 py-4 font-bold text-white uppercase tracking-wider print:text-black">Net Income</td>
                                   <td className={`px-6 py-4 font-bold font-mono text-right print:text-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                       Rp {netProfit.toLocaleString()}
                                   </td>
                               </tr>
                           </tbody>
                       </table>
                   </div>
               </div>

               {/* 3. OPERATIONAL INSIGHTS ROW */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                   
                   {/* Staff Performance */}
                   <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 print:border-gray-300 print:bg-white">
                       <h3 className="font-bold text-white mb-4 flex items-center gap-2 print:text-black">
                           <Users size={18} className="text-blue-400"/> Top Revenue Generators
                       </h3>
                       <div className="space-y-4">
                           {staffPerformance.slice(0, 5).map((staff, index) => (
                               <div key={staff.id} className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <div className="w-6 h-6 rounded-full bg-lumina-highlight flex items-center justify-center text-xs font-bold text-white print:bg-gray-200 print:text-black">
                                           {index + 1}
                                       </div>
                                       <span className="text-sm text-white print:text-black">
                                           <img src={`https://ui-avatars.com/api/?name=${staff.id}&background=random`} className="w-5 h-5 rounded-full inline mr-2 align-middle"/>
                                           {staff.id}
                                       </span>
                                   </div>
                                   <div className="text-right">
                                       <p className="text-sm font-mono font-bold text-emerald-400 print:text-black">Rp {staff.revenue.toLocaleString()}</p>
                                       <div className="w-24 h-1.5 bg-lumina-highlight rounded-full mt-1 overflow-hidden print:bg-gray-200">
                                           <div className="h-full bg-emerald-500" style={{width: `${(staff.revenue / totalRevenue) * 100}%`}}></div>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* Studio Unit Economics */}
                   <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 print:border-gray-300 print:bg-white">
                       <h3 className="font-bold text-white mb-4 flex items-center gap-2 print:text-black">
                           <Briefcase size={18} className="text-amber-400"/> Room Efficiency
                       </h3>
                       <div className="space-y-4">
                           {studioUtil.map(studio => (
                               <div key={studio.name} className="p-3 rounded-lg border border-lumina-highlight bg-lumina-base/30 print:bg-white print:border-gray-200">
                                   <div className="flex justify-between items-center mb-2">
                                       <span className="font-bold text-sm text-white print:text-black">{studio.name}</span>
                                       <span className="text-xs text-lumina-muted print:text-black">{studio.hours} Hours Booked</span>
                                   </div>
                                   <div className="w-full bg-lumina-base h-2 rounded-full overflow-hidden print:bg-gray-200">
                                       <div 
                                          className={`h-full ${studio.value > 50 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                          style={{width: `${studio.value}%`}}
                                       ></div>
                                   </div>
                                   <p className="text-[10px] text-right mt-1 text-lumina-muted print:text-black">{studio.value}% Share of Load</p>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>

               {/* 4. PIPELINE ALERT */}
               <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-6 flex justify-between items-center print:border-black print:bg-white">
                   <div>
                       <h4 className="font-bold text-indigo-300 mb-1 print:text-black">Next Month Forecast</h4>
                       <p className="text-sm text-indigo-200/70 print:text-black">Based on confirmed bookings for next period.</p>
                   </div>
                   <div className="text-right">
                       <p className="text-2xl font-mono font-bold text-white print:text-black">Rp {forecastRevenue.toLocaleString()}</p>
                       <p className="text-xs text-indigo-300 print:text-black">{forecastCount} Sessions Scheduled</p>
                   </div>
               </div>

           </Motion.div>
       )}
    </Motion.div>
  );
};

export default AnalyticsView;
