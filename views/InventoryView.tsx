
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, AssetCategory, AssetStatus, InventoryViewProps } from '../types';
import { Box, Wrench, CheckCircle2, AlertTriangle, Search, Plus, X, MoreVertical, Trash, Calendar, User as UserIcon, LogOut, LogIn, FileText } from 'lucide-react';

const Motion = motion as any;

const InventoryView: React.FC<InventoryViewProps> = ({ assets, users, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action Modal State (Check Out / Maintenance)
  const [actionAsset, setActionAsset] = useState<Asset | null>(null);
  const [actionType, setActionType] = useState<'CHECK_OUT' | 'MAINTENANCE' | null>(null);
  const [actionForm, setActionForm] = useState({ userId: '', returnDate: '', notes: '' });

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
      status: 'AVAILABLE',
      category: 'CAMERA',
      serialNumber: '' // Ensure fallback
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const categories: {id: AssetCategory | 'ALL', label: string}[] = [
      { id: 'ALL', label: 'All Items' },
      { id: 'CAMERA', label: 'Cameras' },
      { id: 'LENS', label: 'Lenses' },
      { id: 'LIGHTING', label: 'Lighting' },
      { id: 'PROP', label: 'Props' },
      { id: 'BACKGROUND', label: 'Backdrops' },
  ];

  const handleSave = () => {
      if (onAddAsset && newAsset.name) {
          onAddAsset({
              id: `a-${Date.now()}`,
              name: newAsset.name!,
              category: newAsset.category as AssetCategory,
              status: (newAsset.status || 'AVAILABLE') as AssetStatus,
              serialNumber: newAsset.serialNumber || '',
          });
          setIsAddModalOpen(false);
          setNewAsset({ status: 'AVAILABLE', category: 'CAMERA', serialNumber: '' });
      }
  };

  const openActionModal = (asset: Asset, type: 'CHECK_OUT' | 'MAINTENANCE') => {
      setActionAsset(asset);
      setActionType(type);
      setActiveMenu(null);
      // Reset form
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setActionForm({ userId: users[0]?.id || '', returnDate: tomorrow.toISOString().split('T')[0], notes: '' });
  };

  const handleActionSubmit = () => {
      if (onUpdateAsset && actionAsset) {
          let updatedAsset = { ...actionAsset };
          
          if (actionType === 'CHECK_OUT') {
              updatedAsset.status = 'IN_USE';
              updatedAsset.assignedToUserId = actionForm.userId;
              updatedAsset.returnDate = actionForm.returnDate;
          } else if (actionType === 'MAINTENANCE') {
              updatedAsset.status = 'MAINTENANCE'; // Or BROKEN
              updatedAsset.notes = actionForm.notes;
          }

          onUpdateAsset(updatedAsset);
          setActionAsset(null);
          setActionType(null);
      }
  };

  const handleReturn = (asset: Asset) => {
       if (onUpdateAsset) {
           onUpdateAsset({
               ...asset,
               status: 'AVAILABLE',
               assignedToUserId: undefined,
               returnDate: undefined,
               notes: undefined
           });
           setActiveMenu(null);
       }
  };

  const handleDelete = (e: React.MouseEvent, asset: Asset) => {
      e.stopPropagation();
      // Do not close menu yet to maintain context if possible, 
      // though window.confirm pauses everything.
      
      // 1. Immediate Confirmation
      if (!window.confirm(`Permanently delete '${asset.name}'?`)) {
          setActiveMenu(null); // Close menu if cancelled
          return;
      }

      try {
          // 2. Safe Status Check
          if (asset && asset.status === 'IN_USE') {
              alert(`Cannot delete '${asset.name}' because it is marked as IN USE.\n\nPlease return the item first.`);
              setActiveMenu(null);
              return;
          }

          // 3. Execute
          if (onDeleteAsset) {
              onDeleteAsset(asset.id);
          }
          setActiveMenu(null); // Close menu after success
      } catch (err: any) {
          console.error("Asset Delete Error:", err);
          alert("System error. Deletion prevented.");
      }
  };

  const filteredAssets = assets.filter(a => {
      const matchesCategory = activeCategory === 'ALL' || a.category === activeCategory;
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || (a.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: Asset['status']) => {
    // Safe fallback in case status is somehow undefined in DB
    const s = status || 'AVAILABLE';
    switch (s) {
      case 'AVAILABLE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'IN_USE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'MAINTENANCE': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'BROKEN': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: Asset['status']) => {
    const s = status || 'AVAILABLE';
    switch (s) {
      case 'AVAILABLE': return CheckCircle2;
      case 'IN_USE': return LogOut;
      case 'MAINTENANCE': return Wrench;
      case 'BROKEN': return AlertTriangle;
      default: return Box;
    }
  };

  const getUserName = (id?: string) => {
    if (!id) return null;
    return users.find(u => u.id === id)?.name;
  };

  return (
    <div className="space-y-8 h-full flex flex-col" onClick={() => setActiveMenu(null)}>
      <div className="flex flex-col md:flex-row justify-between items-end shrink-0">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Inventory Management</h1>
          <p className="text-lumina-muted">Track equipment location, status, and maintenance schedules.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4 group-focus-within:text-lumina-accent transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search serial or name..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-lumina-surface border border-lumina-highlight rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-lumina-accent w-64 transition-all"
                />
            </div>
            <button 
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-lumina-accent text-lumina-base px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-lumina-accent/90 transition-colors shadow-lg shadow-lumina-accent/10"
            >
                <Plus size={18} /> Add Item
            </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-lumina-highlight shrink-0 overflow-x-auto">
          {categories.map(cat => (
              <button
                 key={cat.id}
                 type="button"
                 onClick={() => setActiveCategory(cat.id)}
                 className={`px-6 py-3 font-bold text-sm transition-colors relative whitespace-nowrap ${activeCategory === cat.id ? 'text-white' : 'text-lumina-muted hover:text-white'}`}
              >
                  {cat.label}
                  {activeCategory === cat.id && <Motion.div layoutId="invTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-lumina-accent" />}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {filteredAssets.map((asset, index) => {
            const StatusIcon = getStatusIcon(asset.status);
            const assignedUser = getUserName(asset.assignedToUserId);

            return (
                <Motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-5 hover:border-lumina-accent/50 transition-all group relative flex flex-col"
                >
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg border ${getStatusColor(asset.status)}`}>
                    <StatusIcon size={18} />
                    </div>
                    <div className="relative">
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === asset.id ? null : asset.id); }}
                                className="p-1 text-lumina-muted hover:text-white rounded hover:bg-lumina-highlight"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {activeMenu === asset.id && (
                                <div 
                                    className="absolute right-0 top-full mt-1 w-48 bg-lumina-surface border border-lumina-highlight rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
                                    onClick={(e) => e.stopPropagation()} 
                                >
                                    {asset.status === 'AVAILABLE' && (
                                        <button type="button" onClick={() => openActionModal(asset, 'CHECK_OUT')} className="px-3 py-2 text-left text-xs hover:bg-lumina-highlight text-blue-400 flex items-center gap-2 w-full">
                                            <LogOut size={12}/> Check Out
                                        </button>
                                    )}
                                    {asset.status === 'IN_USE' && (
                                        <button type="button" onClick={() => handleReturn(asset)} className="px-3 py-2 text-left text-xs hover:bg-lumina-highlight text-emerald-400 flex items-center gap-2 w-full">
                                            <LogIn size={12}/> Return Item
                                        </button>
                                    )}
                                    <button type="button" onClick={() => openActionModal(asset, 'MAINTENANCE')} className="px-3 py-2 text-left text-xs hover:bg-lumina-highlight text-amber-400 flex items-center gap-2 w-full">
                                        <Wrench size={12}/> Report Issue
                                    </button>
                                    <div className="border-t border-lumina-highlight my-1"></div>
                                    <button type="button" onClick={(e) => handleDelete(e, asset)} className="px-3 py-2 text-left text-xs hover:bg-rose-900/30 text-rose-500 flex items-center gap-2 w-full"><Trash size={12} className="pointer-events-none"/> Delete</button>
                                </div>
                            )}
                    </div>
                </div>

                <div className="flex-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-lumina-muted uppercase bg-lumina-base px-2 py-1 rounded border border-lumina-highlight mb-2 inline-block">
                        {asset.category}
                    </span>
                    <h3 className="text-white font-bold text-lg mb-1 group-hover:text-lumina-accent transition-colors">{asset.name}</h3>
                    <p className="text-xs text-lumina-muted font-mono">SN: {asset.serialNumber || 'N/A'}</p>
                </div>

                <div className="border-t border-lumina-highlight pt-3 mt-4 flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-lumina-muted tracking-wider mb-1">Status</span>
                        <span className={`text-xs font-bold ${asset.status === 'AVAILABLE' ? 'text-emerald-400' : asset.status === 'IN_USE' ? 'text-blue-400' : 'text-rose-400'}`}>
                            {(asset.status || 'AVAILABLE').replace('_', ' ')}
                        </span>
                    </div>
                    {assignedUser ? (
                        <div className="text-right">
                            <span className="text-[10px] uppercase text-lumina-muted tracking-wider mb-1">Holder</span>
                            <div className="flex items-center justify-end gap-1">
                                <span className="text-xs font-bold text-white">{assignedUser.split(' ')[0]}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-lumina-accent animate-pulse"></div>
                            </div>
                        </div>
                    ) : asset.status === 'MAINTENANCE' && asset.notes ? (
                         <div className="text-right max-w-[50%]">
                             <span className="text-[10px] uppercase text-lumina-muted tracking-wider mb-1">Note</span>
                             <p className="text-xs text-white truncate">{asset.notes}</p>
                         </div>
                    ) : null}
                </div>
                </Motion.div>
            );
            })}
        </div>
      </div>

      {/* Add Asset Modal */}
      <AnimatePresence>
          {isAddModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 <div onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                 <Motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl"
                 >
                     <div className="flex justify-between items-center mb-6">
                         <h2 className="text-xl font-bold text-white">Add New Item</h2>
                         <button type="button" onClick={() => setIsAddModalOpen(false)}><X className="text-lumina-muted hover:text-white" /></button>
                     </div>
                     <div className="space-y-4">
                         <div>
                             <label className="text-xs uppercase text-lumina-muted font-bold block mb-1">Asset Name</label>
                             <input className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" 
                                value={newAsset.name || ''} onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                             />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs uppercase text-lumina-muted font-bold block mb-1">Category</label>
                                <select className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                    value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value as any})}
                                >
                                    {categories.filter(c => c.id !== 'ALL').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="text-xs uppercase text-lumina-muted font-bold block mb-1">Status</label>
                                <select className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                    value={newAsset.status} onChange={e => setNewAsset({...newAsset, status: e.target.value as any})}
                                >
                                    <option value="AVAILABLE">Available</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                </select>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs uppercase text-lumina-muted font-bold block mb-1">Serial Number</label>
                             <input className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none" 
                                value={newAsset.serialNumber || ''} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})}
                             />
                         </div>
                         <button type="button" onClick={handleSave} className="w-full py-3 bg-lumina-accent text-lumina-base font-bold rounded-xl hover:bg-lumina-accent/90 transition-colors mt-4">
                             Add to Inventory
                         </button>
                     </div>
                 </Motion.div>
             </div>
          )}
      </AnimatePresence>

      {/* Action Modal (Check Out / Maintenance) */}
      <AnimatePresence>
          {actionAsset && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 <div onClick={() => { setActionAsset(null); setActionType(null); }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                 <Motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl"
                 >
                     <h2 className="text-xl font-bold text-white mb-2">
                         {actionType === 'CHECK_OUT' ? 'Check Out Equipment' : 'Report Issue / Maintenance'}
                     </h2>
                     <p className="text-sm text-lumina-muted mb-6">Updating status for <span className="text-white font-bold">{actionAsset.name}</span></p>

                     <div className="space-y-4">
                         {actionType === 'CHECK_OUT' && (
                             <>
                                <div>
                                    <label className="text-xs uppercase text-lumina-muted font-bold block mb-1"><UserIcon size={12} className="inline mr-1"/> Assign To</label>
                                    <select className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                        value={actionForm.userId} onChange={e => setActionForm({...actionForm, userId: e.target.value})}
                                    >
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase text-lumina-muted font-bold block mb-1"><Calendar size={12} className="inline mr-1"/> Expected Return</label>
                                    <input type="date" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none"
                                        value={actionForm.returnDate} onChange={e => setActionForm({...actionForm, returnDate: e.target.value})}
                                    />
                                </div>
                             </>
                         )}

                         {actionType === 'MAINTENANCE' && (
                             <div>
                                 <label className="text-xs uppercase text-lumina-muted font-bold block mb-1"><FileText size={12} className="inline mr-1"/> Issue Details</label>
                                 <textarea className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white focus:border-lumina-accent outline-none min-h-[100px]"
                                     placeholder="Describe the damage or maintenance reason..."
                                     value={actionForm.notes} onChange={e => setActionForm({...actionForm, notes: e.target.value})}
                                 />
                             </div>
                         )}

                         <div className="grid grid-cols-2 gap-3 mt-6">
                            <button type="button" onClick={() => { setActionAsset(null); setActionType(null); }} className="py-3 text-lumina-muted font-bold hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button type="button" onClick={handleActionSubmit} className={`py-3 rounded-xl font-bold text-white transition-colors shadow-lg
                                ${actionType === 'CHECK_OUT' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}>
                                Confirm Update
                            </button>
                         </div>
                     </div>
                 </Motion.div>
             </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryView;
