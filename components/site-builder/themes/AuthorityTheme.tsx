
import React from 'react';
import { motion } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage, SiteSection, Booking } from '../../../types';
import BookingWidget from '../BookingWidget';
import { ShieldCheck, Star, ArrowDown, CheckCircle, Award, Lock } from 'lucide-react';

const Motion = motion as any;

interface ThemeProps {
    site: SiteConfig;
    activePage?: SiteConfig | SitePage;
    packages: Package[];
    users: User[];
    config: StudioConfig;
    bookings?: Booking[];
    onBooking?: (data: PublicBookingSubmission) => void;
    onNavigate?: (pageId: string) => void;
}

const AuthorityTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate, bookings }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    const renderHero = (headline: string, desc: string, img: string, sub?: string) => (
        <header className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f0f0f] text-white">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img src={img} className="w-full h-full object-cover opacity-30 grayscale" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] via-transparent to-[#0f0f0f]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
                {sub && (
                    <Motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 border border-amber-600/50 bg-amber-900/10 px-4 py-1.5 rounded-full mb-8"
                    >
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{sub}</span>
                    </Motion.div>
                )}
                <Motion.h1 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-4xl md:text-7xl font-serif font-medium leading-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400"
                >
                    {headline}
                </Motion.h1>
                <Motion.div 
                    initial={{ width: 0 }} animate={{ width: '100px' }} transition={{ delay: 0.8, duration: 0.8 }}
                    className="h-1 bg-amber-600 mb-8"
                />
                <Motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className="text-lg md:text-2xl text-gray-300 font-light leading-relaxed mb-10 max-w-2xl"
                >
                    {desc}
                </Motion.p>
                <div className="flex flex-col md:flex-row gap-4">
                    <button 
                        onClick={() => {
                            const widget = document.getElementById('booking-widget');
                            if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-sm uppercase tracking-widest hover:from-amber-500 hover:to-amber-400 transition-all shadow-[0_0_30px_-5px_rgba(217,119,6,0.4)] rounded-sm"
                    >
                        Start Your Application
                    </button>
                    <button className="px-8 py-4 border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-colors rounded-sm">
                        View Portfolio
                    </button>
                </div>
            </div>
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-600">
                <ArrowDown size={20} />
            </div>
        </header>
    );

    const renderTextImage = (headline: string, desc: string, img: string, layout: 'LEFT' | 'RIGHT' | 'CENTER') => (
        <section className="py-24 px-6 bg-[#141414] text-white">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className={`relative ${layout === 'RIGHT' ? 'md:order-2' : 'md:order-1'}`}>
                    <div className="absolute -inset-4 border border-amber-600/20 z-0"></div>
                    <img src={img} className="w-full h-auto relative z-10 grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl" />
                </div>
                <div className={`${layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                    <h2 className="text-3xl md:text-5xl font-serif mb-8 text-white">{headline}</h2>
                    <div className="space-y-6 text-gray-400 text-lg leading-relaxed font-light font-sans">
                        <p className="whitespace-pre-wrap">{desc}</p>
                    </div>
                </div>
            </div>
        </section>
    );

    const renderFeatures = (headline: string, items: {title: string, text: string}[]) => (
        <section className="py-24 px-6 bg-[#0f0f0f] text-white">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-serif text-center mb-16">
                    <span className="border-b border-amber-600 pb-4">{headline}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {items.map((item, idx) => (
                        <div key={idx} className="bg-[#1a1a1a] p-8 border-t-2 border-amber-600/50 hover:border-amber-500 transition-colors group">
                            <div className="mb-6 text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Award size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-wide">{item.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderPricing = (headline: string) => (
        <section className="py-24 px-6 bg-[#141414] text-white relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"></div>
            
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-serif text-center mb-6">{headline}</h2>
                <p className="text-center text-gray-500 mb-16 max-w-2xl mx-auto uppercase tracking-widest text-xs">Investment Options</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {packages.filter((p: any) => p.active).map((pkg: any, i: number) => (
                        <div key={pkg.id} className={`relative p-8 border flex flex-col ${i === 1 ? 'bg-[#1a1a1a] border-amber-600/50 shadow-[0_0_40px_-10px_rgba(217,119,6,0.1)] scale-105 z-10' : 'bg-transparent border-white/10 hover:border-white/20'}`}>
                            {i === 1 && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-600 text-black px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                                    Recommended
                                </div>
                            )}
                            <div className="mb-8 text-center">
                                <h3 className="text-xl font-serif italic mb-2 text-gray-300">{pkg.name}</h3>
                                <p className="text-3xl font-bold text-white">Rp {(pkg.price/1000000).toFixed(1)}M</p>
                            </div>
                            <ul className="flex-1 space-y-4 mb-10">
                                {pkg.features.map((f: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-400">
                                        <CheckCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => {
                                    const widget = document.getElementById('booking-widget');
                                    if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`w-full py-4 font-bold uppercase tracking-widest text-xs transition-all ${i === 1 ? 'bg-white text-black hover:bg-gray-200' : 'border border-white/20 text-white hover:bg-white/5'}`}
                            >
                                Select Package
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderFAQ = (headline: string, items: SiteFAQ[]) => (
        <section className="py-24 px-6 bg-[#0f0f0f] text-white">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-serif text-center mb-12">{headline || "Common Inquiries"}</h2>
                <div className="space-y-6">
                    {items.map(item => (
                        <div key={item.id} className="border-b border-white/10 pb-6">
                            <h3 className="text-lg font-bold text-amber-500 mb-3">{item.question}</h3>
                            <p className="text-gray-400 leading-relaxed font-light">{item.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderCTA = (headline: string, buttonText: string) => (
        <section className="py-32 px-6 bg-[#1a1a1a] text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-serif mb-8">{headline}</h2>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-10 py-5 bg-amber-600 text-black font-bold text-sm uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl rounded-sm"
                >
                    {buttonText}
                </button>
                <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Lock size={12} /> Limited Availability for {new Date().getFullYear()}
                </p>
            </div>
        </section>
    );

    // --- RENDERER ---
    const renderSections = () => {
        return sections.map((section: SiteSection) => {
            switch(section.type) {
                case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.subheadline)}</div>;
                case 'TEXT_IMAGE': return <div key={section.id}>{renderTextImage(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.layout || 'LEFT')}</div>;
                case 'FEATURES': return <div key={section.id}>{renderFeatures(section.content.headline || 'Excellence', section.content.items || [])}</div>;
                case 'PRICING': return <div key={section.id}>{renderPricing(section.content.headline || 'Investment')}</div>;
                case 'FAQ': return <div key={section.id}>{renderFAQ(section.content.headline || 'FAQ', site.faq)}</div>;
                case 'CTA_BANNER': return <div key={section.id}>{renderCTA(section.content.headline || 'Ready to begin?', section.content.buttonText || 'Inquire Now')}</div>;
                case 'GALLERY': return <div key={section.id}></div>; // Reusing portfolio section logic below
                default: return null;
            }
        });
    };

    return (
        <div className="bg-[#0f0f0f] text-white font-sans min-h-full overflow-x-hidden selection:bg-amber-600 selection:text-black">
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
                <span onClick={() => onNavigate && onNavigate('HOME')} className="font-serif text-xl tracking-widest cursor-pointer">{site.title}</span>
                <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <button onClick={() => onNavigate && onNavigate('HOME')} className="hover:text-amber-500 transition-colors">Home</button>
                    {site.pages?.map(page => (
                        <button key={page.id} onClick={() => onNavigate && onNavigate(page.id)} className="hover:text-amber-500 transition-colors">{page.title}</button>
                    ))}
                </div>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="border border-amber-600 text-amber-600 px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-amber-600 hover:text-black transition-all"
                >
                    Reserve
                </button>
            </nav>

            <div className="pt-20">
                {sections.length > 0 ? renderSections() : (
                    <>
                        {renderHero(data.headline, data.description, data.heroImage)}
                        {data.showPortfolio && (
                            <section className="py-24 px-6 bg-[#141414]">
                                <div className="max-w-7xl mx-auto">
                                    <h2 className="text-3xl font-serif text-center mb-12">Selected Works</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {site.gallery.map((img: SiteGalleryItem) => (
                                            <div key={img.id} className="group relative overflow-hidden aspect-[4/3]">
                                                <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                                                <div className="absolute bottom-6 left-6">
                                                    <p className="text-white font-serif text-xl italic">{img.caption}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                        {data.showPricing && renderPricing("Investment")}
                    </>
                )}

                {data.showBookingWidget && (
                    <div className="py-24 px-6 bg-[#0f0f0f] border-t border-white/10" id="booking-widget">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-12">
                                <span className="text-amber-600 text-xs uppercase tracking-[0.2em] font-bold block mb-2">Availability</span>
                                <h2 className="text-3xl md:text-4xl font-serif text-white">Secure Your Session</h2>
                            </div>
                            <BookingWidget packages={packages} theme="AUTHORITY" onSubmit={onBooking} pixels={site.pixels} bookings={bookings} />
                        </div>
                    </div>
                )}
            </div>

            <footer className="bg-black py-12 px-6 border-t border-white/10 text-center">
                <h2 className="text-2xl font-serif text-white mb-6">{site.title}</h2>
                <p className="text-xs text-gray-600 uppercase tracking-widest">&copy; {new Date().getFullYear()} All rights reserved.</p>
            </footer>
        </div>
    )
}

export default AuthorityTheme;
