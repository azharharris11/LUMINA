
import React, { useEffect, useState } from 'react';
import { Booking, User, StudioRoom } from '../types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarViewProps {
  bookings: Booking[];
  currentDate: string;
  users: User[];
  rooms: StudioRoom[]; // Dynamic rooms
  onDateChange: (date: string) => void;
  onNewBooking: (prefill?: { date: string, time: string, studio: string }) => void;
  onSelectBooking: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, currentDate, users, rooms, onDateChange, onNewBooking, onSelectBooking }) => {
  const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 09:00 to 19:00
  const [currentTimeOffset, setCurrentTimeOffset] = useState<number | null>(null);

  // Update current time line position
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Only show line if viewing today
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
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentDate]);

  const handlePrevDay = () => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      onDateChange(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + 1);
      onDateChange(date.toISOString().split('T')[0]);
  };

  // Filter bookings for the currently selected date AND exclude cancelled ones
  const todaysBookings = bookings.filter(b => b.date === currentDate && b.status !== 'CANCELLED');

  const getPhotographerAvatar = (id: string) => {
      return users.find(u => u.id === id)?.avatar || `https://ui-avatars.com/api/?name=${id}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Studio Schedule</h1>
          <p className="text-lumina-muted">Check availability and manage bookings.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-lumina-surface rounded-lg p-1 border border-lumina-highlight">
            <button onClick={handlePrevDay} className="p-2 hover:text-white text-lumina-muted hover:bg-lumina-highlight rounded-md transition-colors"><ChevronLeft size={20} /></button>
            <span className="px-4 font-mono font-bold text-white min-w-[140px] text-center">
                {new Date(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button onClick={handleNextDay} className="p-2 hover:text-white text-lumina-muted hover:bg-lumina-highlight rounded-md transition-colors"><ChevronRight size={20} /></button>
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
    </div>
  );
};

export default CalendarView;
