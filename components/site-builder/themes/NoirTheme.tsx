
import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage, SiteSection, Booking } from '../../../types';
import ScrollReveal from '../ScrollReveal';
import BeforeAfterSlider from '../BeforeAfterSlider';
import BookingWidget from '../BookingWidget';

const Motion = motion as any;

interface ThemeProps {
    site: SiteConfig;
    activePage?: SiteConfig | SitePage; // The data to render
    packages: Package[];
    users: User[];
    config: StudioConfig;
    bookings?: Booking[]; // Add bookings
    onBooking?: (data: PublicBookingSubmission) => void;
    onNavigate?: (pageId: string) => void;
}

const NoirTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate, bookings }) => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 150]);
    
    // Fallback if activePage is not provided (shouldn't happen with new logic)
    const data = activePage || site; 
    const sections = (data as SitePage).sections || [];

    // --- COMPONENT: Hero Section ---
    const renderHero = (headline: string, desc: string, img: string, sub?: string) => (
        <header className="px-4 md:px-6 pt-6 md:pt-10 pb-12 md:pb-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative overflow-hidden min-h-[80vh]">
            <div className="space-y-4 md:space-y-6 z-10 order-2 md:order-1">
                {sub && <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest font-bold">{sub}</p>}
                <Motion.h1 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                    className="text-4xl sm:text-5xl md:text-8xl font-display font-bold leading-[0.95] md:leading-[0.9] tracking-tighter break-words"
                >
                    {headline}
                </Motion.h1>
                <Motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-gray-400 max-w-md text-sm md:text-lg leading-relaxed"
                >
                    {desc}
                </Motion.p>
            </div>
            <div className="aspect-square md:aspect-[4/5] overflow-hidden relative order-1 md:order-2 w-full">
                <Motion.img 
                    style={{ y: y1 }}
                    src={img} className="w-full h-[110%] md:h-[120%] object-cover absolute top-0" 
                />
            </div>
        </header>
    );

    // --- COMPONENT: Text Image Section ---
    const renderTextImage = (headline: string, desc: string, img: string, layout: 'LEFT' | 'RIGHT' | 'CENTER') => (
        <section className="py-20 px-4 md:px-6 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className={`${layout === 'RIGHT' ? 'order-1' : 'order-2'} space-y-6`}>
                    <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">{headline}</h2>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed whitespace-pre-wrap">{desc}</p>
                </div>
                <div className={`${layout === 'RIGHT' ? 'order-2' : 'order-1'} aspect-[3/4] overflow-hidden relative`}>
                    <ScrollReveal>
                        <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );

    // --- COMPONENT: Features Section ---
    const renderFeatures = (headline: string, items: {title: string, text: string}[]) => (
        <section className="py-20 px-4 md:px-6 bg-white text-black">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-12 text-center">{headline}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {items.map((item, idx) => (
                    <div key={idx} className="p-6 border-t border-black">
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );

    // --- COMPONENT: CTA Banner ---
    const renderCTA = (headline: string, buttonText: string) => (
        <section className="py-32 px-4 md:px-6 text-center border-t border-white/10 bg-[#111]">
            <ScrollReveal>
                <h2 className="text-4xl md:text-7xl font-display font-bold mb-8">{headline}</h2>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-gray-300 transition-colors"
                >
                    {buttonText || 'Book Now'}
                </button>
            </ScrollReveal>
        </section>
    );

    // --- COMPONENT: Portfolio Grid ---
    const renderPortfolio = () => (
        <div className="py-12 md:py-20 px-4 md:px-6 border-t border-white/10">
            <h2 className="text-2xl md:text-4xl font-display font-bold mb-8 md:mb-12">Selected Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {(data.gallery || []).length > 0 ? (data.gallery || []).map((img: SiteGalleryItem) => (
                    <ScrollReveal key={img.id}>
                        <div className="group relative overflow-hidden aspect-[3/4]">
                            <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                            <div className="absolute bottom-0 left-0 p-4 md:p-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/80 to-transparent w-full">
                                <p className="text-sm md:text-lg font-bold">{img.caption}</p>
                            </div>
                        </div>
                    </ScrollReveal>
                )) : (
                    <div className="col-span-2 py-20 text-center text-gray-600 italic">Gallery is empty</div>
                )}
            </div>
        </div>
    );

    // --- COMPONENT: Pricing ---
    const renderPricing = (headline: string = "Collections") => (
        <div className="px-4 md:px-6 py-12 md:py-20 bg-white text-black">
            <ScrollReveal>
                <h2 className="text-2xl md:text-4xl font-display font-bold mb-8 md:mb-12">{headline}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {packages.filter((p: any) => p.active).map((pkg: any) => (
                        <div key={pkg.id} className="border-t border-black pt-4">
                            <div className="flex justify-between items-baseline mb-4">
                                <h3 className="font-bold text-lg md:text-xl">{pkg.name}</h3>
                                <span className="font-mono text-sm md:text-base">Rp {(pkg.price/1000000).toFixed(1)}M</span>
                            </div>
                            <ul className="space-y-2 mb-8">
                                {pkg.features.map((f: string, i: number) => (
                                    <li key={i} className="text-xs md:text-sm border-b border-black/10 pb-1">{f}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </ScrollReveal>
        </div>
    );

    // --- RENDER LOOP ---
    const renderSections = () => {
        return sections.map((section: SiteSection) => {
            switch(section.type) {
                case 'HERO':
                    return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.subheadline)}</div>;
                case 'TEXT_IMAGE':
                    return <div key={section.id}>{renderTextImage(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.layout || 'LEFT')}</div>;
                case 'FEATURES':
                    return <div key={section.id}>{renderFeatures(section.content.headline || 'Features', section.content.items || [])}</div>;
                case 'CTA_BANNER':
                    return <div key={section.id}>{renderCTA(section.content.headline || 'Ready?', section.content.buttonText || 'Inquire')}</div>;
                case 'GALLERY':
                    return <div key={section.id}>{renderPortfolio()}</div>;
                case 'PRICING':
                    return <div key={section.id}>{renderPricing(section.content.headline)}</div>;
                case 'TESTIMONIALS':
                    // Reusing existing testimonial block structure if invoked as a section
                    return site.testimonials && site.testimonials.length > 0 && (
                        <div key={section.id} className="py-12 md:py-20 px-4 md:px-6">
                            <h2 className="text-center text-xl md:text-2xl font-display font-bold mb-8 md:mb-12 uppercase tracking-widest">Client Love</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                {site.testimonials.map((t: SiteTestimonial) => (
                                    <div key={t.id} className="p-6 md:p-8 border border-white/10 rounded-2xl bg-white/5">
                                        <p className="text-base md:text-lg italic text-gray-300 mb-4">"{t.text}"</p>
                                        <p className="font-bold text-white text-sm md:text-base">— {t.clientName} ({t.rating}★)</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                case 'FAQ':
                    return site.faq && site.faq.length > 0 && (
                        <div key={section.id} className="px-4 md:px-6 py-12 md:py-20 border-t border-white/10">
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 md:mb-10 text-center">Common Questions</h2>
                                <div className="space-y-6">
                                    {site.faq.map((f: SiteFAQ) => (
                                        <div key={f.id} className="border-b border-white/10 pb-4">
                                            <h4 className="text-base md:text-lg font-bold mb-2 text-white">{f.question}</h4>
                                            <p className="text-sm md:text-base text-gray-400 leading-relaxed">{f.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                default: return null;
            }
        });
    };

    return (
        <div className="bg-[#0a0a0a] text-white font-sans min-h-full selection:bg-white selection:text-black overflow-x-hidden w-full">
            {/* Nav */}
            <nav className="px-4 py-4 md:px-6 md:py-6 flex justify-between items-center mix-blend-difference sticky top-0 z-50 backdrop-blur-md bg-black/30">
                <div className="flex items-center gap-6">
                    <span 
                        onClick={() => onNavigate && onNavigate('HOME')} 
                        className="font-display font-bold text-base md:text-xl tracking-tight truncate max-w-[150px] md:max-w-[200px] cursor-pointer"
                    >
                        {site.title}
                    </span>
                    {/* Desktop Menu */}
                    <div className="hidden md:flex gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                        <button onClick={() => onNavigate && onNavigate('HOME')} className="hover:text-white transition-colors">Home</button>
                        {site.pages?.map(page => (
                            <button 
                                key={page.id} 
                                onClick={() => onNavigate && onNavigate(page.id)}
                                className="hover:text-white transition-colors"
                            >
                                {page.title}
                            </button>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 md:px-6 md:py-2 bg-white text-black text-[10px] md:text-xs font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                    Book
                </button>
            </nav>

            {/* CONTENT RENDERING LOGIC */}
            {sections.length > 0 ? (
                // MODULAR LAYOUT (Long Sales Page)
                <div className="flex flex-col">
                    {renderSections()}
                </div>
            ) : (
                // LEGACY STATIC LAYOUT (Fallback)
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    
                    {/* Before / After (Global) */}
                    {site.beforeAfter?.enabled && site.beforeAfter.beforeImage && (
                        <div className="bg-white text-black py-12 md:py-20">
                            <BeforeAfterSlider 
                                before={site.beforeAfter.beforeImage} 
                                after={site.beforeAfter.afterImage} 
                                label={site.beforeAfter.label} 
                            />
                        </div>
                    )}

                    {data.showPortfolio && renderPortfolio()}
                    {data.showPricing && renderPricing()}
                    
                    {/* Legacy Components Block */}
                    {site.testimonials && site.testimonials.length > 0 && (
                        <div className="py-12 md:py-20 px-4 md:px-6">
                            <h2 className="text-center text-xl md:text-2xl font-display font-bold mb-8 md:mb-12 uppercase tracking-widest">Client Love</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                {site.testimonials.map((t: SiteTestimonial) => (
                                    <div key={t.id} className="p-6 md:p-8 border border-white/10 rounded-2xl bg-white/5">
                                        <p className="text-base md:text-lg italic text-gray-300 mb-4">"{t.text}"</p>
                                        <p className="font-bold text-white text-sm md:text-base">— {t.clientName}</p>
                                        <div className="flex gap-1 text-yellow-500 mt-1 text-xs">
                                            {[...Array(t.rating)].map((_, i) => <span key={i}>★</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {site.faq && site.faq.length > 0 && (
                        <div className="px-4 md:px-6 py-12 md:py-20 border-t border-white/10">
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-display font-bold mb-8 md:mb-10 text-center">Common Questions</h2>
                                <div className="space-y-6">
                                    {site.faq.map((f: SiteFAQ) => (
                                        <div key={f.id} className="border-b border-white/10 pb-4">
                                            <h4 className="text-base md:text-lg font-bold mb-2 text-white">{f.question}</h4>
                                            <p className="text-sm md:text-base text-gray-400 leading-relaxed">{f.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Team (Usually on Home only) */}
            {site.showTeam && (
                <div className="px-4 md:px-6 py-12 md:py-20">
                    <ScrollReveal>
                        <h2 className="text-2xl md:text-4xl font-display font-bold mb-8 md:mb-12">The Artists</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {users.filter((u: any) => u.role === 'PHOTOGRAPHER').map((u: any) => (
                                <div key={u.id} className="group">
                                    <div className="aspect-square overflow-hidden mb-4">
                                        <img src={u.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    </div>
                                    <p className="font-bold text-sm">{u.name}</p>
                                    <p className="text-[10px] md:text-xs text-gray-500 uppercase">{u.specialization || 'Photographer'}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            )}

            {/* Booking Widget */}
            {data.showBookingWidget && (
                <div className="py-12 border-t border-white/10" id="booking-widget">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">Reserve Your Session</h2>
                        <p className="text-gray-400 text-sm">Select a package below to start your booking.</p>
                    </div>
                    <BookingWidget packages={packages} theme="NOIR" onSubmit={onBooking} pixels={site.pixels} bookings={bookings} />
                </div>
            )}

            <footer className="px-4 md:px-6 py-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-0">
                <div>
                    <p className="text-xl md:text-2xl font-display font-bold mb-4">{site.title}</p>
                    <p className="text-gray-500 text-sm">{config.address}</p>
                    <p className="text-gray-500 text-sm">{config.phone}</p>
                </div>
                <p className="text-xs text-gray-700 uppercase">Powered by Lumina</p>
            </footer>
        </div>
    )
}

export default NoirTheme;
