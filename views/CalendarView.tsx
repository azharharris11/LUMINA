import React, { useEffect, useState } from 'react';
import { Booking, User, StudioRoom } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, Grid } from 'lucide-react';

interface CalendarViewProps {
  bookings: Booking[];
  currentDate: string;
  users: User[];
  rooms: StudioRoom[];
  onDateChange: (date: string) => void;
  onNewBooking: (prefill?: { date: string, time: string, studio: string }) => void;
  onSelectBooking: (id: string) => void;
  googleToken?: string | null;
}

type ViewMode = 'DAY' | 'WEEK' | 'MONTH';

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, currentDate, users, rooms, onDateChange, onNewBooking, onSelectBooking, googleToken }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('DAY');
  const [currentTimeOffset, setCurrentTimeOffset] = useState<number | null>(null);

  // --- TIME LOGIC ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Only show line if viewing today (and in Day View)
      if (today === currentDate) {
         const currentHour = now.getHours();
         const currentMinutes = now.getMinutes();
         
         // Only show if between 9am and 8pm
         if (currentHour >= 9 && currentHour < 20) {
            const offset = (currentHour - 9) * 128 + (currentMinutes / 60) * 128;
            setCurrentTimeOffset(offset);
         } else {
             setCurrentTimeOffset(null);
         }
      } else {
          setCurrentTimeOffset(null);
      }
    };

    updateTime();
    const interval = window.setInterval(updateTime, 60000); 
    return () => window.clearInterval(interval);
  }, [currentDate]);

  // --- NAVIGATION HANDLERS ---
  const handlePrev = () => {
      const date = new Date(currentDate);
      if (viewMode === 'MONTH') {
          date.setMonth(date.getMonth() - 1);
      } else if (viewMode === 'WEEK') {
          date.setDate(date.getDate() - 7);
      } else {
          date.setDate(date.getDate() - 1);
      }
      onDateChange(date.toISOString().split('T')[0]);
  };

  const handleNext = () => {
      const date = new Date(currentDate);
      if (viewMode === 'MONTH') {
          date.setMonth(date.getMonth() + 1);
      } else if (viewMode === 'WEEK') {
          date.setDate(date.getDate() + 7);
      } else {
          date.setDate(date.getDate() + 1);
      }
      onDateChange(date.toISOString().split('T')[0]);
  };

  const getPhotographerAvatar = (id: string) => {
      return users.find(u => u.id === id)?.avatar || `https://ui-avatars.com/api/?name=${id}`;
  };

  // --- RENDER HELPERS ---
  const getStartOfWeek = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
      return new Date(date.setDate(diff));
  };

  const getDaysInMonth = (dateStr: string) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon
      
      // Normalize to Mon = 0, Sun = 6 for standard generic calendar visual
      // But standardized usually Sun = 0. Let's stick to Sun = 0 as start of week for Month view row
      return { days, year, month, firstDay };
  };

  // --- SUB-COMPONENTS (Layouts) ---

  const MonthView = () => {
      const { days, year, month, firstDay } = getDaysInMonth(currentDate);
      const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
      
      // Create blank slots for previous month
      const blanks = Array.from({ length: firstDay }, (_, i) => i);
      const daySlots = Array.from({ length: days }, (_, i) => i + 1);

      return (
          <div className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 flex flex-col overflow-hidden">
              <div className="grid grid-cols-7 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-center text-xs font-bold text-lumina-muted uppercase">{d}</div>
                  ))}
              </div>
              <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
                  {blanks.map(b => <div key={`blank-${b}`} className="bg-transparent"></div>)}
                  
                  {daySlots.map(day => {
                      const dateStr = new Date(year, month, day).toISOString().split('T')[0]; // Construct simple ISO
                      // IMPORTANT: This simple ISO conversion might have timezone issues. 
                      // Better construction:
                      const d = new Date(year, month, day);
                      // Adjust for timezone offset to ensure YYYY-MM-DD matches properly for comparison
                      const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                      
                      const dayBookings = bookings.filter(b => b.date === offsetDate && b.status !== 'CANCELLED');
                      const isToday = offsetDate === new Date().toISOString().split('T')[0];

                      return (
                          <div 
                            key={day} 
                            onClick={() => { onDateChange(offsetDate); setViewMode('DAY'); }}
                            className={`bg-lumina-base border border-lumina-highlight rounded-lg p-2 flex flex-col transition-colors hover:border-lumina-accent/50 cursor-pointer relative overflow-hidden ${isToday ? 'ring-1 ring-lumina-accent' : ''}`}
                          >
                              <span className={`text-sm font-bold mb-1 ${isToday ? 'text-lumina-accent' : 'text-white'}`}>{day}</span>
                              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                  {dayBookings.slice(0, 3).map(b => {
                                      const roomColor = rooms.find(r => r.name === b.studio)?.color || 'gray';
                                      return (
                                          <div key={b.id} className="flex items-center gap-1">
                                              <div className={`w-2 h-2 rounded-full bg-${roomColor}-500 shrink-0`}></div>
                                              <div className="text-[9px] truncate text-lumina-muted">{b.timeStart} {b.clientName}</div>
                                          </div>
                                      )
                                  })}
                                  {dayBookings.length > 3 && (
                                      <div className="text-[9px] text-center text-lumina-muted italic">+{dayBookings.length - 3} more</div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const WeekView = () => {
      const start = getStartOfWeek(currentDate);
      const weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          return d.toISOString().split('T')[0];
      });
      const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 09:00 to 19:00

      return (
          <div className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="flex border-b border-lumina-highlight bg-lumina-base/50">
                  <div className="w-16 border-r border-lumina-highlight p-2"></div>
                  {weekDays.map(dateStr => {
                      const date = new Date(dateStr);
                      const isToday = dateStr === new Date().toISOString().split('T')[0];
                      return (
                          <div key={dateStr} className="flex-1 p-3 text-center border-r border-lumina-highlight last:border-r-0">
                              <span className="block text-xs text-lumina-muted uppercase font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                              <span className={`block text-lg font-bold ${isToday ? 'text-lumina-accent' : 'text-white'}`}>{date.getDate()}</span>
                          </div>
                      )
                  })}
              </div>

              <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-lumina-base/40">
                  {/* Time Labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-lumina-highlight/30 bg-lumina-base/50 z-10">
                      {hours.map(hour => (
                          <div key={hour} className="h-32 border-b border-lumina-highlight/30 flex items-start justify-center pt-2">
                              <span className="text-xs font-mono text-lumina-muted">{hour}:00</span>
                          </div>
                      ))}
                  </div>

                  {/* Columns */}
                  <div className="absolute inset-0 z-0 ml-16 flex">
                      {weekDays.map(dayStr => {
                          const dayBookings = bookings.filter(b => b.date === dayStr && b.status !== 'CANCELLED');
                          return (
                              <div key={dayStr} className="flex-1 relative border-r border-lumina-highlight/30 last:border-r-0 h-[1408px]">
                                  {hours.map(hour => (
                                      <div key={hour} className="h-32 border-b border-lumina-highlight/20"></div>
                                  ))}
                                  {dayBookings.map(b => {
                                      if (!b.timeStart) return null;
                                      const [h, m] = b.timeStart.split(':').map(Number);
                                      const top = (h - 9) * 128 + (m / 60) * 128;
                                      const height = b.duration * 128;
                                      const roomColor = rooms.find(r => r.name === b.studio)?.color || 'gray';
                                      
                                      return (
                                          <div 
                                              key={b.id}
                                              onClick={(e) => { e.stopPropagation(); onSelectBooking(b.id); }}
                                              style={{ top: `${top}px`, height: `${Math.max(height - 4, 24)}px` }}
                                              className={`absolute inset-x-1 rounded border-l-4 p-1.5 z-10 cursor-pointer hover:scale-105 transition-transform overflow-hidden border-${roomColor}-500 bg-${roomColor}-500/20 hover:bg-${roomColor}-500/30`}
                                          >
                                              <div className="font-bold text-white text-xs truncate">{b.clientName}</div>
                                              <div className="text-[9px] text-lumina-muted truncate">{b.timeStart} - {b.package}</div>
                                          </div>
                                      );
                                  })}
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      );
  };

  const DayView = () => {
      const hours = Array.from({ length: 11 }, (_, i) => i + 9);
      const todaysBookings = bookings.filter(b => b.date === currentDate && b.status !== 'CANCELLED');

      return (
        <div className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex border-b border-lumina-highlight z-20 bg-lumina-surface relative shadow-sm">
            <div className="w-20 border-r border-lumina-highlight p-4 bg-lumina-base/50"></div>
            {rooms.map(room => (
                <div key={room.id} className="flex-1 p-4 text-center border-r border-lumina-highlight last:border-r-0 bg-lumina-base/30 relative overflow-hidden group">
                <span className="font-display font-bold text-white relative z-10">{room.name}</span>
                <div className={`absolute top-0 right-0 w-8 h-8 opacity-10 rounded-bl-xl bg-${room.color}-500`}></div>
                </div>
            ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-lumina-base/40">
            {/* Current Time Indicator */}
            {currentTimeOffset !== null && (
                <div 
                    className="absolute left-0 right-0 h-[2px] bg-red-500 z-30 pointer-events-none flex items-center"
                    style={{ top: `${currentTimeOffset}px` }}
                >
                    <div className="w-20 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 text-right pr-2">
                        NOW
                    </div>
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                </div>
            )}

            {/* Time Labels Column */}
            <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-lumina-highlight/30 bg-lumina-base/50 z-10">
                {hours.map(hour => (
                    <div key={hour} className="h-32 border-b border-lumina-highlight/30 flex items-start justify-center pt-2">
                    <span className="text-xs font-mono text-lumina-muted">{hour}:00</span>
                    </div>
                ))}
            </div>

            {/* Studio Columns */}
            <div className="absolute inset-0 z-0 ml-20 flex">
                {rooms.map((room) => {
                const studioBookings = todaysBookings.filter(b => b.studio === room.name);
                
                return (
                    <div key={room.id} className="flex-1 relative border-r border-lumina-highlight/30 last:border-r-0 h-[1408px]"> {/* 11 hours * 128px */}
                        
                        {/* Background Clickable Grid */}
                        {hours.map(hour => (
                            <div 
                                key={`slot-${room.id}-${hour}`}
                                onClick={() => onNewBooking({ date: currentDate, time: `${hour}:00`, studio: room.name })}
                                className="h-32 border-b border-lumina-highlight/20 hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <div className="hidden group-hover:flex h-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold text-lumina-muted border border-lumina-muted/50 px-2 py-1 rounded bg-lumina-base">
                                        + Book {hour}:00
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Bookings Layer */}
                        {studioBookings.map(booking => {
                        if (!booking.timeStart) return null;
                        const startHour = parseInt(booking.timeStart.split(':')[0]);
                        const startMinute = parseInt(booking.timeStart.split(':')[1]);
                        
                        const topOffset = (startHour - 9) * 128 + (startMinute/60) * 128; 
                        const height = booking.duration * 128;
                        const isSmall = height < 50; // Threshold for small cards
                        
                        return (
                            <div 
                            key={booking.id}
                            onClick={(e) => { e.stopPropagation(); onSelectBooking(booking.id); }}
                            style={{ top: `${topOffset}px`, height: `${Math.max(height - 4, 24)}px` }} // Min height 24px
                            className={`absolute inset-x-2 rounded-lg border-l-4 shadow-lg cursor-pointer transition-transform hover:scale-[1.02] z-20 overflow-hidden group
                                ${isSmall ? 'p-1.5 flex items-center justify-between' : 'p-3'}
                                ${booking.status === 'SHOOTING' ? 'bg-indigo-900/40 border-indigo-400' : 'bg-lumina-highlight border-lumina-accent'}`}
                            >
                            <div className={`flex justify-between items-start ${isSmall ? 'w-full' : ''}`}>
                                <div className={`font-bold text-white truncate ${isSmall ? 'text-xs flex-1' : 'max-w-[70%]'}`}>{booking.clientName}</div>
                                <span className={`text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-white font-mono ${isSmall ? 'ml-2' : ''}`}>
                                    {booking.timeStart}
                                </span>
                            </div>
                            
                            {!isSmall && (
                                <>
                                    <p className="text-xs text-lumina-muted mt-1">{booking.package}</p>
                                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${booking.status === 'SHOOTING' ? 'bg-indigo-400 animate-pulse' : 'bg-lumina-accent'}`}></div>
                                            <span className="text-[10px] uppercase tracking-wider text-lumina-muted">{booking.status}</span>
                                        </div>
                                        <img 
                                            src={getPhotographerAvatar(booking.photographerId)} 
                                            alt="Photographer" 
                                            className="w-5 h-5 rounded-full border border-lumina-surface opacity-70 group-hover:opacity-100" 
                                            title="Assigned Photographer"
                                        />
                                    </div>
                                </>
                            )}
                            </div>
                        )
                        })}
                    </div>
                )
                })}
            </div>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Studio Schedule</h1>
          <p className="text-lumina-muted">
              {viewMode === 'MONTH' && new Date(currentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewMode === 'WEEK' && `Week of ${new Date(getStartOfWeek(currentDate)).toLocaleDateString()}`}
              {viewMode === 'DAY' && new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Switcher */}
          <div className="bg-lumina-surface border border-lumina-highlight rounded-lg p-1 flex">
              <button onClick={() => setViewMode('DAY')} className={`p-2 rounded ${viewMode === 'DAY' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`} title="Day View">
                  <List size={18} />
              </button>
              <button onClick={() => setViewMode('WEEK')} className={`p-2 rounded ${viewMode === 'WEEK' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`} title="Week View">
                  <CalendarIcon size={18} />
              </button>
              <button onClick={() => setViewMode('MONTH')} className={`p-2 rounded ${viewMode === 'MONTH' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`} title="Month View">
                  <Grid size={18} />
              </button>
          </div>

          <div className="flex items-center bg-lumina-surface rounded-lg p-1 border border-lumina-highlight">
            <button onClick={handlePrev} className="p-2 hover:text-white text-lumina-muted hover:bg-lumina-highlight rounded-md transition-colors"><ChevronLeft size={20} /></button>
            <button 
                onClick={() => onDateChange(new Date().toISOString().split('T')[0])}
                className="px-4 font-mono font-bold text-white min-w-[80px] text-center text-sm hover:text-lumina-accent"
            >
                Today
            </button>
            <button onClick={handleNext} className="p-2 hover:text-white text-lumina-muted hover:bg-lumina-highlight rounded-md transition-colors"><ChevronRight size={20} /></button>
          </div>
          <button 
            onClick={() => onNewBooking({ date: currentDate, time: '10:00', studio: rooms[0]?.name })}
            className="bg-lumina-accent text-lumina-base px-4 py-2 rounded-lg font-bold flex items-center hover:bg-lumina-accent/90"
          >
            <Plus size={18} className="mr-2" />
            NEW BOOKING
          </button>
        </div>
      </div>

      {viewMode === 'DAY' && <DayView />}
      {viewMode === 'WEEK' && <WeekView />}
      {viewMode === 'MONTH' && <MonthView />}
    </div>
  );
};

export default CalendarView;