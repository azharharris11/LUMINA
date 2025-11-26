


import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, StudioConfig, SettingsViewProps, StudioRoom, Booking, User, WorkflowAutomation, ProjectStatus } from '../types';
import { Settings as SettingsIcon, Tag, Plus, Edit2, ToggleLeft, ToggleRight, Building, Save, X, Layout, MessageSquare, Trash2, Clock, DollarSign, AlertCircle, Sliders, Briefcase, Bell, Link, User as UserIcon, CheckCircle2, Calendar, Archive, CreditCard, Smartphone, Download, RefreshCcw, HardDrive, Check, Zap } from 'lucide-react';

const Motion = motion as any;

interface ExtendedSettingsViewProps extends SettingsViewProps {
    bookings?: Booking[];
    googleToken?: string | null;
    setGoogleToken?: (token: string | null) => void;
}

declare var google: any;

const SettingsView: React.FC<ExtendedSettingsViewProps> = ({ packages, config, onAddPackage, onUpdatePackage, onDeletePackage, onUpdateConfig, bookings = [], currentUser, onUpdateUserProfile, onDeleteAccount, googleToken, setGoogleToken }) => {
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [localConfig, setLocalConfig] = useState<StudioConfig>(config);
  
  const [profileForm, setProfileForm] = useState<Partial<User>>({ name: '', phone: '', avatar: '', specialization: '' });

  // Workflow State
  const [newAutomation, setNewAutomation] = useState<Partial<WorkflowAutomation>>({ triggerStatus: 'SHOOTING', tasks: [] });
  const [taskInput, setTaskInput] = useState('');

  const [notifications, setNotifications] = useState({
      email: { booking: true, payment: true, reminder: false },
      whatsapp: { booking: true, payment: true, reminder: true }
  });

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
  
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<Package>>({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [], turnaroundDays: 7 });
  const [featureInput, setFeatureInput] = useState('');
  
  const [newRoom, setNewRoom] = useState<Partial<StudioRoom>>({ name: '', type: 'INDOOR', color: 'gray' });

  // --- GOOGLE CALENDAR & DRIVE INTEGRATION LOGIC ---
  const loadGoogleScript = () => {
      return new Promise((resolve) => {
          if (typeof google !== 'undefined' && google.accounts) {
              resolve(true);
              return;
          }
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve(true);
          document.body.appendChild(script);
      });
  };

  const handleConnectGoogle = async () => {
      if (googleToken) {
          if (window.confirm("Disconnect Google Account? This will stop Calendar Sync and Drive integrations.")) {
              if(setGoogleToken) setGoogleToken(null);
          }
          return;
      }

      await loadGoogleScript();

      // YOUR CLIENT ID
      const CLIENT_ID = '276331844787-lolqnoah70th2mm7jt2ftim37sjilu00.apps.googleusercontent.com'; 

      const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          // SCOPES: 
          // calendar.events: Read/Write Calendar
          // drive: FULL Access required to create/rename/delete generic folders user owns
          scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive',
          callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                  if(setGoogleToken) setGoogleToken(tokenResponse.access_token);
                  alert("Successfully connected to Google Workspace (Calendar & Drive)!");
              }
          },
      });

      client.requestAccessToken();
  };

  // ... (rest of the file remains exactly the same)
  const togglePackage = (pkg: Package) => {
    if(onUpdatePackage) {
        onUpdatePackage({ ...pkg, active: !pkg.active });
    }
  };

  const handleEditPackage = (pkg: Package) => {
      setNewPackage({ ...pkg, turnaroundDays: pkg.turnaroundDays || 7 }); 
      setIsEditingPackage(true);
      setShowAddPackage(true);
  };
  
  const handleArchivePackage = (e: React.MouseEvent, pkg: Package) => {
      e.stopPropagation(); 
      e.preventDefault();
      
      if (!window.confirm(`Archive package '${pkg.name}'? It will be hidden from new bookings but history is preserved.`)) {
          return;
      }

      if (onUpdatePackage) {
          onUpdatePackage({ ...pkg, active: false, archived: true });
      }
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

  const handleSavePackage = () => {
      const pkgData = {
          name: newPackage.name,
          price: Number(newPackage.price),
          duration: Number(newPackage.duration),
          features: newPackage.features || [],
          active: true,
          costBreakdown: newPackage.costBreakdown || [],
          turnaroundDays: Number(newPackage.turnaroundDays) || 7
      };

      if (isEditingPackage && onUpdatePackage && newPackage.id) {
          onUpdatePackage({ ...pkgData, id: newPackage.id } as Package);
      } else if(onAddPackage && newPackage.name) {
          onAddPackage({ ...pkgData, id: `p-${Date.now()}` } as Package);
      }
      
      setShowAddPackage(false);
      setIsEditingPackage(false);
      setNewPackage({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [], turnaroundDays: 7 });
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
          if (onUpdateConfig) onUpdateConfig(updatedConfig); 
          setNewRoom({ name: '', type: 'INDOOR', color: 'gray' });
      }
  };

  const handleDeleteRoom = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (!window.confirm(`Delete studio room '${name}'? This will remove it from future booking options.`)) {
          return;
      }

      try {
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
  };

  const handleSaveProfile = () => {
      if (onUpdateUserProfile && profileForm.name) {
          onUpdateUserProfile(profileForm as User);
      }
  };

  const handleExportData = () => {
      const dataToExport = {
          config: localConfig,
          packages: packages,
          timestamp: new Date().toISOString()
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "lumina_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // Automation Handlers
  const handleAddTaskToAutomation = () => {
      if(taskInput.trim()) {
          setNewAutomation(prev => ({ ...prev, tasks: [...(prev.tasks || []), taskInput.trim()] }));
          setTaskInput('');
      }
  };

  const handleAddAutomation = () => {
      if(newAutomation.triggerStatus && newAutomation.tasks && newAutomation.tasks.length > 0) {
          const automation: WorkflowAutomation = {
              id: `wf-${Date.now()}`,
              triggerStatus: newAutomation.triggerStatus,
              tasks: newAutomation.tasks
          };
          const updatedConfig = { 
              ...localConfig, 
              workflowAutomations: [...(localConfig.workflowAutomations || []), automation] 
          };
          setLocalConfig(updatedConfig);
          if (onUpdateConfig) onUpdateConfig(updatedConfig);
          setNewAutomation({ triggerStatus: 'SHOOTING', tasks: [] });
      }
  };

  const handleDeleteAutomation = (id: string) => {
      const updatedConfig = { 
          ...localConfig, 
          workflowAutomations: (localConfig.workflowAutomations || []).filter(a => a.id !== id) 
      };
      setLocalConfig(updatedConfig);
      if (onUpdateConfig) onUpdateConfig(updatedConfig);
  };

  const displayedPackages = packages.filter(p => !p.archived);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-end shrink-0">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Settings</h1>
          <p className="text-lumina-muted">Configure studio services, pricing, and system preferences.</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-6">
        <div className="w-64 bg-lumina-surface border border-lumina-highlight rounded-2xl p-4 h-full overflow-y-auto custom-scrollbar shrink-0">
            <nav className="space-y-1">
                <button type="button" onClick={() => setActiveTab('GENERAL')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'GENERAL' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <Building className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Studio Info</span>
                </button>
                <button type="button" onClick={() => setActiveTab('OPERATIONS')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'OPERATIONS' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <Sliders className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Operations</span>
                </button>
                <button type="button" onClick={() => setActiveTab('PROFILE')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'PROFILE' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <UserIcon className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">My Profile</span>
                </button>
                <div className="my-2 border-t border-lumina-highlight mx-2"></div>
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
                <div className="my-2 border-t border-lumina-highlight mx-2"></div>
                <button type="button" onClick={() => setActiveTab('INTEGRATIONS')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'INTEGRATIONS' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <Link className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Integrations</span>
                </button>
                <button type="button" onClick={() => setActiveTab('NOTIFICATIONS')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'NOTIFICATIONS' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <Bell className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">Notifications</span>
                </button>
                <div className="my-2 border-t border-lumina-highlight mx-2"></div>
                <button type="button" onClick={() => setActiveTab('SYSTEM')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'SYSTEM' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}>
                    <SettingsIcon className="w-4 h-4 mr-3 pointer-events-none" />
                    <span className="text-sm font-bold">System</span>
                </button>
            </nav>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
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

            {activeTab === 'OPERATIONS' && (
                <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-8">
                    {/* ... operations content ... */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                             <h2 className="text-xl font-bold text-white">Operational Policy</h2>
                             <p className="text-lumina-muted text-sm mt-1">Define your schedule, production timelines, and financial rules.</p>
                        </div>
                        <button type="button" onClick={handleSaveConfig} className="bg-lumina-base text-lumina-muted hover:text-white border border-lumina-highlight hover:border-lumina-accent px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                            <Save size={16} /> Save Policies
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* SCHEDULING */}
                        <div>
                            <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={16} /> Scheduling Rules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Open Time</label>
                                    <input 
                                        type="time" 
                                        name="operatingHoursStart" 
                                        value={localConfig.operatingHoursStart || '09:00'} 
                                        onChange={handleConfigChange} 
                                        className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Close Time</label>
                                    <input 
                                        type="time" 
                                        name="operatingHoursEnd" 
                                        value={localConfig.operatingHoursEnd || '18:00'} 
                                        onChange={handleConfigChange} 
                                        className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Buffer (Minutes)</label>
                                    <input 
                                        type="number" 
                                        name="bufferMinutes" 
                                        value={localConfig.bufferMinutes || 15} 
                                        onChange={handleConfigChange} 
                                        className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" 
                                        placeholder="e.g. 15"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PRODUCTION */}
                        <div className="border-t border-lumina-highlight pt-6">
                            <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Briefcase size={16} /> Production Workflow
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Default Turnaround Time (Days)</label>
                                    <input 
                                        type="number" 
                                        name="defaultTurnaroundDays" 
                                        value={localConfig.defaultTurnaroundDays || 7} 
                                        onChange={handleConfigChange} 
                                        className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" 
                                        placeholder="e.g. 7"
                                    />
                                    <p className="text-[10px] text-lumina-muted mt-1">Used if package-specific time is not set.</p>
                                </div>
                            </div>
                        </div>

                        {/* WORKFLOW AUTOMATION */}
                        <div className="border-t border-lumina-highlight pt-6">
                            <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Zap size={16} /> Workflow Automation
                            </h3>
                            
                            <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4 mb-4">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-1/3">
                                        <label className="text-xs font-bold text-lumina-muted uppercase block mb-1">If Status Is...</label>
                                        <select 
                                            className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none"
                                            value={newAutomation.triggerStatus}
                                            onChange={e => setNewAutomation({...newAutomation, triggerStatus: e.target.value as ProjectStatus})}
                                        >
                                            <option value="SHOOTING">Shooting</option>
                                            <option value="CULLING">Culling</option>
                                            <option value="EDITING">Editing</option>
                                            <option value="REVIEW">Review</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-lumina-muted uppercase block mb-1">Add These Tasks</label>
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none"
                                                placeholder="Task name (e.g. Backup RAW)"
                                                value={taskInput}
                                                onChange={e => setTaskInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddTaskToAutomation()}
                                            />
                                            <button onClick={handleAddTaskToAutomation} className="p-2 bg-lumina-highlight rounded hover:text-white text-lumina-muted">+</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newAutomation.tasks?.map((t, i) => (
                                                <span key={i} className="text-[10px] bg-lumina-surface border border-lumina-highlight px-2 py-1 rounded text-lumina-muted">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddAutomation}
                                    disabled={!newAutomation.tasks || newAutomation.tasks.length === 0}
                                    className="w-full py-2 bg-lumina-highlight hover:bg-lumina-accent hover:text-lumina-base text-lumina-muted text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Create Automation Rule
                                </button>
                            </div>

                            <div className="space-y-2">
                                {(localConfig.workflowAutomations || []).map(auto => (
                                    <div key={auto.id} className="flex justify-between items-center p-3 bg-lumina-base border border-lumina-highlight rounded-lg">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-lumina-muted font-mono">WHEN</span>
                                                <span className="text-xs font-bold text-white bg-lumina-surface px-2 py-0.5 rounded border border-lumina-highlight">{auto.triggerStatus}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-lumina-muted font-mono">CREATE</span>
                                                <span className="text-xs text-lumina-accent truncate">{auto.tasks.join(', ')}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteAutomation(auto.id)} className="text-lumina-muted hover:text-rose-500"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                {(localConfig.workflowAutomations || []).length === 0 && (
                                    <p className="text-xs text-lumina-muted italic text-center py-2">No automations configured.</p>
                                )}
                            </div>
                        </div>

                        {/* FINANCE */}
                        <div className="border-t border-lumina-highlight pt-6">
                            <h3 className="text-sm font-bold text-lumina-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                                <DollarSign size={16} /> Financial Policy
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Tax Rate (%)</label>
                                    <input 
                                        type="number" 
                                        name="taxRate" 
                                        value={localConfig.taxRate || 0} 
                                        onChange={handleConfigChange} 
                                        className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" 
                                        placeholder="e.g. 11"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Required Down Payment (%)</label>
                                    <input 
                                        type="number" 
                                        name="requiredDownPaymentPercentage" 
                                        value={localConfig.requiredDownPaymentPercentage || 50} 
                                        onChange={handleConfigChange} 
                                        className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" 
                                        placeholder="e.g. 50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Payment Due (Days)</label>
                                    <input 
                                        type="number" 
                                        name="paymentDueDays" 
                                        value={localConfig.paymentDueDays || 0} 
                                        onChange={handleConfigChange} 
                                        className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white focus:outline-none focus:border-lumina-accent" 
                                        placeholder="0 = Session Day"
                                    />
                                </div>
                            </div>
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
                    {/* Profile Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Full Name</label>
                            <input className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Phone</label>
                            <input className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs text-lumina-muted uppercase font-bold mb-2">Specialization</label>
                            <input className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white" value={profileForm.specialization} onChange={e => setProfileForm({...profileForm, specialization: e.target.value})} />
                        </div>
                    </div>

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
                        <button type="button" onClick={() => { setIsEditingPackage(false); setNewPackage({name:'', price:0, duration:1, features: [], costBreakdown: [], turnaroundDays: 7}); setShowAddPackage(true); }} className="flex items-center gap-2 bg-lumina-accent text-lumina-base px-4 py-2 rounded-lg font-bold hover:bg-lumina-accent/90 transition-colors">
                            <Plus size={16} /> Add Package
                        </button>
                    </div>

                    {showAddPackage && (
                         <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-lumina-highlight/20 border border-lumina-highlight rounded-2xl p-6 mb-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                 <div>
                                     <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Turnaround (Days)</label>
                                     <input type="number" placeholder="e.g. 7 days" className="w-full bg-lumina-base border border-lumina-highlight p-2 rounded text-white" value={newPackage.turnaroundDays || ''} onChange={e => setNewPackage({...newPackage, turnaroundDays: Number(e.target.value)})} />
                                 </div>
                             </div>
                             
                             <div className="mb-4">
                                 <label className="text-xs text-lumina-muted uppercase font-bold block mb-1">Features</label>
                                 <div className="flex gap-2 mb-2">
                                     <input 
                                        className="flex-1 bg-lumina-base border border-lumina-highlight p-2 rounded text-white"
                                        placeholder="Add feature (e.g. 'All Raw Files')"
                                        value={featureInput}
                                        onChange={e => setFeatureInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addFeature()}
                                     />
                                     <button onClick={addFeature} className="bg-lumina-highlight text-white px-3 py-2 rounded hover:bg-lumina-accent hover:text-lumina-base font-bold">+</button>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                     {newPackage.features?.map((f, i) => (
                                         <span key={i} className="bg-lumina-base px-2 py-1 rounded text-xs text-white border border-lumina-highlight flex items-center gap-1">
                                             {f} <button onClick={() => removeFeature(i)} className="hover:text-rose-500"><X size={10}/></button>
                                         </span>
                                     ))}
                                 </div>
                             </div>

                             <div className="flex justify-end gap-2 mt-6">
                                 <button onClick={() => setShowAddPackage(false)} className="text-lumina-muted font-bold px-4 py-2 hover:text-white">Cancel</button>
                                 <button type="button" onClick={handleSavePackage} className="bg-lumina-accent text-lumina-base px-4 py-2 rounded font-bold text-sm">Save Package</button>
                             </div>
                         </Motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayedPackages.map(pkg => {
                            return (
                                <div key={pkg.id} className={`bg-lumina-surface border ${pkg.active ? 'border-lumina-highlight' : 'border-lumina-highlight/30 opacity-60'} rounded-2xl p-6 group transition-all hover:border-lumina-accent/50 relative`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{pkg.name}</h3>
                                            <p className="text-lumina-muted text-sm font-mono mt-1">{pkg.duration}h Session • {pkg.turnaroundDays}d Turnaround</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => togglePackage(pkg)} className="p-2 text-lumina-muted hover:text-lumina-accent transition-colors">
                                                {pkg.active ? <ToggleRight size={24} className="text-emerald-400" /> : <ToggleLeft size={24} />}
                                            </button>
                                            <button onClick={() => handleEditPackage(pkg)} className="p-2 text-lumina-muted hover:text-white">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => handleArchivePackage(e, pkg)} className="p-2 text-lumina-muted hover:text-rose-500">
                                                <Archive size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white mb-4">Rp {pkg.price.toLocaleString()}</p>
                                    <ul className="space-y-1 text-xs text-lumina-muted">
                                        {pkg.features.map((f, i) => <li key={i}>• {f}</li>)}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </Motion.div>
            )}

            {activeTab === 'STUDIOS' && (
                <div className="space-y-6">
                    <div className="flex gap-2 bg-lumina-surface p-4 rounded-xl border border-lumina-highlight mb-6">
                        <input 
                            placeholder="New Room Name" 
                            className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                            value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                        />
                        <select 
                            className="bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white"
                            value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value as any})}
                        >
                            <option value="INDOOR">Indoor</option>
                            <option value="OUTDOOR">Outdoor</option>
                        </select>
                        <button onClick={handleAddRoom} className="bg-lumina-accent text-lumina-base px-4 rounded-lg font-bold">Add</button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {localConfig.rooms.map(room => (
                            <div key={room.id} className="flex justify-between items-center p-4 bg-lumina-surface border border-lumina-highlight rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full bg-${room.color}-500`}></div>
                                    <span className="font-bold text-white">{room.name}</span>
                                    <span className="text-xs text-lumina-muted px-2 py-0.5 bg-lumina-highlight rounded">{room.type}</span>
                                </div>
                                <button onClick={(e) => handleDeleteRoom(e, room.id, room.name)} className="text-lumina-muted hover:text-rose-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'INTEGRATIONS' && (
                <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Apps & Integrations</h2>
                        <div className="space-y-4">
                            
                            {/* Google Calendar & Drive */}
                            <div className="flex items-center justify-between p-4 bg-lumina-base border border-lumina-highlight rounded-xl relative overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                        <div className="grid grid-cols-2 gap-1">
                                            <Calendar className="text-blue-500 w-4 h-4" />
                                            <HardDrive className="text-green-500 w-4 h-4" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Google Calendar & Drive</h3>
                                        <p className="text-xs text-lumina-muted">Sync bookings to calendar and create project folders automatically.</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1"><Check size={8}/> Sync Schedule</span>
                                            <span className="text-[9px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1"><Check size={8}/> Project Folders</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleConnectGoogle}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border relative z-10
                                        ${googleToken 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                            : 'bg-lumina-highlight text-white border-lumina-highlight hover:bg-lumina-highlight/80'}`}
                                >
                                    {googleToken ? 'Connected' : 'Connect'}
                                </button>
                            </div>

                            {/* Midtrans / Payment */}
                            <div className="flex items-center justify-between p-4 bg-lumina-base border border-lumina-highlight rounded-xl opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                                        <CreditCard className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Midtrans Payment</h3>
                                        <p className="text-xs text-lumina-muted">Accept Credit Card & Qris automatically.</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-lumina-highlight text-lumina-muted rounded-lg text-xs font-bold cursor-not-allowed">Coming Soon</button>
                            </div>

                            {/* WhatsApp Gateway */}
                            <div className="flex items-center justify-between p-4 bg-lumina-base border border-lumina-highlight rounded-xl opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                                        <Smartphone className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">WhatsApp Gateway</h3>
                                        <p className="text-xs text-lumina-muted">Automated reminders without manual clicks.</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-lumina-highlight text-lumina-muted rounded-lg text-xs font-bold cursor-not-allowed">Coming Soon</button>
                            </div>

                        </div>
                    </div>
                </Motion.div>
            )}

            {activeTab === 'NOTIFICATIONS' && (
                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6">Notification Preferences</h2>
                    {/* ... notification toggles ... */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-wider mb-3">Email Alerts</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 bg-lumina-base border border-lumina-highlight rounded-lg">
                                    <span className="text-sm text-white">New Booking Received</span>
                                    <button onClick={() => setNotifications({...notifications, email: {...notifications.email, booking: !notifications.email.booking}})} className={`w-10 h-5 rounded-full relative transition-colors ${notifications.email.booking ? 'bg-lumina-accent' : 'bg-lumina-highlight'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${notifications.email.booking ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-lumina-base border border-lumina-highlight rounded-lg">
                                    <span className="text-sm text-white">Payment Received</span>
                                    <button onClick={() => setNotifications({...notifications, email: {...notifications.email, payment: !notifications.email.payment}})} className={`w-10 h-5 rounded-full relative transition-colors ${notifications.email.payment ? 'bg-lumina-accent' : 'bg-lumina-highlight'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${notifications.email.payment ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-wider mb-3">WhatsApp Client Automation</h3>
                            <div className="p-3 bg-lumina-accent/5 border border-lumina-accent/20 rounded-lg text-xs text-lumina-accent mb-4">
                                <CheckCircle2 size={12} className="inline mr-1" /> Messages will open in your WhatsApp Desktop app.
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 bg-lumina-base border border-lumina-highlight rounded-lg">
                                    <span className="text-sm text-white">Booking Confirmation</span>
                                    <button onClick={() => setNotifications({...notifications, whatsapp: {...notifications.whatsapp, booking: !notifications.whatsapp.booking}})} className={`w-10 h-5 rounded-full relative transition-colors ${notifications.whatsapp.booking ? 'bg-emerald-500' : 'bg-lumina-highlight'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${notifications.whatsapp.booking ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-lumina-base border border-lumina-highlight rounded-lg">
                                    <span className="text-sm text-white">Payment Reminder (H-3)</span>
                                    <button onClick={() => setNotifications({...notifications, whatsapp: {...notifications.whatsapp, reminder: !notifications.whatsapp.reminder}})} className={`w-10 h-5 rounded-full relative transition-colors ${notifications.whatsapp.reminder ? 'bg-emerald-500' : 'bg-lumina-highlight'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${notifications.whatsapp.reminder ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'TEMPLATES' && (
                <div className="space-y-6">
                    <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Message Templates</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-lumina-muted uppercase mb-2 block">Booking Confirmation</label>
                                <textarea 
                                    className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white text-sm min-h-[100px]"
                                    value={localConfig.templates.booking}
                                    onChange={e => handleTemplateChange('booking', e.target.value)}
                                />
                                <p className="text-[10px] text-lumina-muted mt-1">Variables: {'{clientName}, {date}, {time}, {studio}, {package}'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-lumina-muted uppercase mb-2 block">Payment Reminder</label>
                                <textarea 
                                    className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white text-sm min-h-[100px]"
                                    value={localConfig.templates.reminder}
                                    onChange={e => handleTemplateChange('reminder', e.target.value)}
                                />
                                <p className="text-[10px] text-lumina-muted mt-1">Variables: {'{balance}, {bankName}, {bankAccount}'}</p>
                            </div>
                        </div>
                        <button onClick={handleSaveConfig} className="mt-4 bg-lumina-accent text-lumina-base px-4 py-2 rounded-lg font-bold text-sm">Save Templates</button>
                    </div>
                </div>
            )}

            {activeTab === 'SYSTEM' && (
                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">System Maintenance</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-4 bg-lumina-base border border-lumina-highlight rounded-xl">
                            <div>
                                <h4 className="font-bold text-white">Data Backup</h4>
                                <p className="text-xs text-lumina-muted">Download a JSON copy of your settings and packages.</p>
                            </div>
                            <button onClick={handleExportData} className="bg-lumina-highlight hover:bg-white hover:text-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                <Download size={16} /> Export
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-lumina-base border border-lumina-highlight rounded-xl">
                            <div>
                                <h4 className="font-bold text-white">Clear Cache</h4>
                                <p className="text-xs text-lumina-muted">Force reload application state.</p>
                            </div>
                            <button onClick={() => window.location.reload()} className="bg-lumina-highlight hover:bg-white hover:text-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                <RefreshCcw size={16} /> Reload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;