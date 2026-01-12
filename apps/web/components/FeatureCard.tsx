"use client";

import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
    <div className="bg-white p-10 rounded-[40px] border border-slate-100 hover:border-yellow-200 transition-all hover:shadow-2xl hover:shadow-yellow-100 group">
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-[#1a1a1a]">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
);
