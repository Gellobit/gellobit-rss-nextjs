"use client";

import React from 'react';
import { Check } from 'lucide-react';

interface PricingItemProps {
    text: string;
    dark?: boolean;
}

export const PricingItem = ({ text, dark = false }: PricingItemProps) => (
    <li className="flex items-center gap-3">
        <div className={`p-1 rounded-full ${dark ? 'bg-yellow-400 text-black' : 'bg-yellow-100 text-yellow-600'}`}>
            <Check size={12} strokeWidth={4} />
        </div>
        <span className={`text-sm font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{text}</span>
    </li>
);
