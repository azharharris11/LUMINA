
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

const CinemaTheme: React.FC<ThemeProps> = ({ site, activePage, packages, users, config, onBooking, onNavigate }) => {
    const data = activePage || site;
    const sections = (data as SitePage).sections || [];

    const renderHero = (headline: string, desc: string, img: string) => (
        <section className="h-screen w-full relative flex items-end p-6 md:p-12 overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img src={img} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
            </div>
            <div className="relative z-10 max-w-4xl pb-10 md:pb-0">
                <Motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="text-4xl md:text-8xl font-bold mb-4 md:mb-6 tracking-tighter leading-none break-words">{headline}</Motion.h1>
                <Motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="text-base md:text-xl text-gray-300 max-w-xl font-light">{desc}</Motion.p>
            </div>
        </section>
    );

    const renderSections = () => sections.map((section: SiteSection) => {
        switch(section.type) {
            case 'HERO': return <div key={section.id}>{renderHero(section.content.headline || '', section.content.description || '', section.content.image || '')}</div>;
            case 'TEXT_IMAGE': return (
                <section key={section.id} className="py-20 px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-black">
                    <div className={`aspect-video relative overflow-hidden rounded-lg ${section.content.layout === 'RIGHT' ? 'md:order-2' : 'md:order-1'}`}>
                        <img src={section.content.image} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
                    </div>
                    <div className={`${section.content.layout === 'RIGHT' ? 'md:order-1' : 'md:order-2'}`}>
                        <h2 className="text-3xl font-bold mb-4 text-blue-500">{section.content.headline}</h2>
                        <p className="text-gray-400 text-lg leading-relaxed">{section.content.description}</p>
                    </div>
                </section>
            );
            case 'GALLERY': return (
                <section key={section.id} className="py-12 md:py-20 overflow-hidden">
                    <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-8 snap-x">
                        {site.gallery.map((img: SiteGalleryItem) => (
                            <div key={img.id} className="min-w-[85vw] md:min-w-[40vw] aspect-video relative group rounded-lg overflow-hidden snap-center border border-white/10">
                                <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                <span className="absolute bottom-4 left-4 font-bold text-lg md:text-xl tracking-wide opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity drop-shadow-lg">{img.caption}</span>
                            </div>
                        ))}
                    </div>
                </section>
            );
            default: return null;
        }
    });

    return (
        <div className="bg-black text-white font-sans min-h-full overflow-x-hidden">
            <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
                <span onClick={() => onNavigate && onNavigate('HOME')} className="font-bold tracking-widest uppercase text-sm cursor-pointer">{site.title}</span>
                <div className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <button onClick={() => onNavigate && onNavigate('HOME')} className="hover:text-white transition-colors">Home</button>
                    {site.pages?.map(p => (
                        <button key={p.id} onClick={() => onNavigate && onNavigate(p.id)} className="hover:text-white transition-colors">{p.title}</button>
                    ))}
                </div>
            </nav>

            {sections.length > 0 ? renderSections() : (
                <>
                    {renderHero(data.headline, data.description, data.heroImage)}
                    {data.showPortfolio && (
                        <section className="py-12 md:py-20 overflow-hidden">
                            <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-8 snap-x">
                                {site.gallery.map((img: SiteGalleryItem) => (
                                    <div key={img.id} className="min-w-[85vw] md:min-w-[40vw] aspect-video relative group rounded-lg overflow-hidden snap-center border border-white/10">
                                        <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        <span className="absolute bottom-4 left-4 font-bold text-lg md:text-xl tracking-wide opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity drop-shadow-lg">{img.caption}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            {data.showBookingWidget && (
                <div className="py-20 bg-black border-t border-white/10" id="booking-widget">
                    <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-2">Start Production</h2></div>
                    <BookingWidget packages={packages} theme="CINEMA" onSubmit={onBooking} />
                </div>
            )}

            <footer className="py-12 md:py-20 text-center text-gray-500 text-xs md:text-sm tracking-widest uppercase">{site.title} &copy; {new Date().getFullYear()}</footer>
        </div>
    )
}

export default CinemaTheme;
