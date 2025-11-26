
import React from 'react';
import { motion } from 'framer-motion';
import { Aperture, Check, ArrowRight, X, TrendingUp, Shield, Zap, Layout, Lock } from 'lucide-react';

const Motion = motion as any;

interface LandingPageViewProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPageView: React.FC<LandingPageViewProps> = ({ onLogin, onRegister }) => {
  
  const renderPainPoint = (text: string) => (
      <div className="flex items-start gap-3 text-gray-400">
          <div className="min-w-[24px] pt-1"><X size={20} className="text-rose-500" /></div>
          <p className="text-lg">{text}</p>
      </div>
  );

  const renderBenefit = (title: string, desc: string) => (
      <div className="bg-lumina-surface border border-lumina-highlight p-6 rounded-2xl hover:border-lumina-accent/50 transition-colors">
          <div className="w-10 h-10 bg-lumina-accent/10 rounded-lg flex items-center justify-center text-lumina-accent mb-4">
              <Check size={20} />
          </div>
          <h3 className="text-xl font-display font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lumina-accent selection:text-black overflow-x-hidden">
      
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <Aperture className="text-lumina-accent w-8 h-8" />
                  <span className="font-display font-bold text-2xl tracking-tight">LUMINA</span>
              </div>
              <div className="flex gap-4">
                  <button onClick={onLogin} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">LOG IN</button>
                  <button onClick={onRegister} className="bg-white text-black px-5 py-2 rounded-lg font-bold text-sm hover:bg-lumina-accent transition-colors">
                      GET ACCESS
                  </button>
              </div>
          </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-40 pb-20 px-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-lumina-accent/20 blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
          
          <Motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="max-w-5xl mx-auto relative z-10"
          >
              <div className="inline-block border border-lumina-accent/30 bg-lumina-accent/10 px-4 py-1.5 rounded-full mb-8">
                  <span className="text-lumina-accent text-xs font-bold uppercase tracking-widest">For High-Performance Studios Only</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-display font-bold uppercase leading-[0.9] tracking-tighter mb-8">
                  Stop Running Your <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-white to-gray-500">Studio Like A Hobby.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
                  You didn't pick up a camera to become a <span className="text-white font-bold">part-time accountant</span>. 
                  Lumina handles the chaos so you can focus on the craft.
              </p>
              
              <button 
                onClick={onRegister}
                className="group relative inline-flex items-center justify-center px-8 py-5 text-lg font-bold text-black transition-all duration-200 bg-lumina-accent font-display uppercase tracking-wider rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumina-accent hover:bg-white"
              >
                  Start Your Free Trial
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute -inset-3 rounded-xl bg-lumina-accent/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
              <p className="mt-4 text-xs text-gray-500 uppercase tracking-widest font-bold">No Credit Card Required • Cancel Anytime</p>
          </Motion.div>

          {/* Dashboard Preview */}
          <Motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 max-w-6xl mx-auto relative"
          >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20 h-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop" 
                alt="Dashboard Interface" 
                className="rounded-xl border border-white/10 shadow-2xl opacity-80"
              />
              {/* Floating Badges */}
              <div className="absolute top-10 -right-10 bg-lumina-surface border border-lumina-highlight p-4 rounded-xl shadow-2xl hidden md:block z-30 animate-bounce delay-700">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><TrendingUp size={20}/></div>
                      <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Revenue (Mo)</p>
                          <p className="text-xl font-mono font-bold text-white">Rp 150.0M</p>
                      </div>
                  </div>
              </div>
          </Motion.div>
      </header>

      {/* THE PROBLEM */}
      <section className="py-24 bg-[#0a0a0a] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                  <h2 className="text-4xl md:text-5xl font-display font-bold uppercase leading-none mb-8 text-rose-500">
                      The "Artist's Trap"
                  </h2>
                  <p className="text-xl text-white font-bold mb-6">
                      You are worth <span className="text-lumina-accent">Rp 1.000.000/hour</span> behind the camera.
                  </p>
                  <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                      So why are you spending 20 hours a week doing <span className="text-white underline decoration-rose-500 decoration-2">Rp 50.000/hour admin work?</span> Chasing invoices via WhatsApp? digging through emails for contracts? Double-booking dates?
                  </p>
                  <div className="space-y-4">
                      {renderPainPoint("Manually sending invoice PDF reminders.")}
                      {renderPainPoint("Losing track of equipment check-outs.")}
                      {renderPainPoint("Guessing your monthly profit & loss.")}
                      {renderPainPoint("Looking unprofessional to high-ticket clients.")}
                  </div>
              </div>
              <div className="bg-lumina-surface p-8 rounded-3xl border border-white/5 relative">
                  <div className="absolute -top-10 -right-10 text-9xl font-black text-white/5 select-none">CHAOS</div>
                  <h3 className="text-2xl font-bold text-white mb-6">The Old Way (Amateur)</h3>
                  <div className="space-y-3 font-mono text-sm text-gray-500">
                      <div className="p-3 bg-black/50 rounded border border-white/5 flex justify-between">
                          <span>Spreadsheet_Final_v2.xls</span>
                          <span className="text-rose-500">Corrupt</span>
                      </div>
                      <div className="p-3 bg-black/50 rounded border border-white/5 flex justify-between">
                          <span>WhatsApp Chat (Client)</span>
                          <span className="text-amber-500">Unread (3d)</span>
                      </div>
                      <div className="p-3 bg-black/50 rounded border border-white/5 flex justify-between">
                          <span>Google Calendar</span>
                          <span className="text-rose-500">Conflict</span>
                      </div>
                      <div className="p-3 bg-black/50 rounded border border-white/5 flex justify-between">
                          <span>Bank Mutasi</span>
                          <span className="text-gray-600">Unknown Trx</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* THE SOLUTION (VALUE STACK) */}
      <section className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                  <h2 className="text-4xl md:text-6xl font-display font-bold uppercase mb-6">
                      The Operating System <br/> For <span className="text-lumina-accent">Scale</span>
                  </h2>
                  <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                      Lumina isn't just a "tool". It's a digital studio manager that works 24/7, never sleeps, and never forgets to send an invoice.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderBenefit("Automated Financials", "Stop playing guessing games. Track every Rupiah. Automated P&L, Cash Flow, and Expense tracking linked directly to bookings.")}
                  {renderBenefit("Smart Scheduling", "Availability engine that prevents conflicts. Manage multiple studios, equipment rosters, and staff schedules in one view.")}
                  {renderBenefit("High-Converting Sites", "Build a portfolio website that actually sells. Integrated Booking Widget means clients pay you while you sleep.")}
                  {renderBenefit("CRM & Pipeline", "Treat clients like VIPs. Track lifetime value, notes, and preferences. Never ask 'what's your name again?'")}
                  {renderBenefit("Production Workflow", "Kanban board for your post-production. Move jobs from Shoot -> Edit -> Review -> Delivered without friction.")}
                  {renderBenefit("Asset Management", "Know exactly where every lens and camera body is. Check-in/Check-out system included.")}
              </div>
          </div>
      </section>

      {/* THE OFFER / PRICING */}
      <section className="py-24 bg-lumina-surface border-y border-white/10">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-5xl font-display font-bold uppercase mb-8">
                  It Costs Less Than <br/> One Missed Booking.
              </h2>
              
              <div className="bg-black border border-lumina-accent p-10 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-lumina-accent text-black text-xs font-bold px-4 py-2 uppercase tracking-widest">
                      Early Access
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                      <div className="text-left">
                          <p className="text-gray-400 uppercase tracking-widest font-bold text-sm mb-2">Lumina Pro</p>
                          <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-bold text-white">Rp 299k</span>
                              <span className="text-gray-500">/ month</span>
                          </div>
                          <p className="text-gray-400 mt-4 text-sm max-w-xs">
                              Includes everything. Unlimited Bookings. Unlimited Staff. No hidden fees.
                          </p>
                      </div>
                      
                      <div className="w-full md:w-auto">
                          <div className="space-y-3 mb-8 text-left">
                              <div className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-lumina-accent"/> <span>Full Financial Suite</span></div>
                              <div className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-lumina-accent"/> <span>Website Builder + Hosting</span></div>
                              <div className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-lumina-accent"/> <span>Unlimited Client CRM</span></div>
                              <div className="flex items-center gap-2 text-sm text-gray-300"><Check size={16} className="text-lumina-accent"/> <span>WhatsApp Automation</span></div>
                          </div>
                          <button 
                            onClick={onRegister}
                            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-lumina-accent transition-colors shadow-lg shadow-white/10"
                          >
                              Start Free Trial
                          </button>
                      </div>
                  </div>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-gray-500 uppercase font-bold tracking-widest">
                  <span className="flex items-center gap-2"><Shield size={14}/> 30-Day Money Back Guarantee</span>
                  <span className="flex items-center gap-2"><Lock size={14}/> SSL Secure Payment</span>
                  <span className="flex items-center gap-2"><Zap size={14}/> Setup in 5 Minutes</span>
              </div>
          </div>
      </section>

      {/* FINAL CTA */}
      <footer className="py-24 text-center px-6">
          <h2 className="text-4xl md:text-7xl font-display font-bold uppercase mb-8 opacity-20">
              Lumina
          </h2>
          <p className="text-xl text-white font-bold mb-8">
              Ready to build your empire?
          </p>
          <button 
            onClick={onRegister}
            className="bg-lumina-accent text-black px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
              Let's Do This
          </button>
          <div className="mt-16 border-t border-white/10 pt-8 text-xs text-gray-600">
              © {new Date().getFullYear()} Lumina Studio Systems. All rights reserved.
          </div>
      </footer>
    </div>
  );
};

export default LandingPageView;
