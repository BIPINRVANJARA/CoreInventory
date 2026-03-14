import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function PremiumSelect({ label, value, options, onChange, placeholder = "Select option...", className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || options.find(opt => opt.id === value);
    const displayLabel = selectedOption ? (selectedOption.label || selectedOption.name) : placeholder;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange({ target: { name: label?.toLowerCase().replace(/\s+/g, '_') || '', value: val } });
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className} font-inter`} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    {label}
                </label>
            )
            }
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-slate-50 border ${isOpen ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-200'} rounded-2xl px-5 py-3.5 text-sm transition-all duration-200 group text-left`}
            >
                <span className={`${selectedOption ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>
                    {displayLabel}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-500' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-100 rounded-3xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200 origin-top overflow-hidden">
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                        {options.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-400 italic">No options available</div>
                        ) : (
                            options.map((opt, idx) => {
                                const val = opt.value || opt.id;
                                const isSelected = val === value;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelect(val)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${isSelected ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}
                                    >
                                        <span>{opt.label || opt.name}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
