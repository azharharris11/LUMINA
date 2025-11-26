
import React from 'react';
import { motion } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, StudioConfig, PublicBookingSubmission, SitePage, SiteSection, Booking } from '../../../types';
import BookingWidget from '../BookingWidget';
import { CheckCircle2, AlertTriangle, Lock, ArrowDown } from 'lucide-react';

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

const ImpactTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate, bookings }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    // Helper for "Highlighter" effect
    const highlightText = (text: string) => {
        // Very basic split logic to highlight standard words if needed, or just render bold
        return <span className="bg-[#ffff00] text-black px-1">{text}</span>;
    };

    const renderHero = (headline: string, desc: string, img: string, sub?: string) => (
        <header className="bg-white text-black pb-8 md:pb-12">
            {/* Eyebrow / Warning Bar */}
            <div className="bg-[#dc2626] text-white p-2 md:p-3 text-center font-bold text-sm md:text-base uppercase tracking-wide flex items-center justify-center gap-2">
                <AlertTriangle size={18} fill="white" className="text-[#dc2626]" />
                <span>Warning: {sub || "High Demand - Limited Slots"}</span>
            </div>

            <div className="max-w-[600px] mx-auto px-4 pt-8 md:pt-12 text-center">
                <h1 className="text-4xl md:text-6xl font-black uppercase leading-[1.1] mb-6 tracking-tight">
                    {headline}
                </h1>
                <div className="w-full h-1 bg-black mb-6"></div>
                <p className="text-lg md:text-xl font-medium leading-relaxed mb-8 text-gray-800">
                    {desc}
                </p>
                
                {/* Mobile-friendly Video/Image container */}
                <div className="mb-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-gray-200 aspect-video relative overflow-hidden">
                    <img src={img} className="w-full h-full object-cover" alt="Hero" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-[#dc2626] rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-4 bg-[#22c55e] text-white text-xl md:text-2xl font-black uppercase rounded-lg border-b-4 border-[#15803d] hover:bg-[#16a34a] hover:translate-y-[2px] active:border-b-0 active:translate-y-[4px] transition-all shadow-xl mb-4"
                >
                    Yes! I Want To Book Now
                </button>
                <p className="text-xs text-gray-500 uppercase font-bold">No Credit Card Required To Check Availability</p>
            </div>
        </header>
    );

    const renderTextImage = (headline: string, desc: string, img: string, layout: 'LEFT' | 'RIGHT' | 'CENTER') => (
        <section className="py-12 px-4 bg-[#f9fafb]">
            <div className="max-w-[600px] mx-auto">
                <h2 className="text-2xl md:text-4xl font-black uppercase mb-6 leading-tight text-center">
                    {headline}
                </h2>
                
                <div className="flex flex-col gap-6">
                    {/* Force Image Top on Mobile, adhere to layout on desktop if wanted, but single column is best for impact */}
                    <div className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <img src={img} className="w-full h-auto" alt="Content" />
                    </div>
                    
                    <div className="prose prose-lg text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                        {desc}
                    </div>
                </div>
            </div>
        </section>
    );

    const renderFeatures = (headline: string, items: {title: string, text: string}[]) => (
        <section className="py-12 px-4 bg-white">
            <div className="max-w-[600px] mx-auto border-4 border-black p-6 md:p-8 bg-[#fffbeb] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl md:text-3xl font-black uppercase text-center mb-8 underline decoration-[#dc2626] decoration-4 underline-offset-4">
                    {headline}
                </h2>
                <div className="space-y-6">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                            <CheckCircle2 size={28} className="text-[#22c55e] shrink-0 fill-white" strokeWidth={3} />
                            <div>
                                <h3 className="font-black text-lg uppercase mb-1">{item.title}</h3>
                                <p className="text-sm md:text-base font-medium text-gray-700 leading-snug">{item.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderPricing = (headline: string) => (
        <section className="py-12 px-4 bg-[#111] text-white">
            <div className="max-w-[600px] mx-auto">
                <h2 className="text-3xl md:text-5xl font-black uppercase text-center mb-2 text-[#ffff00]">
                    {headline || "The Offer"}
                </h2>
                <p className="text-center text-gray-400 mb-10 uppercase font-bold tracking-widest text-sm">
                    Choose Your Weapon
                </p>

                <div className="space-y-6">
                    {packages.filter((p: any) => p.active).map((pkg: any, idx: number) => (
                        <div key={pkg.id} className={`relative bg-white text-black p-6 rounded-xl border-4 ${idx === 1 ? 'border-[#ffff00] scale-105 z-10' : 'border-gray-500'}`}>
                            {idx === 1 && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ffff00] text-black px-4 py-1 font-black uppercase text-sm border-2 border-black shadow-sm">
                                    Most Popular
                                </div>
                            )}
                            <div className="flex justify-between items-end mb-4 border-b-2 border-gray-200 pb-4">
                                <h3 className="text-xl font-black uppercase">{pkg.name}</h3>
                                <div className="text-right">
                                    <span className="text-sm text-gray-500 line-through block font-bold">Rp {(pkg.price * 1.5 / 1000000).toFixed(1)}M</span>
                                    <span className="text-2xl font-black text-[#dc2626]">Rp {(pkg.price / 1000000).toFixed(1)}M</span>
                                </div>
                            </div>
                            <ul className="space-y-2 mb-6">
                                {pkg.features.map((f: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-bold">
                                        <span className="text-[#22c55e]">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => {
                                    const widget = document.getElementById('booking-widget');
                                    if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full py-3 bg-black text-white font-black uppercase text-lg rounded hover:bg-gray-800 transition-colors"
                            >
                                Select This
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderCTA = (headline: string, buttonText: string) => (
        <section className="py-16 px-4 bg-[#ffff00] border-y-4 border-black text-center">
            <div className="max-w-[600px] mx-auto">
                <h2 className="text-3xl md:text-5xl font-black uppercase mb-6 text-black leading-none">
                    {headline}
                </h2>
                <ArrowDown size={48} className="mx-auto mb-6 animate-bounce text-black" strokeWidth={3} />
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-5 bg-[#dc2626] text-white text-2xl font-black uppercase rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_black] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_black] active:translate-y-[8px] active:shadow-none transition-all"
                >
                    {buttonText}
                </button>
            </div>
        </section>
    );

    // --- RENDER LOOP ---
    const renderSections = () => {
        return sections.map((section: SiteSection) => {
            switch(section.type) {
                case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.subheadline)}</div>;
                case 'TEXT_IMAGE': return <div key={section.id}>{renderTextImage(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.layout || 'LEFT')}</div>;
                case 'FEATURES': return <div key={section.id}>{renderFeatures(section.content.headline || 'Features', section.content.items || [])}</div>;
                case 'PRICING': return <div key={section.id}>{renderPricing(section.content.headline || 'Packages')}</div>;
                case 'CTA_BANNER': return <div key={section.id}>{renderCTA(section.content.headline || 'Ready?', section.content.buttonText || 'Get Started')}</div>;
                case 'FAQ': return site.faq && site.faq.length > 0 && (
                    <section key={section.id} className="py-12 px-4 bg-white">
                        <div className="max-w-[600px] mx-auto">
                            <h2 className="text-3xl font-black uppercase text-center mb-8">FAQ</h2>
                            <div className="space-y-4">
                                {site.faq.map(f => (
                                    <div key={f.id} className="border-2 border-black p-4 bg-gray-50">
                                        <h4 className="font-black text-lg mb-2">Q: {f.question}</h4>
                                        <p className="text-gray-700 font-medium">A: {f.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );
                default: return null;
            }
        });
    };

    return (
        <div className="bg-white text-black font-sans min-h-full overflow-x-hidden selection:bg-[#ffff00]">
            {/* Simple Nav */}
            <nav className="p-4 border-b-4 border-black flex justify-between items-center sticky top-0 bg-white z-50">
                <span className="font-black text-xl uppercase tracking-tighter">{site.title}</span>
                {/* Basic Page Links */}
                <div className="hidden md:flex gap-4 font-bold text-sm uppercase">
                    <span onClick={() => onNavigate && onNavigate('HOME')} className="cursor-pointer hover:bg-[#ffff00] px-1">Home</span>
                    {site.pages?.map(p => (
                        <span key={p.id} onClick={() => onNavigate && onNavigate(p.id)} className="cursor-pointer hover:bg-[#ffff00] px-1">{p.title}</span>
                    ))}
                </div>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-[#dc2626] text-white px-4 py-2 font-black uppercase text-sm hover:bg-red-700 transition-colors"
                >
                    Book Now
                </button>
            </nav>

            {/* Main Content */}
            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    {data.showPricing && renderPricing("Our Packages")}
                </>
            )}

            {data.showBookingWidget && (
                <div className="py-12 px-4 bg-gray-100 border-t-4 border-black" id="booking-widget">
                    <div className="max-w-[600px] mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black uppercase mb-2">Secure Your Slot</h2>
                            <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-300 shadow-sm">
                                <Lock size={14} className="text-[#22c55e]"/>
                                <span className="text-xs font-bold text-gray-600">SSL Secure Encryption</span>
                            </div>
                        </div>
                        <BookingWidget packages={packages} theme="IMPACT" onSubmit={onBooking} pixels={site.pixels} bookings={bookings} />
                    </div>
                </div>
            )}

            <footer className="py-8 text-center bg-black text-white text-sm font-bold uppercase">
                <p>{site.title} © {new Date().getFullYear()}</p>
                <p className="text-gray-500 text-xs mt-1">Results may vary. Terms apply.</p>
            </footer>
        </div>
    );
}

export default ImpactTheme;
