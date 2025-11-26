
import React from 'react';
import { motion } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, SiteTestimonial, SiteFAQ, StudioConfig, PublicBookingSubmission, SitePage } from '../../../types';
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

const EtherealTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate }) => {
    // Prioritize activePage, fallback to site (Global)
    const data = activePage || site;

    return (
        <div className="bg-[#fcfaf7] text-[#4a4a4a] font-serif min-h-full overflow-x-hidden w-full">
            <nav className="p-4 md:p-8 sticky top-0 bg-[#fcfaf7]/90 backdrop-blur-sm z-50 transition-all border-b border-[#eaeaea] md:border-none flex flex-col md:flex-row justify-between items-center">
                <span 
                    onClick={() => onNavigate && onNavigate('HOME')}
                    className="font-serif text-base md:text-2xl tracking-widest uppercase border-b border-black pb-1 md:pb-2 inline-block cursor-pointer"
                >
                    {site.title}
                </span>
                <div className="hidden md:flex gap-8 text-[10px] uppercase tracking-widest text-[#8a8a8a] mt-4 md:mt-0">
                    <button onClick={() => onNavigate && onNavigate('HOME')} className="hover:text-black transition-colors">Home</button>
                    {site.pages?.map(page => (
                        <button 
                            key={page.id} 
                            onClick={() => onNavigate && onNavigate(page.id)}
                            className="hover:text-black transition-colors"
                        >
                            {page.title}
                        </button>
                    ))}
                </div>
            </nav>

            {/* NOTE: Ethereal currently only supports standard layout, 
                but we ensure it correctly displays the 'data' from the active page 
                (Headline, Hero, etc) instead of always showing Home data. */}
            <header className="px-4 md:px-8 py-8 md:py-12 text-center max-w-3xl mx-auto">
                <Motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-[10px] md:text-xs uppercase tracking-[0.3em] mb-4 md:mb-6 text-[#8a8a8a]"
                >
                    Est. 2023
                </Motion.p>
                <Motion.h1 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-4xl md:text-7xl italic font-light mb-6 md:mb-8 leading-tight break-words hyphens-auto"
                >
                    {data.headline}
                </Motion.h1>
                <Motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 1 }}
                    className="w-full h-[250px] md:h-[500px] overflow-hidden rounded-t-[3rem] md:rounded-t-full mx-auto mt-8 md:mt-12 shadow-xl"
                >
                    <img src={data.heroImage} className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s]" />
                </Motion.div>
            </header>

            {site.beforeAfter?.enabled && site.beforeAfter.beforeImage && (
                <div className="py-8 md:py-20 bg-white">
                    <BeforeAfterSlider 
                        before={site.beforeAfter.beforeImage} 
                        after={site.beforeAfter.afterImage} 
                        label={site.beforeAfter.label} 
                    />
                </div>
            )}

            {data.showPortfolio && (
                <div className="px-4 md:px-8 py-12 md:py-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {(data.gallery || []).map((img: SiteGalleryItem, i: number) => (
                            <ScrollReveal key={img.id} delay={i * 0.1}>
                                <div className="space-y-3 md:space-y-4">
                                    <div className="aspect-[2/3] overflow-hidden rounded-sm">
                                        <img src={img.url} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                                    </div>
                                    <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#8a8a8a] text-center">{img.caption}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            )}

            {data.showPricing && (
                <div className="bg-white py-16 md:py-24 px-4 md:px-8">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-4xl font-light text-center mb-12 md:mb-16 italic">Investment</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {packages.filter((p: any) => p.active).map((pkg: any) => (
                                <div key={pkg.id} className="text-center space-y-4 group cursor-pointer">
                                    <h3 className="text-lg md:text-xl uppercase tracking-widest">{pkg.name}</h3>
                                    <div className="w-8 h-px bg-black mx-auto group-hover:w-16 transition-all duration-500"></div>
                                    <p className="text-[#8a8a8a] text-sm leading-loose min-h-[80px]">
                                        {pkg.features.slice(0, 3).join(' • ')}
                                    </p>
                                    <p className="text-lg font-medium">Rp {(pkg.price/1000000).toFixed(1)}M</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {data.showBookingWidget && (
                <div className="py-16 md:py-24 bg-[#fcfaf7] border-t border-[#eaeaea]" id="booking-widget">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-light italic mb-4">Begin Your Story</h2>
                        <p className="text-xs uppercase tracking-widest text-[#8a8a8a]">Select a date below</p>
                    </div>
                    <BookingWidget packages={packages} theme="ETHEREAL" onSubmit={onBooking} />
                </div>
            )}

            <footer className="py-12 md:py-16 text-center text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#8a8a8a]">
                <p className="mb-4">{config.address} • {config.phone}</p>
                <p>&copy; {new Date().getFullYear()} {site.title}</p>
            </footer>
        </div>
    )
}

export default EtherealTheme;
