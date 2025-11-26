
import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage, SiteSection } from '../../../types';
import ScrollReveal from '../ScrollReveal';
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

const HorizonTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate }) => {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scale = useTransform(scrollY, [0, 300], [1, 1.1]);
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    const renderHero = (headline: string, desc: string, img: string, sub?: string) => (
        <div className="h-screen w-full relative flex items-center justify-center overflow-hidden">
            <Motion.div style={{ scale }} className="absolute inset-0 z-0">
                <img src={img} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/30 via-transparent to-[#0f172a]"></div>
            </Motion.div>
            
            <Motion.div style={{ opacity }} className="relative z-10 text-center px-6 max-w-4xl mt-10">
                {sub && <p className="text-blue-400 uppercase tracking-[0.3em] text-xs md:text-sm font-bold mb-4">{sub}</p>}
                <h1 className="text-4xl md:text-8xl font-bold uppercase tracking-tighter mb-4 md:mb-6 drop-shadow-2xl break-words">
                    {headline}
                </h1>
                <p className="text-base md:text-xl font-light tracking-wide text-blue-100/80 mb-8 md:mb-10 leading-relaxed">
                    {desc}
                </p>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 md:px-8 md:py-4 bg-white text-[#0f172a] font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] text-sm md:text-base"
                >
                    Start Your Journey
                </button>
            </Motion.div>
            <div className="absolute bottom-8 animate-bounce text-white/50 text-xs uppercase tracking-widest">Scroll</div>
        </div>
    );

    const renderTextImage = (headline: string, desc: string, img: string, layout: 'LEFT' | 'RIGHT' | 'CENTER') => (
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={`rounded-2xl overflow-hidden relative h-[400px] md:h-[600px] ${layout === 'RIGHT' ? 'md:order-2' : 'md:order-1'}`}>
                <img src={img} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent opacity-50"></div>
            </div>
            <div className={`${layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">{headline}</h2>
                <p className="text-slate-300 text-base md:text-lg leading-loose font-light">{desc}</p>
            </div>
        </section>
    );

    const renderFeatures = (headline: string, items: {title: string, text: string}[]) => (
        <section className="py-20 px-6 md:px-12 bg-[#1e293b]/50">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">{headline}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {items.map((item, idx) => (
                        <div key={idx} className="p-8 rounded-2xl bg-[#0f172a] border border-slate-700 hover:border-blue-500 transition-colors">
                            <h3 className="text-xl font-bold mb-3 text-blue-400">{item.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderPricing = (headline: string = "Expeditions") => (
        <section className="py-16 md:py-24 px-6 md:px-12">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center">{headline}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.filter((p: any) => p.active).map((pkg: any) => (
                        <ScrollReveal key={pkg.id}>
                            <div className="bg-[#1e293b] rounded-2xl p-6 md:p-8 hover:-translate-y-2 transition-transform duration-300 border border-[#334155] flex flex-col h-full">
                                <h3 className="text-xl md:text-2xl font-bold mb-2 text-blue-400">{pkg.name}</h3>
                                <p className="text-slate-400 text-xs md:text-sm mb-6">{pkg.duration} Hours Session</p>
                                <div className="flex-1 space-y-3 mb-8">
                                    {pkg.features.map((f: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-[#334155] flex justify-between items-center">
                                    <span className="text-lg md:text-xl font-bold">Rp {(pkg.price/1000).toFixed(0)}k</span>
                                    <button className="text-xs md:text-sm font-bold text-blue-400 hover:text-blue-300">Book Now →</button>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );

    // --- RENDERER ---
    const renderSections = () => {
        return sections.map((section: SiteSection) => {
            switch(section.type) {
                case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.subheadline)}</div>;
                case 'TEXT_IMAGE': return <div key={section.id}>{renderTextImage(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.layout || 'LEFT')}</div>;
                case 'FEATURES': return <div key={section.id}>{renderFeatures(section.content.headline || 'Key Features', section.content.items || [])}</div>;
                case 'PRICING': return <div key={section.id}>{renderPricing(section.content.headline)}</div>;
                // Reuse existing portfolio logic for GALLERY type
                case 'GALLERY': return <div key={section.id}></div>; 
                default: return null;
            }
        });
    };

    return (
        <div className="bg-[#0f172a] text-white font-sans min-h-full overflow-x-hidden">
            {/* Navigation */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <span onClick={() => onNavigate && onNavigate('HOME')} className="font-bold text-xl tracking-widest cursor-pointer">{site.title}</span>
                <div className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-blue-200">
                    <button onClick={() => onNavigate && onNavigate('HOME')} className="hover:text-white transition-colors">Home</button>
                    {site.pages?.map(page => (
                        <button key={page.id} onClick={() => onNavigate && onNavigate(page.id)} className="hover:text-white transition-colors">{page.title}</button>
                    ))}
                </div>
            </nav>

            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    
                    {data.showPortfolio && (
                        <section className="py-0 space-y-0">
                            {site.gallery.map((img: SiteGalleryItem, index: number) => (
                                <div key={img.id} className="relative w-full h-[50vh] md:h-[80vh] group overflow-hidden">
                                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-end p-6 md:p-16">
                                        <div className="transform translate-y-4 md:translate-y-10 opacity-100 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500">
                                            <span className="text-[10px] md:text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded mb-2 inline-block">0{index + 1}</span>
                                            <h3 className="text-2xl md:text-3xl font-bold">{img.caption || 'Untitled Series'}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}
                    
                    {data.showPricing && renderPricing()}
                </>
            )}

            {data.showBookingWidget && (
                <div className="py-24 px-6 bg-[#0f172a]" id="booking-widget">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Plan Your Expedition</h2>
                        <BookingWidget packages={packages} theme="HORIZON" onSubmit={onBooking} />
                    </div>
                </div>
            )}

            <footer className="bg-[#0f172a] py-12 border-t border-[#1e293b] text-center">
                <h2 className="text-xl font-bold mb-6">{site.title}</h2>
                <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()}. Built with Lumina.</p>
            </footer>
        </div>
    )
}

export default HorizonTheme;
