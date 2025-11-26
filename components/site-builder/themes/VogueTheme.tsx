
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage, SiteSection } from '../../../types';
import BeforeAfterSlider from '../BeforeAfterSlider';
import BookingWidget from '../BookingWidget';

const Motion = motion as any;

interface ThemeProps {
    site: SiteConfig;
    activePage?: SiteConfig | SitePage;
    packages: Package[];
    users: User[];
    config: StudioConfig;
    onBooking?: (data: PublicBookingSubmission) => void;
    onNavigate?: (pageId: string) => void;
}

const VogueTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    const renderHero = (headline: string, desc: string, img: string) => (
        <div className="grid grid-cols-1 md:grid-cols-2 border-b-4 border-black">
            <div className="p-6 md:p-12 flex flex-col justify-center border-b-4 md:border-b-0 md:border-r-4 border-black bg-[#ffff00]">
                <Motion.h1 
                    initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                    className="text-5xl md:text-8xl font-black uppercase leading-none mb-6 break-words hyphens-auto"
                >
                    {headline}
                </Motion.h1>
                <p className="font-bold text-sm md:text-xl border-l-4 border-black pl-4">{desc}</p>
            </div>
            <div className="aspect-square relative">
                <img src={img} className="w-full h-full object-cover absolute inset-0 grayscale contrast-125" />
                <Motion.div 
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="absolute bottom-4 right-4 bg-white border-4 border-black p-2 md:p-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs md:text-base"
                >
                    BOOK NOW
                </Motion.div>
            </div>
        </div>
    );

    const renderSections = () => sections.map((section: SiteSection) => {
        switch(section.type) {
            case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '')}</div>;
            case 'TEXT_IMAGE': return (
                <div key={section.id} className="grid grid-cols-1 md:grid-cols-2 border-b-4 border-black">
                    <div className={`aspect-square border-black overflow-hidden relative border-b-4 md:border-b-0 ${section.content.layout === 'RIGHT' ? 'md:order-2 md:border-l-4' : 'md:order-1 md:border-r-4'}`}>
                        <img src={section.content.image} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                    </div>
                    <div className={`p-8 flex flex-col justify-center ${section.content.layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                        <h2 className="text-4xl font-black uppercase mb-4 leading-none">{section.content.headline}</h2>
                        <p className="font-bold text-lg border-l-4 border-[#ff3333] pl-4">{section.content.description}</p>
                    </div>
                </div>
            );
            case 'FEATURES': return (
                <div key={section.id} className="p-8 border-b-4 border-black bg-[#ff3333]">
                    <h2 className="text-4xl font-black uppercase mb-8 text-white">{section.content.headline}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(section.content.items || []).map((item, i) => (
                            <div key={i} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_black]">
                                <h3 className="font-black uppercase mb-2">{item.title}</h3>
                                <p className="text-sm font-bold">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
            // Add other section renderers as needed, reusing patterns
            default: return null;
        }
    });

    return (
        <div className="bg-white text-black font-sans min-h-full border-[8px] md:border-[12px] border-[#ff3333] overflow-x-hidden">
            <nav className="p-4 border-b-4 border-black flex justify-between items-center font-bold uppercase tracking-tighter text-sm md:text-xl sticky top-0 bg-white z-50">
                <span className="truncate max-w-[150px] cursor-pointer" onClick={() => onNavigate && onNavigate('HOME')}>{site.title}</span>
                <div className="flex gap-4">
                    <span onClick={() => onNavigate && onNavigate('HOME')} className="cursor-pointer hover:bg-[#ffff00] px-1">Home</span>
                    {site.pages?.map(p => (
                        <span key={p.id} onClick={() => onNavigate && onNavigate(p.id)} className="cursor-pointer hover:bg-[#ffff00] px-1">{p.title}</span>
                    ))}
                </div>
            </nav>

            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    <div className="border-b-4 border-black bg-black text-white py-2 md:py-4 overflow-hidden whitespace-nowrap">
                        <Motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="inline-block text-xl md:text-4xl font-black uppercase tracking-wider">
                            New Season • Booking Open • {site.title} • Photography • Art Direction • New Season • Booking Open • {site.title} •
                        </Motion.div>
                    </div>
                    {data.showPortfolio && (
                        <div className="grid grid-cols-1 md:grid-cols-2 border-b-4 border-black">
                            {site.gallery.map((img: SiteGalleryItem, i: number) => (
                                <div key={img.id} className={`aspect-square border-black overflow-hidden relative group ${i % 2 === 0 ? 'md:border-r-4' : ''} border-b-4 md:border-b-0 ${i >= site.gallery.length - 2 ? 'md:border-b-0' : 'md:border-b-4'} ${i === site.gallery.length - 1 ? 'border-b-0' : ''}`}>
                                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-[#ff3333] mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none md:pointer-events-auto">
                                        <span className="text-white font-black text-xl md:text-2xl uppercase -rotate-6 bg-black px-4 py-1">{img.caption}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {data.showBookingWidget && (
                <div className="p-6 md:p-12 border-t-4 border-black bg-white" id="booking-widget">
                    <h2 className="text-3xl md:text-6xl font-black uppercase text-center mb-8">MAKE IT HAPPEN</h2>
                    <BookingWidget packages={packages} theme="VOGUE" onSubmit={onBooking} />
                </div>
            )}
        </div>
    )
}

export default VogueTheme;
