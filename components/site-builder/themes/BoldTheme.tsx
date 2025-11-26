
import React from 'react';
import { motion } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage, SiteSection, Booking } from '../../../types';
import BeforeAfterSlider from '../BeforeAfterSlider';
import BookingWidget from '../BookingWidget';

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

const BoldTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate, bookings }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    // --- SECTIONS RENDERERS ---
    const renderHero = (headline: string, desc: string, img: string, sub?: string) => (
        <header className="min-h-[80vh] md:min-h-[90vh] flex flex-col md:flex-row border-b-4 border-black">
            <div className="w-full md:w-1/2 border-b-4 md:border-b-0 md:border-r-4 border-black p-8 md:p-16 flex flex-col justify-center bg-[#f0f0f0] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent"></div>
                {sub && <p className="font-black uppercase tracking-widest mb-4 bg-black text-white w-fit px-2 z-10">{sub}</p>}
                <Motion.h1 
                    initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className="text-5xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase mb-6 md:mb-8 z-10 break-words"
                >
                    {headline}
                </Motion.h1>
                <p className="text-base md:text-xl font-bold max-w-md z-10 bg-white p-3 md:p-4 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    {desc}
                </p>
            </div>
            <div className="w-full md:w-1/2 relative group h-[400px] md:h-auto">
                <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                <div className="absolute inset-0 bg-[#bef264] mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
        </header>
    );

    const renderTextImage = (headline: string, desc: string, img: string, layout: 'LEFT' | 'RIGHT' | 'CENTER') => (
        <section className="border-b-4 border-black flex flex-col md:flex-row">
            <div className={`w-full md:w-1/2 aspect-square md:aspect-auto border-b-4 md:border-b-0 ${layout === 'RIGHT' ? 'md:order-2 md:border-l-4' : 'md:order-1 md:border-r-4'} border-black relative overflow-hidden group`}>
                <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                <div className="absolute inset-0 bg-[#bef264]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className={`w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white ${layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 leading-none">{headline}</h2>
                <div className="text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap border-l-4 border-[#bef264] pl-4">
                    {desc}
                </div>
            </div>
        </section>
    );

    const renderFeatures = (headline: string, items: {title: string, text: string}[]) => (
        <section className="py-16 md:py-24 px-4 md:px-6 border-b-4 border-black bg-[#bef264]">
            <h2 className="text-4xl md:text-7xl font-black uppercase text-center mb-12 tracking-tighter">{headline}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                        <h3 className="text-xl font-black uppercase mb-3 bg-black text-white w-fit px-2">{item.title}</h3>
                        <p className="font-bold text-sm md:text-base">{item.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );

    const renderCTA = (headline: string, buttonText: string) => (
        <section className="py-20 md:py-32 px-6 text-center bg-black text-white border-b-4 border-black">
            <h2 className="text-5xl md:text-8xl font-black uppercase mb-10 text-[#bef264]">{headline}</h2>
            <button 
                onClick={() => {
                    const widget = document.getElementById('booking-widget');
                    if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 md:px-12 md:py-6 bg-white text-black text-xl md:text-2xl font-black uppercase hover:bg-[#bef264] transition-colors border-4 border-white hover:border-[#bef264]"
            >
                {buttonText || 'Take Action'}
            </button>
        </section>
    );

    const renderPortfolio = () => (
        <section className="p-4 md:p-8 border-b-4 border-black">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {(data.gallery || []).map((img: SiteGalleryItem, i: number) => (
                    <div key={img.id} className={`relative border-4 border-black group ${i === 1 ? 'md:col-span-2 md:row-span-2' : ''} shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all`}>
                        <img src={img.url} className="w-full h-full object-cover aspect-square" />
                        <div className="absolute bottom-0 left-0 bg-black text-white px-3 py-1 md:px-4 md:py-2 font-bold uppercase text-sm md:text-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {img.caption || 'Project'}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );

    const renderPricing = (headline: string = "Pricing") => (
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#f0f0f0] border-b-4 border-black">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-center mb-12 md:mb-16 underline decoration-[#bef264] decoration-8 underline-offset-4">{headline}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {packages.filter((p: any) => p.active).map((pkg: any, i: number) => (
                    <div key={pkg.id} className={`bg-white border-4 border-black p-6 md:p-8 flex flex-col relative ${i === 1 ? 'transform md:-translate-y-8 z-10 shadow-[8px_8px_0_0_#bef264] md:shadow-[12px_12px_0_0_#bef264]' : 'shadow-[6px_6px_0_0_black] md:shadow-[8px_8px_0_0_black]'}`}>
                        {i === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-[#bef264] px-4 py-1 font-black uppercase text-xs md:text-sm border-2 border-[#bef264]">Best Value</div>}
                        <h3 className="text-2xl md:text-3xl font-black uppercase mb-2">{pkg.name}</h3>
                        <p className="text-lg md:text-xl font-bold mb-6 bg-black text-white w-fit px-2">Rp {(pkg.price/1000).toFixed(0)}K</p>
                        <ul className="flex-1 space-y-3 mb-8">
                            {pkg.features.map((f: string, idx: number) => (
                                <li key={idx} className="font-bold flex items-start gap-2 text-sm">
                                    <span className="text-[#bef264] text-lg">■</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );

    // --- RENDERER ---
    const renderSections = () => {
        return sections.map((section: SiteSection) => {
            switch(section.type) {
                case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.subheadline)}</div>;
                case 'TEXT_IMAGE': return <div key={section.id}>{renderTextImage(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.layout || 'LEFT')}</div>;
                case 'FEATURES': return <div key={section.id}>{renderFeatures(section.content.headline || 'Features', section.content.items || [])}</div>;
                case 'CTA_BANNER': return <div key={section.id}>{renderCTA(section.content.headline || 'Ready?', section.content.buttonText || 'Inquire')}</div>;
                case 'GALLERY': return <div key={section.id}>{renderPortfolio()}</div>;
                case 'PRICING': return <div key={section.id}>{renderPricing(section.content.headline)}</div>;
                default: return null;
            }
        });
    };

    return (
        <div className="bg-white text-black font-sans min-h-full border-[8px] md:border-[16px] border-black overflow-x-hidden selection:bg-[#bef264] selection:text-black">
            <nav className="p-4 md:p-6 flex justify-between items-center border-b-4 border-black sticky top-0 bg-white z-50">
                <div className="flex items-center gap-4 md:gap-8">
                    <span 
                        onClick={() => onNavigate && onNavigate('HOME')}
                        className="text-lg md:text-2xl font-black tracking-tighter uppercase italic hover:text-[#bef264] transition-colors cursor-pointer truncate max-w-[150px]"
                    >
                        {site.title}
                    </span>
                    <div className="hidden md:flex gap-4 text-xs font-black uppercase">
                        <button onClick={() => onNavigate && onNavigate('HOME')} className="hover:underline decoration-2 decoration-[#bef264]">Home</button>
                        {site.pages?.map(page => (
                            <button key={page.id} onClick={() => onNavigate && onNavigate(page.id)} className="hover:underline decoration-2 decoration-[#bef264]">{page.title}</button>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-black text-white px-4 py-1.5 md:px-6 md:py-2 text-xs md:text-base font-bold uppercase hover:bg-[#bef264] hover:text-black transition-colors border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                    Book Now
                </button>
            </nav>

            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    {/* Scrolling Marquee (Legacy) */}
                    <div className="bg-[#bef264] border-b-4 border-black py-2 md:py-4 overflow-hidden">
                        <Motion.div 
                            animate={{ x: ["0%", "-50%"] }} 
                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            className="whitespace-nowrap text-2xl md:text-4xl font-black uppercase italic"
                        >
                            Don't Just Exist • Make An Impact • {site.title} • Visuals That Speak • Don't Just Exist • Make An Impact • {site.title} • Visuals That Speak •
                        </Motion.div>
                    </div>
                    {site.beforeAfter?.enabled && site.beforeAfter.beforeImage && (
                        <div className="border-b-4 border-black p-6 md:p-16 bg-black">
                            <div className="bg-white border-4 border-[#bef264] p-1 md:p-2">
                                <BeforeAfterSlider before={site.beforeAfter.beforeImage} after={site.beforeAfter.afterImage} label={site.beforeAfter.label} />
                            </div>
                        </div>
                    )}
                    {data.showPortfolio && renderPortfolio()}
                    {data.showPricing && renderPricing()}
                </>
            )}

            {data.showBookingWidget && (
                <div className="p-6 md:p-12 border-b-4 border-black bg-white" id="booking-widget">
                    <h2 className="text-4xl md:text-6xl font-black uppercase text-center mb-8">MAKE IT HAPPEN</h2>
                    <BookingWidget packages={packages} theme="BOLD" onSubmit={onBooking} pixels={site.pixels} bookings={bookings} />
                </div>
            )}

            <footer className="bg-black text-white p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-center md:text-left">{site.title}</h2>
                    <div className="flex gap-4">
                        <a href="#" className="bg-[#bef264] text-black w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-bold text-lg md:text-xl hover:rotate-12 transition-transform">IG</a>
                        <a href="#" className="bg-white text-black w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-bold text-lg md:text-xl hover:-rotate-12 transition-transform">TW</a>
                    </div>
                </div>
                <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-white/20 text-center font-mono text-[10px] md:text-xs text-[#bef264]">
                    LUMINA.STUDIO.SYSTEMS v2.0
                </div>
            </footer>
        </div>
    )
}

export default BoldTheme;
