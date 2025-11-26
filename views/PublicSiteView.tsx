
import React from 'react';
import { SiteConfig, Package, User, StudioConfig, PublicBookingSubmission, Booking } from '../types';
import NoirTheme from '../components/site-builder/themes/NoirTheme';
import EtherealTheme from '../components/site-builder/themes/EtherealTheme';
import VogueTheme from '../components/site-builder/themes/VogueTheme';
import MinimalTheme from '../components/site-builder/themes/MinimalTheme';
import CinemaTheme from '../components/site-builder/themes/CinemaTheme';
import RetroTheme from '../components/site-builder/themes/RetroTheme';
import AtelierTheme from '../components/site-builder/themes/AtelierTheme';
import HorizonTheme from '../components/site-builder/themes/HorizonTheme';
import BoldTheme from '../components/site-builder/themes/BoldTheme';
import ImpactTheme from '../components/site-builder/themes/ImpactTheme';
import CleanSlateTheme from '../components/site-builder/themes/CleanSlateTheme';
import AuthorityTheme from '../components/site-builder/themes/AuthorityTheme';
import { Loader2, AlertCircle } from 'lucide-react';

interface PublicSiteViewProps {
    config: StudioConfig | null;
    packages: Package[];
    users: User[];
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;
    onBooking: (data: PublicBookingSubmission) => void;
}

const PublicSiteView: React.FC<PublicSiteViewProps> = ({ config, packages, users, bookings, isLoading, error, onBooking }) => {
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-lumina-accent mb-4" />
                <p className="text-sm font-mono text-lumina-muted">Loading Studio Site...</p>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="p-4 bg-rose-500/10 rounded-full mb-4 border border-rose-500/20">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Site Not Found</h1>
                <p className="text-lumina-muted max-w-md">{error || "The studio you are looking for does not exist or has not published their site yet."}</p>
                <a href="/" className="mt-8 px-6 py-3 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                    Go to Lumina Home
                </a>
            </div>
        );
    }

    const site = config.site;
    const commonProps = {
        site,
        packages,
        users,
        config,
        bookings,
        onBooking,
        onNavigate: (pageId: string) => {
            const el = document.getElementById(pageId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Helper to decide which theme to render
    const renderTheme = () => {
        switch(site.theme) {
            case 'ETHEREAL': return <EtherealTheme {...commonProps} />;
            case 'VOGUE': return <VogueTheme {...commonProps} />;
            case 'MINIMAL': return <MinimalTheme {...commonProps} />;
            case 'CINEMA': return <CinemaTheme {...commonProps} />;
            case 'RETRO': return <RetroTheme {...commonProps} />;
            case 'ATELIER': return <AtelierTheme {...commonProps} />;
            case 'HORIZON': return <HorizonTheme {...commonProps} />;
            case 'BOLD': return <BoldTheme {...commonProps} />;
            case 'IMPACT': return <ImpactTheme {...commonProps} />;
            case 'CLEANSLATE': return <CleanSlateTheme {...commonProps} />;
            case 'AUTHORITY': return <AuthorityTheme {...commonProps} />;
            default: return <NoirTheme {...commonProps} />;
        }
    };

    return (
        <div className="w-full min-h-screen">
            {renderTheme()}
            {/* Lumina Badge */}
            <div className="fixed bottom-4 right-4 z-[100]">
                <a href="/" target="_blank" className="flex items-center gap-2 bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-black hover:border-lumina-accent transition-colors">
                    <div className="w-2 h-2 bg-lumina-accent rounded-full"></div>
                    Powered by Lumina
                </a>
            </div>
        </div>
    );
};

export default PublicSiteView;
