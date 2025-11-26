
import React, { useState, useRef } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
    before: string;
    after: string;
    label: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ before, after, label }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            setSliderPosition((x / rect.width) * 100);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
            setSliderPosition((x / rect.width) * 100);
        }
    };

    return (
        <div className="my-12 px-4 md:px-6">
            <h3 className="text-center mb-6 text-lg md:text-xl font-bold uppercase tracking-widest">{label}</h3>
            <div 
                ref={containerRef}
                className="relative w-full max-w-4xl mx-auto aspect-[3/2] overflow-hidden cursor-ew-resize select-none rounded-lg shadow-2xl touch-none"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            >
                <img src={after} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="After" />
                <div 
                    className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none border-r-2 border-white"
                    style={{ width: `${sliderPosition}%` }}
                >
                    <img src={before} className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100vw', maxWidth: '56rem' }} alt="Before" /> 
                </div>
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none z-10"
                    style={{ left: `calc(${sliderPosition}% - 16px)` }}
                >
                    <MoveHorizontal size={16} className="text-black" />
                </div>
                <div className="absolute top-4 left-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded uppercase font-bold pointer-events-none">Before</div>
                <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded uppercase font-bold pointer-events-none">After</div>
            </div>
        </div>
    );
};

export default BeforeAfterSlider;
