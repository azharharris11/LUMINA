
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Booking, Role, TeamViewProps, PackageCostItem } from '../types';
import { Mail, Phone, Calendar, Briefcase, Award, Circle, Plus, X, Trash2, Edit2, AlertCircle, DollarSign, TrendingUp, Coins, CalendarDays, Ban } from 'lucide-react';

const Motion = motion as any;

const TeamView: React.FC<TeamViewProps> = ({ users, bookings, onAddUser, onUpdateUser, onDeleteUser, onRecordExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewScheduleUser, setViewScheduleUser] = useState<User | null>(null);
  
  // Availability Modal
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedStaffForAvailability, setSelectedStaffForAvailability] = useState<User | null>(null);
  const [blockDate, setBlockDate] = useState('');

  const [userForm, setUserForm] = useState<Partial<User>>({
      name: '', email: '', phone: '', role: 'PHOTOGRAPHER', status: 'ACTIVE', specialization: ''
  });

  const getCompletedJobs = (userId: string) => {
    return bookings.filter(b => (b.photographerId === userId || b.editorId === userId) && b.status === 'COMPLETED').length;
  };

  const getActiveJobs = (userId: string) => {
    return bookings.filter(b => (b.photographerId === userId || b.editorId === userId) && b.status !== 'COMPLETED').length;
  };

  const getUserSchedule = (userId: string) => {
      return bookings.filter(b => (b.photographerId === userId || b.editorId === userId) && b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  }

  // Calculate Net Sales Generated (Profit Sharing Model)
  const getRevenueGenerated = (user: User) => {
      const completedBookings = bookings.filter(b => 
          (b.photographerId === user.id || b.editorId === user.id) && 
          b.status === 'COMPLETED'
      );
      
      return completedBookings.reduce((acc, b) => {
          // 1. Get Gross
          const gross = b.price;
          
          // 2. Deduct Discounts
          let discountAmount = 0;
          if (b.discount) {
              discountAmount = b.discount.type === 'PERCENT' 
                  ? gross * (b.discount.value / 100) 
                  : b.discount.value;
          }

          // 3. Deduct COGS (Cost of Goods Sold) from Snapshot
          const cogs = (b.costSnapshot || []).reduce((sum: number, cost: PackageCostItem) => sum + cost.amount, 0);
          
          // 4. Deduct Custom Item Costs
          const itemCosts = (b.items || []).reduce((sum: number, item) => sum + (item.cost || 0), 0);

          const netSales = Math.max(0, gross - discountAmount - cogs - itemCosts);
          return acc + netSales;
      }, 0);
  };
  
  // Calculate Unpaid Commissions based on Net Sales
  const getEstimatedCommission = (user: User) => {
      if (!user.commissionRate || user.commissionRate <= 0) return 0;
      
      const netRevenue = getRevenueGenerated(user);
      return netRevenue * (user.commissionRate / 100);
  };

  const handlePayout = (user: User) => {
      const amount = getEstimatedCommission(user);
      if (amount <= 0) {
          alert("No estimated commission to pay out.");
          return;
      }

      if (window.confirm(`Process payout of Rp ${amount.toLocaleString()} for ${user.name}?\n\nThis will record an expense in Finance.`)) {
          if (onRecordExpense) {
              onRecordExpense({
                  description: `Commission Payout - ${user.name}`,
                  amount: amount,
                  category: 'Staff Salaries',
                  accountId: 'acc1', // Default to main account, needs proper selection ideally
                  submittedBy: 'admin'
              });
              alert("Payout recorded as an expense.");
          }
      }
  };

  const openAddModal = () => {
      setEditMode(false);
      setUserForm({ name: '', email: '', phone: '', role: 'PHOTOGRAPHER', status: 'ACTIVE', specialization: '' });
      setIsModalOpen(true);
  }

  const openEditModal = (user: User) => {
      setEditMode(true);
      setUserForm(user);
      setIsModalOpen(true);
  }

  const openAvailabilityModal = (user: User) => {
      setSelectedStaffForAvailability(user);
      setIsAvailabilityModalOpen(true);
      setBlockDate('');
  }

  const handleBlockDate = () => {
      if (selectedStaffForAvailability && blockDate && onUpdateUser) {
          const currentDates = selectedStaffForAvailability.unavailableDates || [];
          if (!currentDates.includes(blockDate)) {
              const updatedUser = {
                  ...selectedStaffForAvailability,
                  unavailableDates: [...currentDates, blockDate].sort()
              };
              onUpdateUser(updatedUser);
              setSelectedStaffForAvailability(updatedUser);
              setBlockDate('');
          }
      }
  }

  const handleUnblockDate = (dateToRemove: string) => {
      if (selectedStaffForAvailability && onUpdateUser) {
          const updatedUser = {
              ...selectedStaffForAvailability,
              unavailableDates: (selectedStaffForAvailability.unavailableDates || []).filter(d => d !== dateToRemove)
          };
          onUpdateUser(updatedUser);
          setSelectedStaffForAvailability(updatedUser);
      }
  }

  const handleSave = () => {
      if (editMode && onUpdateUser && userForm.id) {
          onUpdateUser(userForm as User);
      } else if (onAddUser && userForm.name) {
          onAddUser({
              id: `u-${Date.now()}`,
              name: userForm.name,
              role: userForm.role as Role,
              email: userForm.email || 'user@lumina.id',
              phone: userForm.phone || '08...',
              avatar: `https://ui-avatars.com/api/?name=${userForm.name}&background=random`,
              status: 'ACTIVE',
              specialization: userForm.specialization,
              commissionRate: userForm.commissionRate || 10,
              joinedDate: new Date().toISOString().split('T')[0],
              unavailableDates: []
          });
      }
      setIsModalOpen(false);
  };

  const handleDelete = (user: User) => {
      // INTEGRITY CHECK: Check for future/active bookings
      const hasActiveBookings = bookings.some(b => 
          (b.photographerId === user.id || b.editorId === user.id) && 
          b.status !== 'COMPLETED' && 
          b.status !== 'CANCELLED'
      );

      if (hasActiveBookings) {
          alert(`CANNOT DELETE STAFF '${user.name}'.\n\nReason: This user has active or future bookings assigned.\n\nSolution: Reassign their bookings to another staff member first, or mark the bookings as Completed/Cancelled.`);
          return;
      }

      if (onDeleteUser && window.confirm(`Are you sure you want to remove ${user.name}? This action cannot be undone.`)) {
          onDeleteUser(user.id);
      }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Team Management</h1>
          <p className="text-lumina-muted">Manage staff profiles, contact info, and operational status.</p>
        </div>
        <div className="flex gap-4">
            <div className="px-4 py-2 bg-lumina-surface border border-lumina-highlight rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-bold text-white">{users.filter(u => u.status === 'ACTIVE').length} Active</span>
            </div>
            <button onClick={openAddModal} className="bg-lumina-accent text-lumina-base px-4 py-2 rounded-lg font-bold hover:bg-lumina-accent/90 transition-colors flex items-center gap-2">
                <Plus size={18} /> Add Staff
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((user, index) => (
            <Motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-lumina-surface border border-lumina-highlight rounded-2xl overflow-hidden group hover:border-lumina-accent/30 transition-all relative"
            >
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button onClick={() => openEditModal(user)} className="p-1.5 bg-lumina-base rounded text-lumina-muted hover:text-white border border-lumina-highlight hover:border-white">
                        <Edit2 size={14} />
                    </button>
                    {user.role !== 'OWNER' && (
                        <button onClick={() => handleDelete(user)} className="p-1.5 bg-lumina-base rounded text-lumina-muted hover:text-rose-400 border border-lumina-highlight hover:border-rose-400">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {/* Header Card */}
                <div className="p-6 relative">
                    <div className="mb-4">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase border tracking-wider
                            ${user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            user.status === 'ON_LEAVE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                            {(user.status || 'ACTIVE').replace('_', ' ')}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <img src={user.avatar} className="w-16 h-16 rounded-full border-2 border-lumina-highlight group-hover:border-lumina-accent transition-colors" />
                        <div>
                            <h3 className="text-xl font-bold text-white">{user.name}</h3>
                            <p className="text-sm text-lumina-accent font-mono">{user.role}</p>
                        </div>
                    </div>

                    {user.specialization && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-lumina-base rounded-full border border-lumina-highlight mb-4">
                            <Award size={12} className="text-lumina-muted" />
                            <span className="text-xs text-white">{user.specialization}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-lumina-base/50 p-2 rounded-lg text-center border border-lumina-highlight/30">
                            <span className="block text-xl font-bold text-white">{getActiveJobs(user.id)}</span>
                            <span className="text-[10px] uppercase text-lumina-muted">Active Jobs</span>
                        </div>
                        <div className="bg-lumina-base/50 p-2 rounded-lg text-center border border-lumina-highlight/30">
                            <span className="block text-xl font-bold text-white">{getCompletedJobs(user.id)}</span>
                            <span className="text-[10px] uppercase text-lumina-muted">Completed</span>
                        </div>
                    </div>
                </div>

                {/* Revenue/Commission Insight */}
                {user.role !== 'OWNER' && (
                    <div className="px-6 py-3 bg-gradient-to-r from-lumina-highlight/20 to-transparent border-t border-lumina-highlight/50 space-y-2">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-xs text-lumina-muted">
                                 <TrendingUp size={12} className="text-emerald-400" />
                                 <span>Net Sales (Profit)</span>
                             </div>
                             <span className="text-sm font-mono font-bold text-emerald-400">
                                 Rp {getRevenueGenerated(user).toLocaleString('id-ID', { notation: "compact" })}
                             </span>
                         </div>
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-xs text-lumina-muted">
                                 <Coins size={12} className="text-amber-400" />
                                 <span>Est. Commission ({user.commissionRate}%)</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-sm font-mono font-bold text-amber-400">
                                     Rp {getEstimatedCommission(user).toLocaleString('id-ID', { notation: "compact" })}
                                 </span>
                                 <button 
                                    onClick={() => handlePayout(user)}
                                    className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500 hover:text-black transition-colors"
                                    title="Record Payout as Expense"
                                 >
                                     PAYOUT
                                 </button>
                             </div>
                         </div>
                    </div>
                )}

                {/* Info List */}
                <div className="px-6 py-4 bg-lumina-base/30 border-t border-lumina-highlight space-y-3">
                    <div className="flex items-center gap-3 text-sm text-lumina-muted hover:text-white transition-colors">
                        <Mail size={14} />
                        <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-lumina-muted hover:text-white transition-colors">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-lumina-muted">
                        <Calendar size={14} />
                        <span>Joined {new Date(user.joinedDate).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-lumina-base border-t border-lumina-highlight grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setViewScheduleUser(user)}
                        className="py-2 text-xs font-bold text-lumina-muted border border-lumina-highlight rounded-lg hover:bg-lumina-highlight hover:text-white transition-colors"
                    >
                        View Schedule
                    </button>
                    <button 
                        onClick={() => openAvailabilityModal(user)}
                        className="py-2 text-xs font-bold text-lumina-muted border border-lumina-highlight rounded-lg hover:bg-lumina-highlight hover:text-white transition-colors"
                    >
                        Manage Availability
                    </button>
                </div>
            </Motion.div>
        ))}
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
          {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <Motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />
                  <Motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl"
                  >
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-white">{editMode ? 'Edit Staff Profile' : 'Add New Staff'}</h2>
                          <button onClick={() => setIsModalOpen(false)}><X className="text-lumina-muted hover:text-white" /></button>
                      </div>
                      
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 font-bold">Full Name</label>
                              <input type="text" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                                value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs text-lumina-muted mb-1 font-bold">Role</label>
                                  <select className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                                     value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as Role})}
                                  >
                                      <option value="PHOTOGRAPHER">Photographer</option>
                                      <option value="EDITOR">Editor</option>
                                      <option value="ADMIN">Admin</option>
                                      <option value="FINANCE">Finance</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs text-lumina-muted mb-1 font-bold">Status</label>
                                  <select className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                                     value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value as any})}
                                  >
                                      <option value="ACTIVE">Active</option>
                                      <option value="ON_LEAVE">On Leave</option>
                                      <option value="INACTIVE">Inactive</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 font-bold">Specialization</label>
                              <input type="text" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                                 placeholder="e.g. Wedding" value={userForm.specialization} onChange={e => setUserForm({...userForm, specialization: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 font-bold">Email</label>
                              <input type="email" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                                 value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}
                              />
                          </div>
                           <div>
                              <label className="block text-xs text-lumina-muted mb-1 font-bold">Phone</label>
                              <input type="text" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                                 value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 font-bold">Commission Rate (%)</label>
                              <input type="number" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                                 value={userForm.commissionRate} onChange={e => setUserForm({...userForm, commissionRate: Number(e.target.value)})}
                              />
                          </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-2">
                          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-lumina-muted font-bold">Cancel</button>
                          <button onClick={handleSave} className="px-6 py-2 bg-lumina-accent text-lumina-base font-bold rounded-lg">{editMode ? 'Save Changes' : 'Add Member'}</button>
                      </div>
                  </Motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Schedule Drawer */}
      <AnimatePresence>
          {viewScheduleUser && (
              <>
                 <Motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setViewScheduleUser(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                 <Motion.div 
                    initial={{x: '100%'}} animate={{x:0}} exit={{x: '100%'}} 
                    className="fixed top-0 right-0 h-full w-96 bg-lumina-surface border-l border-lumina-highlight z-[110] p-6 shadow-2xl flex flex-col"
                 >
                     <div className="mb-6 flex justify-between items-start">
                         <div>
                             <h3 className="text-xl font-bold text-white">{viewScheduleUser.name}'s Schedule</h3>
                             <p className="text-sm text-lumina-muted">Upcoming assignments</p>
                         </div>
                         <button onClick={() => setViewScheduleUser(null)}><X className="text-lumina-muted hover:text-white"/></button>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                         {getUserSchedule(viewScheduleUser.id).length === 0 ? (
                             <p className="text-center text-lumina-muted py-10 italic">No active tasks assigned.</p>
                         ) : (
                             getUserSchedule(viewScheduleUser.id).map(booking => (
                                 <div key={booking.id} className="p-4 bg-lumina-base border border-lumina-highlight rounded-xl">
                                     <div className="flex justify-between text-xs text-lumina-muted mb-1">
                                         <span>{booking.date}</span>
                                         <span className="text-lumina-accent font-bold">{booking.timeStart}</span>
                                     </div>
                                     <h4 className="font-bold text-white">{booking.clientName}</h4>
                                     <p className="text-sm text-lumina-muted">{booking.package}</p>
                                     <div className="mt-2 inline-block px-2 py-0.5 bg-lumina-highlight rounded text-[10px] uppercase">{booking.status}</div>
                                 </div>
                             ))
                         )}
                     </div>
                 </Motion.div>
              </>
          )}
      </AnimatePresence>

      {/* Availability Manager Modal */}
      <AnimatePresence>
          {isAvailabilityModalOpen && selectedStaffForAvailability && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <Motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsAvailabilityModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                  <Motion.div 
                      initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}
                      className="relative bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl"
                  >
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h2 className="text-xl font-bold text-white">Availability Manager</h2>
                              <p className="text-sm text-lumina-muted">Manage off-days for {selectedStaffForAvailability.name.split(' ')[0]}</p>
                          </div>
                          <button onClick={() => setIsAvailabilityModalOpen(false)}><X className="text-lumina-muted hover:text-white"/></button>
                      </div>

                      <div className="space-y-4">
                           <div className="p-4 bg-lumina-base border border-lumina-highlight rounded-xl flex items-center gap-3">
                               <input 
                                  type="date" 
                                  className="bg-lumina-surface border border-lumina-highlight text-white p-2 rounded-lg text-sm flex-1 outline-none focus:border-lumina-accent"
                                  value={blockDate}
                                  onChange={e => setBlockDate(e.target.value)}
                               />
                               <button 
                                  onClick={handleBlockDate}
                                  disabled={!blockDate}
                                  className="px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                               >
                                   Block Date
                               </button>
                           </div>

                           <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                               <h4 className="text-xs font-bold text-lumina-muted uppercase">Blocked Dates (Off-Days)</h4>
                               {(selectedStaffForAvailability.unavailableDates || []).length === 0 && (
                                   <p className="text-sm text-lumina-muted italic">No dates blocked.</p>
                               )}
                               {(selectedStaffForAvailability.unavailableDates || []).map(date => (
                                   <div key={date} className="flex justify-between items-center p-3 bg-lumina-base border border-lumina-highlight rounded-lg">
                                       <span className="text-sm text-white font-mono">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                       <button onClick={() => handleUnblockDate(date)} className="text-lumina-muted hover:text-white">
                                           <Trash2 size={14} />
                                       </button>
                                   </div>
                               ))}
                           </div>
                      </div>
                  </Motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default TeamView;