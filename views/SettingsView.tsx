
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, StudioConfig, SettingsViewProps, StudioRoom, Booking, PackageCostItem, CostCategory, User } from '../types';
import { Settings as SettingsIcon, Tag, Plus, Edit2, ToggleLeft, ToggleRight, Building, Save, Download, RefreshCcw, Database, X, Layout, MessageSquare, Trash2, Clock, TrendingUp, DollarSign, Lock, User as UserIcon, Mail, Phone, Camera, AlertCircle } from 'lucide-react';

const Motion = motion as any;

// Update Props to include bookings for usage check
interface ExtendedSettingsViewProps extends SettingsViewProps {
    bookings?: Booking[];
}

const SettingsView: React.FC<ExtendedSettingsViewProps> = ({ packages, config, onAddPackage, onUpdatePackage, onDeletePackage, onUpdateConfig, bookings = [], currentUser, onUpdateUserProfile, onDeleteAccount }) => {
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [localConfig, setLocalConfig] = useState<StudioConfig>(config);
  
  // Profile State
  const [profileForm, setProfileForm] = useState<Partial<User>>({ name: '', phone: '', avatar: '', specialization: '' });

  // Sync local state with global config when it changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);
  
  useEffect(() => {
      if (currentUser) {
          setProfileForm({
              name: currentUser.name,
              phone: currentUser.phone,
              avatar: currentUser.avatar,
              specialization: currentUser.specialization || ''
          });
      }
  }, [currentUser]);
  
  // Add/Edit Package State
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<Package>>({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [] });
  const [featureInput, setFeatureInput] = useState('');
  
  // New Cost Item State
  const [newCostItem, setNewCostItem] = useState<Partial<PackageCostItem>>({ description: '', amount: 0, category: 'MATERIAL' });

  // Room State
  const [newRoom, setNewRoom] = useState<Partial<StudioRoom>>({ name: '', type: 'INDOOR', color: 'gray' });

  // Security Check
  const canManageCosts = currentUser?.role === 'OWNER' || currentUser?.role === 'FINANCE';

  const togglePackage = (pkg: Package) => {
    if(onUpdatePackage) {
        onUpdatePackage({ ...pkg, active: !pkg.active });
    }
  };

  const handleEditPackage = (pkg: Package) => {
      setNewPackage(pkg);
      setIsEditingPackage(true);
      setShowAddPackage(true);
  };
  
  const handleDeletePackage = (e: React.MouseEvent, pkg: Package) => {
      e.stopPropagation(); 
      e.preventDefault();
      
      // Use setTimeout to allow UI to update before blocking confirm
      setTimeout(() => {
          if (!window.confirm(`Are you sure you want to delete package '${pkg.name}'?`)) {
              return;
          }

          try {
              // Safe Integrity Check
              const validBookings = bookings || [];
              const isUsed = validBookings.some(b => (b?.package || '').toLowerCase() === (pkg.name || '').toLowerCase());
              
              if (isUsed) {
                  alert(`Cannot delete '${pkg.name}' because it is used in existing bookings.\n\nPlease mark it as INACTIVE instead to preserve history.`);
                  return;
              }

              // Execute
              if (onDeletePackage) {
                  onDeletePackage(pkg.id);
              }
          } catch (err: any) {
              console.error(err);
              alert(`System error during deletion: ${err.message}`);
          }
      }, 50);
  };

  const addFeature = () => {
      if (featureInput.trim()) {
          setNewPackage(prev => ({
              ...prev,
              features: [...(prev.features || []), featureInput.trim()]
          }));
          setFeatureInput('');
      }
  };

  const removeFeature = (index: number) => {
      setNewPackage(prev => ({
          ...prev,
          features: (prev.features || []).filter((_, i) => i !== index)
      }));
  };

  // --- COST BREAKDOWN LOGIC ---
  const addCostItem = () => {
      if (newCostItem.description && newCostItem.amount) {
          const item: PackageCostItem = {
              id: `cost-${Date.now()}`,
              description: newCostItem.description,
              amount: Number(newCostItem.amount),
              category: (newCostItem.category as CostCategory) || 'OTHER'
          };
          setNewPackage(prev => ({
              ...prev,
              costBreakdown: [...(prev.costBreakdown || []), item]
          }));
          setNewCostItem({ description: '', amount: 0, category: 'MATERIAL' });
      }
  };

  const removeCostItem = (id: string) => {
      setNewPackage(prev => ({
          ...prev,
          costBreakdown: (prev.costBreakdown || []).filter(item => item.id !== id)
      }));
  };

  const calculateTotalBaseCost = () => {
      return (newPackage.costBreakdown || []).reduce((acc, item) => acc + item.amount, 0);
  };

  const handleSavePackage = () => {
      if (isEditingPackage && onUpdatePackage && newPackage.id) {
          onUpdatePackage(newPackage as Package);
      } else if(onAddPackage && newPackage.name) {
          onAddPackage({
              id: `p-${Date.now()}`,
              name: newPackage.name,
              price: Number(newPackage.price),
              duration: Number(newPackage.duration),
              features: newPackage.features || [],
              active: true,
              costBreakdown: newPackage.costBreakdown || []
          });
      }
      // Reset
      setShowAddPackage(false);
      setIsEditingPackage(false);
      setNewPackage({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [] });
      setFeatureInput('');
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setLocalConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateChange = (key: keyof StudioConfig['templates'], value: string) => {
      setLocalConfig(prev => ({ ...prev, templates: { ...prev.templates, [key]: value } }));
  };

  const handleSaveConfig = () => {
      if (onUpdateConfig) {
          onUpdateConfig(localConfig);
      }
  };

  const handleAddRoom = () => {
      if (newRoom.name) {
          const room: StudioRoom = {
              id: `r-${Date.now()}`,
              name: newRoom.name,
              type: newRoom.type as any,
              color: newRoom.color || 'gray'
          };
          const updatedRooms = [...(localConfig.rooms || []), room];
          const updatedConfig = { ...localConfig, rooms: updatedRooms };
          setLocalConfig(updatedConfig);
          if (onUpdateConfig) onUpdateConfig(updatedConfig); // Auto Save
          setNewRoom({ name: '', type: 'INDOOR', color: 'gray' });
      }
  };

  const handleDeleteRoom = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      e.preventDefault();

      setTimeout(() => {
          // 1. Confirm First
          if (!window.confirm(`Delete studio room '${name}'? This will remove it from future booking options.`)) {
              return;
          }

          try {
              // 2. Safe Integrity Check
              const validBookings = bookings || [];
              const hasActiveBookings = validBookings.some(b => {
                  if (!b || !b.studio) return false;
                  return b.studio.toLowerCase() === name.toLowerCase() && 
                         b.status !== 'COMPLETED' && 
                         b.status !== 'CANCELLED';
              });
              
              if (hasActiveBookings) {
                  alert(`Cannot delete '${name}' because there are active bookings scheduled in this room.`);
                  return;
              }

              // 3. Execute
              const updatedRooms = (localConfig.rooms || []).filter(r => r.id !== id);
              const updatedConfig = { ...localConfig, rooms: updatedRooms };
              setLocalConfig(updatedConfig);
              
              if (onUpdateConfig) {
                  onUpdateConfig(updatedConfig); 
              }
          } catch (err: any) {
              console.error("Delete Room Error:", err);
              alert("Error checking bookings. See console.");
          }
      }, 50);
  };

  const handleExportData = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ config: localConfig, packages }, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "lumina_studio_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleReset = () => {
      if(window.confirm("Are you sure? This will reload the app and reset all temporary states.")) {
          window.location.reload();
      }
  };

  const handleSaveProfile = () => {
      if (onUpdateUserProfile && profileForm.name) {
          onUpdateUserProfile(profileForm as User);
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Settings</h1>
          <p className="text-lumina-muted">Configure studio services, pricing, and system preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-4 h-fit">
            <nav className="space-y-2">
                <button type="button" onClick={() => setActiveTab('GENERAL')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'GENERAL' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <Building className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Studio Info</span>
                </button>
                <button type="button" onClick={() => setActiveTab('PROFILE')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'PROFILE' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <UserIcon className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">My Profile</span>
                </button>
                <button type="button" onClick={() => setActiveTab('PACKAGES')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'PACKAGES' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <Tag className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Packages & Pricing</span>
                </button>
                <button type="button" onClick={() => setActiveTab('STUDIOS')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'STUDIOS' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <Layout className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Rooms & Locations</span>
                </button>
                 <button type="button" onClick={() => setActiveTab('TEMPLATES')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'TEMPLATES' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <MessageSquare className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Message Templates</span>
                </button>
                <button type="button" onClick={() => setActiveTab('SYSTEM')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'SYSTEM' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <SettingsIcon className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">System</span>
                </button>
            </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
            {activeTab === 'GENERAL' && (
                 <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                             <h2 className="text-xl font-bold text-white">Studio Information</h2>
                             <p className="text-lumina-muted text-sm mt-1">These details will appear on your digital invoices.</p>
                        </div>
                        <button type="button" onClick={handleSaveConfig} className="bg-lumina-base text-lumina-muted hover:text-white border border-lumina-highlight hover:border-lumina-accent px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                            <Save size={16} /> Save Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ... (Existing fields) ... */}
                        <div className="md:col-span-2">
                             <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Studio Name</label>
                             <input type="text" name="name" value={localConfig.name} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" />
                        </div>
                         <div className="md:col-span-2">
                             <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Logo URL</label>
                             <input type="text" name="logoUrl" value={localConfig.logoUrl || ''} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" placeholder="https://..." />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Address</label>
                             <input type="text" name="address" value={localConfig.address} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" />
                        </div>
                        <div>
                             <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Phone</label>
                             <input type="text" name="phone" value={localConfig.phone} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" />
                        </div>
                        <div>
                             <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Website</label>
                             <input type="text" name="website" value={localConfig.website} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" />
                        </div>
                    </div>
                 </Motion.div>
            )}

            {activeTab === 'PROFILE' && (
                <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                             <h2 className="text-xl font-bold text-white">Your Profile</h2>
                             <p className="text-lumina-muted text-sm mt-1">Manage your personal information.</p>
                        </div>
                        <button type="button" onClick={handleSaveProfile} className="bg-lumina-base text-lumina-muted hover:text-white border border-lumina-highlight hover:border-lumina-accent px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                            <Save size={16} /> Update Profile
                        </button>
                    </div>
                    {/* ... */}
                    <div className="mt-12 pt-8 border-t border-lumina-highlight">
                        <h3 className="text-sm font-bold text-rose-400 uppercase mb-4 flex items-center gap-2">
                            <AlertCircle size={16}/> Danger Zone
                        </h3>
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white text-sm">Delete Account</p>
                                <p className="text-xs text-lumina-muted">Permanently delete your account and remove all access.</p>
                            </div>
                            <button 
                                onClick={onDeleteAccount}
                                className="px-4 py-2 bg-transparent border border-rose-500/50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-colors text-xs font-bold"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </Motion.div>
            )}

            {activeTab === 'PACKAGES' && (
                <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center bg-lumina-surface border border-lumina-highlight p-6 rounded-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-white">Service Packages</h2>
                            <p className="text-sm text-lumina-muted">Manage the catalog of services available for booking.</p>
                        </div>
                        <button type="button" onClick={() => { setIsEditingPackage(false); setNewPackage({name:'', price:0, duration:1, features: [], costBreakdown: []}); setShowAddPackage(true); }} className="flex items-center gap-2 bg-lumina-accent text-lumina-base px-4 py-2 rounded-lg font-bold hover:bg-lumina-accent/90 transition-colors">
                            <Plus size={16} /> Add Package
                        </button>
                    </div>

                    {/* ... (Add Package Form) ... */}
                    {showAddPackage && (
                         <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-lumina-highlight/20 border border-lumina-highlight rounded-2xl p-6 mb-4">
                             {/* ... */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                 {/* ... Inputs ... */}
                                 <div>
                                     <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Package Name</label>
                                     <input placeholder="Name" className="w-full bg-lumina-base border border-lumina-highlight p-2 rounded text-white" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Price (IDR)</label>
                                     <input type="number" placeholder="Price" className="w-full bg-lumina-base border border-lumina-highlight p-2 rounded text-white" value={newPackage.price || ''} onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})} />
                                 </div>
                                 <div>
                                     <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Duration (Hours)</label>
                                     <input type="number" placeholder="Hours" className="w-full bg-lumina-base border border-lumina-highlight p-2 rounded text-white" value={newPackage.duration || ''} onChange={e => setNewPackage({...newPackage, duration: Number(e.target.value)})} />
                                 </div>
                                 {/* ... */}
                             </div>
                             <button type="button" onClick={handleSavePackage} className="bg-lumina-accent text-lumina-base px-4 py-2 rounded font-bold text-sm">Save Package</button>
                         </Motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {packages.map(pkg => {
                            return (
                                <div key={pkg.id} className={`bg-lumina-surface border ${pkg.active ? 'border-lumina-highlight' : 'border-lumina-highlight/30 opacity-60'} rounded-2xl p-6 group transition-all hover:border-lumina-accent/50 relative`}>
                                    {/* ... Package Card Content ... */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{pkg.name}</h3>
                                            <p className="text-lumina-muted text-sm font-mono mt-1">{pkg.duration} Hours Session</p>
                                        </div>
                                        <button type="button" onClick={() => togglePackage(pkg)} className="text-lumina-muted hover:text-lumina-accent transition-colors">
                                            {pkg.active ? <ToggleRight size={28} className="text-lumina-accent" /> : <ToggleLeft size={28} />}
                                        </button>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-2xl font-display font-bold text-white">Rp {pkg.price.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex gap-2 pt-4 border-t border-lumina-highlight/50">
                                        <button type="button" onClick={() => handleEditPackage(pkg)} className="flex-1 py-2 text-sm font-bold text-lumina-muted hover:text-white bg-lumina-base border border-lumina-highlight rounded-lg flex items-center justify-center gap-2 hover:border-lumina-accent transition-colors">
                                            <Edit2 size={14} className="pointer-events-none" /> Edit
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={(e) => handleDeletePackage(e, pkg)} 
                                            className="py-2 px-3 text-sm font-bold text-lumina-muted hover:text-rose-500 bg-lumina-base border border-lumina-highlight rounded-lg flex items-center justify-center transition-colors cursor-pointer z-10"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Motion.div>
            )}

            {activeTab === 'STUDIOS' && (
                 <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center bg-lumina-surface border border-lumina-highlight p-6 rounded-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-white">Rooms & Locations</h2>
                            <p className="text-sm text-lumina-muted">Manage available shooting spaces in your calendar.</p>
                        </div>
                    </div>

                    <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                             {(localConfig.rooms || []).map((room) => (
                                 <div key={room.id} className="flex items-center justify-between p-4 bg-lumina-base border border-lumina-highlight rounded-xl">
                                     <div className="flex items-center gap-4">
                                         <div className={`w-8 h-8 rounded-lg bg-${room.color}-500/20 text-${room.color}-400 flex items-center justify-center font-bold border border-${room.color}-500/30`}>
                                             {room.name.charAt(0)}
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-white">{room.name}</h4>
                                             <span className="text-[10px] uppercase text-lumina-muted bg-lumina-highlight px-1.5 py-0.5 rounded">{room.type}</span>
                                         </div>
                                     </div>
                                     <button 
                                        type="button" 
                                        onClick={(e) => handleDeleteRoom(e, room.id, room.name)} 
                                        className="p-2 text-lumina-muted hover:text-rose-500 transition-colors cursor-pointer z-10"
                                     >
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             ))}
                        </div>
                        
                        <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Add New Room</h4>
                        <div className="flex gap-2">
                             <input placeholder="Room Name (e.g. Garden)" className="bg-lumina-base border border-lumina-highlight p-2 rounded-lg text-white text-sm flex-1" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} />
                             <select className="bg-lumina-base border border-lumina-highlight p-2 rounded-lg text-white text-sm" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value as any})}>
                                 <option value="INDOOR">Indoor</option>
                                 <option value="OUTDOOR">Outdoor</option>
                             </select>
                             <select className="bg-lumina-base border border-lumina-highlight p-2 rounded-lg text-white text-sm" value={newRoom.color} onChange={e => setNewRoom({...newRoom, color: e.target.value})}>
                                 <option value="indigo">Indigo</option>
                                 <option value="purple">Purple</option>
                                 <option value="emerald">Emerald</option>
                                 <option value="rose">Rose</option>
                                 <option value="amber">Amber</option>
                             </select>
                             <button type="button" onClick={handleAddRoom} className="bg-lumina-accent text-lumina-base font-bold px-4 rounded-lg">Add</button>
                        </div>
                    </div>
                </Motion.div>
            )}

            {activeTab === 'TEMPLATES' && (
                 <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     {/* ... (Templates tab content) ... */}
                     <div className="flex justify-between items-center bg-lumina-surface border border-lumina-highlight p-6 rounded-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-white">Message Templates</h2>
                            <p className="text-sm text-lumina-muted">Customize automated WhatsApp messages.</p>
                        </div>
                        <button type="button" onClick={handleSaveConfig} className="bg-lumina-base text-lumina-muted hover:text-white border border-lumina-highlight hover:border-lumina-accent px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                    <div className="space-y-4">
                         <div className="bg-lumina-surface border border-lumina-highlight p-4 rounded-2xl">
                             <h4 className="font-bold text-white mb-2">Booking Confirmation</h4>
                             <textarea 
                                className="w-full h-32 bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-sm text-white focus:border-lumina-accent outline-none"
                                value={localConfig.templates.booking}
                                onChange={(e) => handleTemplateChange('booking', e.target.value)}
                             />
                         </div>
                         {/* ... */}
                    </div>
                 </Motion.div>
            )}

            {activeTab === 'SYSTEM' && (
                 <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-8 space-y-8">
                     <div>
                         <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Database size={20}/> Data Management</h3>
                         <div className="p-4 bg-lumina-base border border-lumina-highlight rounded-xl flex justify-between items-center">
                             <div>
                                 <p className="font-bold text-white">Backup Data</p>
                                 <p className="text-sm text-lumina-muted">Download a JSON copy of all bookings and settings.</p>
                             </div>
                             <button type="button" onClick={handleExportData} className="px-4 py-2 bg-lumina-highlight text-white rounded-lg hover:bg-white hover:text-black transition-colors font-bold flex items-center gap-2">
                                 <Download size={16} /> Export JSON
                             </button>
                         </div>
                     </div>

                     <div>
                         <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 text-rose-400"><RefreshCcw size={20}/> Danger Zone</h3>
                         <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl flex justify-between items-center">
                             <div>
                                 <p className="font-bold text-rose-400">Factory Reset</p>
                                 <p className="text-sm text-lumina-muted">Clear all session data and refresh the application.</p>
                             </div>
                             <button type="button" onClick={handleReset} className="px-4 py-2 bg-transparent border border-rose-500/50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-colors font-bold">
                                 Reset App
                             </button>
                         </div>
                     </div>
                 </Motion.div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
