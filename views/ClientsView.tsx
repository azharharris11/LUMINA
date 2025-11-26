
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client, Booking, ClientsViewProps } from '../types';
import { Search, Filter, Phone, Mail, Clock, ShieldAlert, Star, History, MessageSquare, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import WhatsAppModal from '../components/WhatsAppModal';
import { STUDIO_CONFIG } from '../data';

const Motion = motion as any;

const ClientsView: React.FC<ClientsViewProps> = ({ clients, bookings, onUpdateClient, onAddClient, onDeleteClient, onSelectBooking }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Client Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
      name: '', phone: '', email: '', category: 'NEW', notes: ''
  });
  
  // WhatsApp Modal
  const [selectedBookingForWA, setSelectedBookingForWA] = useState<Booking | null>(null);

  const getClientSpend = (clientId: string) => {
    return bookings
      .filter(b => b.clientId === clientId)
      .reduce((acc, curr) => acc + curr.price, 0);
  };

  const getClientBookings = (clientId: string) => {
    return bookings.filter(b => b.clientId === clientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCategoryColor = (cat: Client['category']) => {
    switch(cat) {
        case 'VIP': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'NEW': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'PROBLEMATIC': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-lumina-highlight text-lumina-muted border-lumina-highlight';
    }
  };

  const handleEdit = () => {
      setEditForm(selectedClient || {});
      setIsEditing(true);
  };

  const handleSave = () => {
      if (onUpdateClient && selectedClient && editForm) {
          onUpdateClient({ ...selectedClient, ...editForm } as Client);
          setSelectedClient({ ...selectedClient, ...editForm } as Client);
          setIsEditing(false);
      }
  };

  const handleAdd = () => {
      if (onAddClient && newClient.name) {
          onAddClient({
              id: `c-${Date.now()}`,
              name: newClient.name!,
              phone: newClient.phone || '',
              email: newClient.email || '',
              category: 'NEW',
              notes: newClient.notes || '',
              joinedDate: new Date().toISOString().split('T')[0],
              avatar: `https://ui-avatars.com/api/?name=${newClient.name}&background=random`
          });
          setIsAddModalOpen(false);
          setNewClient({ name: '', phone: '', email: '', notes: '' });
      }
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      // 1. Safety Check
      if (!selectedClient) return;

      // 2. Confirm First (Sync)
      if (!window.confirm(`Are you sure you want to permanently delete client '${selectedClient.name}'?`)) {
          return;
      }

      try {
          // 3. Integrity Check
          const validBookings = bookings || [];
          const associatedBookings = validBookings.filter(b => b && b.clientId === selectedClient.id);
          
          if (associatedBookings.length > 0) {
              alert(`Blocked: Client '${selectedClient.name}' has ${associatedBookings.length} recorded bookings.\n\nDeleting this client would corrupt your financial history. Please delete their bookings first.`);
              return;
          }

          // 4. Execute
          if (onDeleteClient) {
              onDeleteClient(selectedClient.id);
              setSelectedClient(null);
          } else {
              alert("Delete function not available.");
          }
      } catch (err: any) {
          console.error("Delete Client Error:", err);
          alert("System error checking client history. Aborting.");
      }
  };

  const handleOpenWA = () => {
      if (selectedClient) {
          const dummyBooking: any = {
              id: 'temp',
              clientName: selectedClient.name,
              clientPhone: selectedClient.phone,
              date: 'N/A',
              price: 0,
              paidAmount: 0,
              package: 'General Inquiry',
              studio: 'Lumina',
              timeStart: ''
          };
          setSelectedBookingForWA(dummyBooking);
      }
  }

  const filteredClients = clients.filter(c => 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Client Management</h1>
          <p className="text-lumina-muted">CRM Database with spending history and preference notes.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted w-4 h-4 group-focus-within:text-lumina-accent transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search name, phone..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-lumina-surface border border-lumina-highlight rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-lumina-accent w-64 transition-all"
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-lumina-accent text-lumina-base px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-lumina-accent/90 transition-colors shadow-lg shadow-lumina-accent/10"
            >
                <Plus size={18} /> Add Client
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Client List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {filteredClients.length === 0 && (
                <div className="text-center py-10 text-lumina-muted opacity-50">No clients found.</div>
            )}
            {filteredClients.map((client, i) => {
                const spend = getClientSpend(client.id);
                const isSelected = selectedClient?.id === client.id;

                return (
                    <Motion.div
                        key={client.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => {
                            setSelectedClient(client);
                            setIsEditing(false);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden
                            ${isSelected 
                                ? 'bg-lumina-highlight border-lumina-accent' 
                                : 'bg-lumina-surface border-lumina-highlight hover:border-lumina-muted'}
                            hover:bg-lumina-highlight/50`}
                    >
                        <div className="flex items-center gap-4">
                            <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-full border border-lumina-highlight" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-lumina-muted group-hover:text-white'}`}>
                                        {client.name}
                                    </h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(client.category)}`}>
                                        {client.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-lumina-muted">
                                    <span className="flex items-center gap-1"><Phone size={10} /> {client.phone}</span>
                                    <span className="flex items-center gap-1 font-mono text-lumina-accent">Rp {spend.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </Motion.div>
                );
            })}
        </div>

        {/* Client Detail Panel */}
        <div className="w-[400px] bg-lumina-surface border border-lumina-highlight rounded-2xl overflow-hidden flex flex-col">
            {selectedClient ? (
                <Motion.div 
                    key={selectedClient.id}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex flex-col h-full"
                >
                    {/* Header Profile */}
                    <div className="p-6 border-b border-lumina-highlight bg-lumina-base/50 text-center relative">
                        {isEditing && (
                             <div className="absolute top-4 right-4 flex gap-2">
                                 <button onClick={() => setIsEditing(false)} className="p-2 bg-lumina-highlight rounded text-white"><X size={16}/></button>
                                 <button onClick={handleSave} className="p-2 bg-lumina-accent text-lumina-base rounded font-bold"><Save size={16}/></button>
                             </div>
                        )}
                        {!isEditing && (
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button 
                                    type="button" 
                                    onClick={handleDelete} 
                                    className="p-2 bg-rose-500/10 border border-rose-500/30 rounded hover:bg-rose-500 hover:text-white text-rose-500 transition-colors z-20 cursor-pointer" 
                                    title="Delete Client"
                                >
                                    <Trash2 size={16} className="pointer-events-none" />
                                </button>
                                <button onClick={handleEdit} className="p-2 text-lumina-muted hover:text-white transition-colors">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}
                        
                        <img src={selectedClient.avatar} className="w-24 h-24 rounded-full border-4 border-lumina-surface mx-auto mb-3 shadow-xl" />
                        
                        {isEditing ? (
                            <input 
                                className="bg-lumina-highlight text-white text-center font-display font-bold text-xl rounded p-1 w-full mb-1"
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                            />
                        ) : (
                            <h2 className="text-2xl font-display font-bold text-white">{selectedClient.name}</h2>
                        )}

                        <div className="flex justify-center gap-3 mt-3">
                             <a href={`tel:${selectedClient.phone}`} className="p-2 bg-lumina-highlight rounded-full hover:bg-lumina-accent hover:text-lumina-base transition-colors text-lumina-muted">
                                 <Phone size={18} />
                             </a>
                             <a href={`mailto:${selectedClient.email}`} className="p-2 bg-lumina-highlight rounded-full hover:bg-lumina-accent hover:text-lumina-base transition-colors text-lumina-muted">
                                 <Mail size={18} />
                             </a>
                             <button onClick={handleOpenWA} className="p-2 bg-lumina-highlight rounded-full hover:bg-lumina-accent hover:text-lumina-base transition-colors text-lumina-muted">
                                 <MessageSquare size={18} />
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-lumina-base border border-lumina-highlight text-center">
                                <span className="text-xs text-lumina-muted uppercase">Total Spend</span>
                                <p className="text-lg font-bold text-emerald-400 font-mono">Rp {getClientSpend(selectedClient.id).toLocaleString('id-ID', {notation: "compact"})}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-lumina-base border border-lumina-highlight text-center">
                                <span className="text-xs text-lumina-muted uppercase">Bookings</span>
                                <p className="text-lg font-bold text-white">{getClientBookings(selectedClient.id).length}x</p>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        {isEditing ? (
                            <div className="space-y-4 p-4 bg-lumina-highlight/10 rounded-xl border border-lumina-highlight">
                                <div>
                                    <label className="text-xs text-lumina-muted uppercase">Phone</label>
                                    <input className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white text-sm mt-1" value={editForm.phone} onChange={e => setEditForm({...editForm,phone: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-lumina-muted uppercase">Email</label>
                                    <input className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white text-sm mt-1" value={editForm.email} onChange={e => setEditForm({...editForm,email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-lumina-muted uppercase">Category</label>
                                    <select className="w-full bg-lumina-base border border-lumina-highlight rounded p-2 text-white text-sm mt-1" value={editForm.category} onChange={e => setEditForm({...editForm,category: e.target.value as any})}>
                                        <option value="REGULAR">Regular</option>
                                        <option value="VIP">VIP</option>
                                        <option value="NEW">New</option>
                                        <option value="PROBLEMATIC">Problematic</option>
                                    </select>
                                </div>
                            </div>
                        ) : null}

                        {/* Internal Notes */}
                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                            <h4 className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center">
                                <ShieldAlert size={12} className="mr-2" /> Studio Notes
                            </h4>
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-lumina-base border border-amber-500/30 rounded p-2 text-white text-sm min-h-[100px]"
                                    value={editForm.notes}
                                    onChange={e => setEditForm({...editForm, notes: e.target.value})}
                                />
                            ) : (
                                <p className="text-sm text-lumina-muted italic">"{selectedClient.notes || 'No notes available.'}"</p>
                            )}
                        </div>

                        {/* Booking History */}
                        <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-3 flex items-center">
                                <History size={14} className="mr-2" /> History
                            </h4>
                            <div className="space-y-3">
                                {getClientBookings(selectedClient.id).map(booking => (
                                    <div 
                                        key={booking.id} 
                                        onClick={() => onSelectBooking(booking.id)}
                                        className="p-3 rounded-lg border border-lumina-highlight bg-lumina-base/30 hover:border-lumina-accent/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-lumina-accent font-mono">{booking.date}</span>
                                            <span className="text-[10px] bg-lumina-highlight px-1.5 py-0.5 rounded text-lumina-muted">{booking.status}</span>
                                        </div>
                                        <p className="text-sm font-bold text-white">{booking.package}</p>
                                        <p className="text-xs text-lumina-muted mt-0.5">at {booking.studio}</p>
                                    </div>
                                ))}
                                {getClientBookings(selectedClient.id).length === 0 && (
                                    <p className="text-xs text-lumina-muted text-center py-4">No booking history.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </Motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-lumina-muted opacity-50 p-8 text-center">
                    <Star size={48} className="mb-4 stroke-1" />
                    <p>Select a client to view details, history, and internal notes.</p>
                </div>
            )}
        </div>
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
          {isAddModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <Motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                  <Motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="relative bg-lumina-surface border border-lumina-highlight w-full max-w-md rounded-2xl p-6 shadow-2xl">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-white">Add New Client</h2>
                          <button onClick={() => setIsAddModalOpen(false)}><X className="text-lumina-muted hover:text-white" /></button>
                      </div>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 uppercase font-bold">Client Name</label>
                              <input className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 uppercase font-bold">Phone Number</label>
                              <input className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 uppercase font-bold">Email</label>
                              <input className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs text-lumina-muted mb-1 uppercase font-bold">Initial Notes</label>
                              <textarea className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white h-20" value={newClient.notes} onChange={e => setNewClient({...newClient, notes: e.target.value})} />
                          </div>
                          <button onClick={handleAdd} className="w-full py-3 bg-lumina-accent text-lumina-base font-bold rounded-xl mt-4 hover:bg-lumina-accent/90">Create Client Profile</button>
                      </div>
                  </Motion.div>
              </div>
          )}
      </AnimatePresence>

      <WhatsAppModal 
         isOpen={!!selectedBookingForWA}
         onClose={() => setSelectedBookingForWA(null)}
         booking={selectedBookingForWA}
         config={STUDIO_CONFIG}
      />
    </div>
  );
};

export default ClientsView;
