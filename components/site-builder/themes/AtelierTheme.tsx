
import React from 'react';
import { motion } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage, SiteSection } from '../../../types';
import ScrollReveal from '../ScrollReveal';
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

const AtelierTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    const renderHero = (headline: string, desc: string, img: string, sub?: string) => (
        <header className="px-6 py-12 md:py-24 max-w-5xl mx-auto text-center">
            {sub && <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] mb-4 text-[#888]">{sub}</p>}
            <Motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}
                className="text-4xl md:text-7xl font-medium leading-tight mb-6 md:mb-8"
            >
                {headline}
            </Motion.h1>
            <p className="text-base md:text-xl text-[#666] max-w-2xl mx-auto font-light leading-relaxed mb-8 md:mb-12">
                {desc}
            </p>
            <div className="relative p-2 md:p-4 bg-white shadow-xl rotate-1 max-w-xs md:max-w-md mx-auto">
                <div className="aspect-[4/5] overflow-hidden bg-[#eee]">
                    <img src={img} className="w-full h-full object-cover" alt="Hero" />
                </div>
            </div>
        </header>
    );

    const renderTextImage = (headline: string, desc: string, img: string, layout: 'LEFT' | 'RIGHT' | 'CENTER') => (
        <section className="py-16 md:py-24 px-6 md:px-12 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24">
            <div className={`w-full md:w-1/2 ${layout === 'RIGHT' ? 'md:order-2' : 'md:order-1'}`}>
                <div className="aspect-[3/4] bg-white p-3 shadow-lg">
                    <img src={img} className="w-full h-full object-cover" />
                </div>
            </div>
            <div className={`w-full md:w-1/2 text-center md:text-left ${layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                <h2 className="text-3xl md:text-4xl font-serif italic mb-6">{headline}</h2>
                <p className="text-[#666] leading-loose font-light text-sm md:text-base">{desc}</p>
            </div>
        </section>
    );

    const renderFeatures = (headline: string, items: {title: string, text: string}[]) => (
        <section className="py-16 md:py-24 px-6 bg-white">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">{headline}</h2>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                {items.map((item, idx) => (
                    <div key={idx} className="space-y-3">
                        <span className="text-4xl font-serif italic text-[#d4c5b5]">{idx + 1}</span>
                        <h3 className="text-lg font-medium uppercase tracking-widest text-xs">{item.title}</h3>
                        <p className="text-[#888] text-sm leading-relaxed">{item.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );

    const renderPricing = (headline: string) => (
        <section className="py-16 md:py-24 px-6 bg-[#f5f0eb]">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12 md:mb-16">
                    <span className="text-xs uppercase tracking-[0.2em] text-[#888] block mb-3">Investment</span>
                    <h2 className="text-3xl md:text-4xl font-serif">{headline || 'Collections'}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {packages.filter((p: any) => p.active).map((pkg: any) => (
                        <div key={pkg.id} className="bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow border-t-4 border-[#d4c5b5] text-center">
                            <h3 className="text-lg md:text-xl font-serif mb-4">{pkg.name}</h3>
                            <p className="text-2xl md:text-3xl font-light mb-6 text-[#2c2c2c]">
                                <span className="text-xs md:text-sm align-top">Rp</span> 
                                {(pkg.price / 1000000).toFixed(1)}M
                            </p>
                            <div className="w-8 h-px bg-[#ddd] mx-auto mb-6"></div>
                            <ul className="space-y-3 text-xs md:text-sm text-[#666] mb-8 leading-loose">
                                {pkg.features.map((f: string, i: number) => <li key={i}>{f}</li>)}
                            </ul>
                            <button className="w-full py-3 border border-[#2c2c2c] text-[#2c2c2c] text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#2c2c2c] hover:text-white transition-colors">Inquire</button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderSections = () => sections.map((section: SiteSection) => {
        switch(section.type) {
            case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.subheadline)}</div>;
            case 'TEXT_IMAGE': return <div key={section.id}>{renderTextImage(section.content.headline || '', section.content.description || '', section.content.image || '', section.content.layout || 'LEFT')}</div>;
            case 'FEATURES': return <div key={section.id}>{renderFeatures(section.content.headline || 'Features', section.content.items || [])}</div>;
            case 'PRICING': return <div key={section.id}>{renderPricing(section.content.headline || 'Investment')}</div>;
            default: return null;
        }
    });

    return (
        <div className="bg-[#f5f0eb] text-[#2c2c2c] font-serif min-h-full selection:bg-[#d4c5b5] selection:text-white overflow-x-hidden">
            <nav className="flex flex-col items-center py-8 md:py-12 border-b border-[#d4c5b5]/30">
                <span className="text-[10px] md:text-sm uppercase tracking-[0.3em] mb-2 md:mb-4">Est. 2024</span>
                <span onClick={() => onNavigate && onNavigate('HOME')} className="text-2xl md:text-4xl font-serif tracking-tight text-center cursor-pointer">{site.title}</span>
                <div className="mt-6 md:mt-8 flex gap-6 md:gap-8 text-[10px] md:text-xs uppercase tracking-widest text-[#666]">
                    <span onClick={() => onNavigate && onNavigate('HOME')} className="hover:text-black cursor-pointer transition-colors">Home</span>
                    {site.pages?.map(p => (
                        <span key={p.id} onClick={() => onNavigate && onNavigate(p.id)} className="hover:text-black cursor-pointer transition-colors">{p.title}</span>
                    ))}
                </div>
            </nav>

            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    {site.beforeAfter?.enabled && site.beforeAfter.beforeImage && (
                        <div className="py-8 md:py-20 bg-white">
                            <BeforeAfterSlider before={site.beforeAfter.beforeImage} after={site.beforeAfter.afterImage} label={site.beforeAfter.label} />
                        </div>
                    )}
                    {data.showPortfolio && (
                        <section className="py-16 md:py-20 px-4 md:px-12 bg-white">
                            <div className="text-center mb-12 md:mb-16">
                                <h2 className="text-xl md:text-2xl italic mb-2">Selected Works</h2>
                                <div className="w-12 h-px bg-black mx-auto"></div>
                            </div>
                            <div className="columns-1 md:columns-2 gap-8 space-y-8 max-w-6xl mx-auto">
                                {site.gallery.map((img: SiteGalleryItem) => (
                                    <ScrollReveal key={img.id}>
                                        <div className="break-inside-avoid space-y-3 group">
                                            <div className="overflow-hidden relative">
                                                <img src={img.url} className="w-full object-cover hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                                            </div>
                                            {img.caption && <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#888] text-center">{img.caption}</p>}
                                        </div>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </section>
                    )}
                    {data.showPricing && renderPricing('Collections')}
                </>
            )}

            {data.showBookingWidget && (
                <div className="py-16 px-6 bg-white border-t border-[#d4c5b5]/30" id="booking-widget">
                    <div className="text-center mb-12">
                        <span className="text-xs uppercase tracking-[0.2em] text-[#888] block mb-3">Availability</span>
                        <h2 className="text-2xl md:text-3xl font-serif">Secure Your Date</h2>
                    </div>
                    <BookingWidget packages={packages} theme="ATELIER" onSubmit={onBooking} />
                </div>
            )}

            <footer className="py-12 text-center text-[10px] md:text-xs uppercase tracking-widest text-[#888] border-t border-[#d4c5b5]/30">
                <p>&copy; {new Date().getFullYear()} {site.title}.</p>
            </footer>
        </div>
    )
}

export default AtelierTheme;
