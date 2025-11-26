
import React from 'react';
import { motion } from 'framer-motion';
import { SiteConfig, Package, User, SiteGalleryItem, StudioConfig, PublicBookingSubmission, SitePage, SiteSection, SiteFAQ } from '../../../types';
import BookingWidget from '../BookingWidget';
import { ShieldCheck, Check, Star, HelpCircle, ArrowRight, Lock } from 'lucide-react';

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

const CleanSlateTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    // --- RENDERERS ---

    const renderHero = (headline: string, desc: string, img: string, sub?: string) => (
        <section className="px-6 pt-12 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="flex flex-col justify-center md:pr-12">
                {sub && (
                    <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6 w-fit">
                        <Star size={12} className="text-amber-400 fill-amber-400"/> {sub}
                    </div>
                )}
                <Motion.h1 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6"
                >
                    {headline}
                </Motion.h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    {desc}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => {
                            const widget = document.getElementById('booking-widget');
                            if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02]"
                    >
                        Check Availability
                    </button>
                    <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <span>100% Satisfaction Guarantee</span>
                    </div>
                </div>
            </div>
            <Motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
                className="relative"
            >
                <div className="absolute inset-0 bg-indigo-600/5 rounded-3xl transform rotate-3 scale-105"></div>
                <img src={img} className="relative z-10 rounded-3xl shadow-2xl w-full h-auto object-cover aspect-[4/5]" alt="Hero" />
            </Motion.div>
        </section>
    );

    const renderTextImage = (headline: string, desc: string, img: string, layout: 'LEFT' | 'RIGHT' | 'CENTER') => (
        <section className="py-20 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
                {layout === 'CENTER' ? (
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">{headline}</h2>
                        <div className="my-8 rounded-2xl overflow-hidden shadow-xl">
                            <img src={img} className="w-full h-auto" alt="Content" />
                        </div>
                        <p className="text-lg text-slate-600 leading-relaxed">{desc}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className={`rounded-2xl overflow-hidden shadow-xl ${layout === 'RIGHT' ? 'md:order-2' : 'md:order-1'}`}>
                            <img src={img} className="w-full h-full object-cover aspect-square" alt="Content" />
                        </div>
                        <div className={`${layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">{headline}</h2>
                            <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">{desc}</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );

    const renderFeatures = (headline: string, items: {title: string, text: string}[]) => (
        <section className="py-24 px-6 bg-slate-50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{headline}</h2>
                    <p className="text-slate-500">Everything you need for a perfect session.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {items.map((item, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                                <Check size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderPricing = (headline: string) => (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16">{headline || "Simple Pricing"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {packages.filter((p: any) => p.active).map((pkg: any, i: number) => (
                        <div key={pkg.id} className={`relative p-8 rounded-3xl border flex flex-col h-full ${i === 1 ? 'border-indigo-200 bg-slate-50 shadow-xl' : 'border-slate-200 bg-white shadow-sm'}`}>
                            {i === 1 && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                                <p className="text-slate-500 text-sm mt-1">{pkg.duration} Hour Session</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-bold text-slate-900">Rp {(pkg.price/1000).toFixed(0)}k</span>
                            </div>
                            <div className="flex-1 space-y-4 mb-8">
                                {pkg.features.map((f: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                                        <Check size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    const widget = document.getElementById('booking-widget');
                                    if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`w-full py-3 rounded-xl font-bold transition-colors ${i === 1 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                            >
                                Choose Plan
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderFAQ = (headline: string, items: SiteFAQ[]) => (
        <section className="py-20 px-6 bg-slate-50">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">{headline || "Frequently Asked Questions"}</h2>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                                <HelpCircle size={18} className="text-indigo-500"/> {item.question}
                            </h3>
                            <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const renderCTA = (headline: string, buttonText: string) => (
        <section className="py-24 px-6 bg-indigo-900 text-white text-center">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-8">{headline}</h2>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-10 py-4 bg-white text-indigo-900 text-lg font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-xl"
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
                case 'PRICING': return <div key={section.id}>{renderPricing(section.content.headline || 'Pricing')}</div>;
                case 'FAQ': return <div key={section.id}>{renderFAQ(section.content.headline || 'FAQ', site.faq)}</div>; // Using global FAQ for now
                case 'CTA_BANNER': return <div key={section.id}>{renderCTA(section.content.headline || 'Ready?', section.content.buttonText || 'Book Now')}</div>;
                case 'GALLERY': 
                    return (
                        <section key={section.id} className="py-20 px-6 bg-white">
                            <h2 className="text-3xl font-bold text-center mb-12">Gallery</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                                {site.gallery.map(img => (
                                    <div key={img.id} className="rounded-xl overflow-hidden aspect-square shadow-md">
                                        <img src={img.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                default: return null;
            }
        });
    };

    return (
        <div className="bg-white text-slate-900 font-sans min-h-full overflow-x-hidden">
            <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex justify-between items-center">
                <span onClick={() => onNavigate && onNavigate('HOME')} className="font-bold text-xl tracking-tight cursor-pointer text-slate-900">{site.title}</span>
                <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
                    <button onClick={() => onNavigate && onNavigate('HOME')} className="hover:text-indigo-600 transition-colors">Home</button>
                    {site.pages?.map(page => (
                        <button key={page.id} onClick={() => onNavigate && onNavigate(page.id)} className="hover:text-indigo-600 transition-colors">{page.title}</button>
                    ))}
                </div>
                <button 
                    onClick={() => {
                        const widget = document.getElementById('booking-widget');
                        if(widget) widget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                    Book Now
                </button>
            </nav>

            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    
                    {data.showPortfolio && (
                        <section className="py-20 px-6 bg-slate-50">
                            <div className="max-w-6xl mx-auto">
                                <h2 className="text-2xl font-bold text-center mb-12">Selected Works</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {site.gallery.map((img) => (
                                        <div key={img.id} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group bg-white">
                                            <div className="aspect-[3/4] overflow-hidden">
                                                <img src={img.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            </div>
                                            {img.caption && <div className="p-4 text-center text-sm font-medium text-slate-600">{img.caption}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {data.showPricing && renderPricing("Transparent Pricing")}
                </>
            )}

            {data.showBookingWidget && (
                <div className="py-24 px-6 bg-slate-50 border-t border-slate-200" id="booking-widget">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Secure Your Session</h2>
                        <div className="inline-flex items-center gap-2 text-slate-500 text-sm bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <Lock size={14} className="text-emerald-500"/>
                            Secure SSL Encryption
                        </div>
                    </div>
                    <BookingWidget packages={packages} theme="CLEANSLATE" onSubmit={onBooking} pixels={site.pixels} />
                </div>
            )}

            <footer className="bg-white border-t border-slate-100 py-12 px-6 text-center">
                <p className="font-bold text-slate-900 mb-2">{site.title}</p>
                <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} All rights reserved.</p>
            </footer>
        </div>
    )
}

export default CleanSlateTheme;
