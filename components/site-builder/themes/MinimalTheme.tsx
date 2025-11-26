
import React from 'react';
import { motion } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage, SiteSection } from '../../../types';
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

const MinimalTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    const renderHero = (headline: string, desc: string, img: string) => (
        <header className="px-4 md:px-6 py-12 md:py-32 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24">
            <div className="flex flex-col justify-between order-2 md:order-1">
                <Motion.h1 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="text-3xl md:text-6xl font-medium leading-tight mb-4 md:mb-8 break-words"
                >
                    {headline}
                </Motion.h1>
                <div className="space-y-6">
                    <p className="text-gray-500 text-sm md:text-base max-w-md leading-relaxed">{desc}</p>
                    <button onClick={() => {
                        const w = document.getElementById('booking-widget');
                        if(w) w.scrollIntoView({behavior:'smooth'});
                    }} className="text-xs font-bold border-b border-black pb-1 hover:opacity-50 transition-opacity w-fit">DISCOVER MORE</button>
                </div>
            </div>
            <Motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
                className="aspect-[4/5] overflow-hidden bg-gray-100 order-1 md:order-2"
            >
                <img src={img} className="w-full h-full object-cover" />
            </Motion.div>
        </header>
    );

    const renderSections = () => sections.map((section: SiteSection) => {
        switch(section.type) {
            case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '')}</div>;
            case 'TEXT_IMAGE': return (
                <section key={section.id} className="py-20 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className={`bg-gray-50 aspect-[4/5] ${section.content.layout === 'RIGHT' ? 'md:order-2' : 'md:order-1'}`}>
                        <img src={section.content.image} className="w-full h-full object-cover" />
                    </div>
                    <div className={`${section.content.layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                        <h2 className="text-2xl font-medium mb-6">{section.content.headline}</h2>
                        <p className="text-gray-500 leading-relaxed text-sm">{section.content.description}</p>
                    </div>
                </section>
            );
            case 'PRICING': return (
                <div key={section.id} className="px-4 md:px-6 py-12 md:py-20 bg-gray-50">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-sm font-bold mb-8 md:mb-12 uppercase tracking-wider text-gray-400">{section.content.headline || 'Services'}</h2>
                        <div className="space-y-6 md:space-y-8">
                            {packages.filter((p: any) => p.active).map((pkg: any) => (
                                <div key={pkg.id} className="flex flex-col md:flex-row justify-between md:items-baseline border-b border-gray-200 pb-4 gap-2 md:gap-0">
                                    <h3 className="text-lg md:text-xl font-medium w-full md:w-1/3">{pkg.name}</h3>
                                    <p className="text-xs md:text-sm text-gray-500 w-full md:w-1/3">{pkg.features.slice(0, 3).join(', ')}</p>
                                    <span className="text-base md:text-lg w-full md:w-1/3 text-left md:text-right font-mono">Rp {pkg.price.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    });

    return (
        <div className="bg-white text-[#1a1a1a] font-sans min-h-full tracking-tight overflow-x-hidden">
            <nav className="px-4 md:px-6 py-6 flex justify-between items-start sticky top-0 bg-white/90 backdrop-blur-sm z-50 border-b border-gray-100">
                <span className="font-bold text-sm tracking-tighter truncate max-w-[150px] cursor-pointer" onClick={() => onNavigate && onNavigate('HOME')}>{site.title}</span>
                <div className="hidden md:flex gap-6 text-xs font-medium text-gray-500">
                    <span onClick={() => onNavigate && onNavigate('HOME')} className="cursor-pointer hover:text-black">Home</span>
                    {site.pages?.map(p => (
                        <span key={p.id} onClick={() => onNavigate && onNavigate(p.id)} className="cursor-pointer hover:text-black">{p.title}</span>
                    ))}
                </div>
            </nav>

            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    {data.showPortfolio && (
                        <div className="px-4 md:px-6 py-12 md:py-20">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-y-12">
                                {site.gallery.map((img: SiteGalleryItem) => (
                                    <div key={img.id} className="space-y-2">
                                        <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                                            <img src={img.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{img.caption}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {data.showBookingWidget && (
                <div className="py-20 px-4 bg-white border-t border-gray-100" id="booking-widget">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-medium mb-2">Reservation</h2>
                    </div>
                    <BookingWidget packages={packages} theme="MINIMAL" onSubmit={onBooking} />
                </div>
            )}

            <footer className="px-4 md:px-6 py-8 md:py-12 flex justify-between items-end border-t border-gray-100">
                <div><p className="text-sm font-bold mb-1">{site.title}</p><p className="text-xs text-gray-400">All rights reserved.</p></div>
            </footer>
        </div>
    )
}

export default MinimalTheme;
