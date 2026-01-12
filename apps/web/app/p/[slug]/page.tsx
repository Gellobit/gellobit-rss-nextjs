import React from 'react';
import {
    ArrowLeft,
    Share2,
    Flag,
    Calendar,
    User,
    ShieldCheck,
    Globe
} from 'lucide-react';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Mock data - in real app this would fetch from Supabase based on slug
    const article = {
        title: "Pima County Career Fair: Hiring Event in Tucson, AZ",
        date: "Jan 10, 2026",
        author: "Gellobit Team",
        category: "Job Fair",
        content: `
      <p class="mb-6 leading-relaxed text-slate-700">Connect with over 20 government departments and private employers at the annual Pima County Career Fair. This is a verified opportunity for job seekers in the Arizona area to meet directly with hiring managers.</p>
      
      <h3 class="text-xl font-bold text-slate-900 mb-4">What to Expect</h3>
      <ul class="list-disc pl-5 mb-6 space-y-2 text-slate-700">
        <li>On-the-spot interviews</li>
        <li>Resume workshops</li>
        <li>Networking opportunities with industry leaders</li>
      </ul>

      <h3 class="text-xl font-bold text-slate-900 mb-4">Requirements</h3>
      <p class="mb-6 leading-relaxed text-slate-700">Please bring multiple copies of your resume and dress in professional attire. Pre-registration is encouraged but not required.</p>
    `
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navigation (Simplified for Mockup) */}
            <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                        <span className="font-black text-2xl tracking-tighter text-[#1a1a1a]">GelloBit</span>
                    </div>
                    <a href="/" className="text-sm font-bold text-slate-500 hover:text-[#1a1a1a]">Back to Feed</a>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content Column */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 p-8 md:p-12">

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {article.category}
                                </span>
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                    <Calendar size={14} /> <span>{article.date}</span>
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black text-[#1a1a1a] mb-8 leading-tight">
                                {article.title}
                            </h1>

                            <div className="flex items-center justify-between border-y border-slate-100 py-6 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-bold">
                                        GB
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-bold text-[#1a1a1a]">{article.author}</p>
                                        <p className="text-slate-400">Verified Research Team</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3 rounded-full hover:bg-slate-50 text-slate-500 transition-colors">
                                        <Share2 size={20} />
                                    </button>
                                    <button className="p-3 rounded-full hover:bg-slate-50 text-slate-500 transition-colors">
                                        <Flag size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <article
                                className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#1a1a1a] prose-a:text-yellow-600"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />

                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* CTA Card */}
                        <div className="bg-[#1a1a1a] rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Don't miss out!</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    Opportunities like this expire quickly. Get instant alerts on your phone.
                                </p>
                                <button className="w-full bg-[#FFDE59] text-[#1a1a1a] font-black py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-900/20">
                                    Download App
                                </button>
                            </div>
                        </div>

                        {/* Verification Badge */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-start gap-4">
                            <ShieldCheck className="text-green-500 shrink-0" size={32} />
                            <div>
                                <h4 className="font-bold text-[#1a1a1a] mb-1">Human Verified</h4>
                                <p className="text-sm text-slate-500">
                                    This opportunity has been manually reviewed by our team for legitimacy and FTC compliance.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
