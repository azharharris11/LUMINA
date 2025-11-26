
import React from 'react';

interface ToggleRowProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    compact?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, checked, onChange, compact }) => (
    <div className={`flex justify-between items-center bg-lumina-base border border-lumina-highlight rounded-lg ${compact ? 'p-1 px-2 bg-transparent border-none' : 'p-3'}`}>
        {label && <span className="text-sm text-white">{label}</span>}
        <button 
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-lumina-accent' : 'bg-lumina-highlight'}`}
        >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'left-6' : 'left-1'}`}></div>
        </button>
    </div>
);

export default ToggleRow;
