import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { Calendar, MapPin, Gift, ExternalLink, ArrowLeft, Clock, Award, CheckCircle } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface Opportunity {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  opportunity_type: string;
  deadline: string | null;
  prize_value: string | null;
  requirements: string | null;
  location: string | null;
  source_url: string;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

async function getOpportunity(slug: string): Promise<Opportunity | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await params;
  const opportunity = await getOpportunity(resolvedParams.slug);

  if (!opportunity) {
    return {
      title: 'Opportunity Not Found',
    };
  }

  return {
    title: opportunity.title,
    description: opportunity.excerpt || `${opportunity.title} - ${opportunity.opportunity_type}`,
    openGraph: {
      title: opportunity.title,
      description: opportunity.excerpt || undefined,
      images: opportunity.featured_image_url ? [opportunity.featured_image_url] : undefined,
    },
  };
}

export default async function OpportunityPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const opportunity = await getOpportunity(resolvedParams.slug);

  if (!opportunity) {
    notFound();
  }

  const isExpired = opportunity.deadline && new Date(opportunity.deadline) < new Date();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Opportunities
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Featured Image */}
          {opportunity.featured_image_url && (
            <div className="aspect-video bg-slate-100">
              <img
                src={opportunity.featured_image_url}
                alt={opportunity.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 lg:p-8">
            {/* Type Badge */}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 mb-4 uppercase">
              {opportunity.opportunity_type.replace('_', ' ')}
            </span>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-black text-[#1a1a1a] mb-4">
              {opportunity.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-slate-200">
              {opportunity.prize_value && (
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="text-green-500" size={18} />
                  <span className="font-bold text-green-600">{opportunity.prize_value}</span>
                </div>
              )}
              {opportunity.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={18} />
                  <span>{opportunity.location}</span>
                </div>
              )}
              {opportunity.deadline && (
                <div className={`flex items-center gap-2 text-sm ${isExpired ? 'text-red-500' : 'text-slate-600'}`}>
                  <Clock size={18} />
                  <span>
                    {isExpired ? 'Expired: ' : 'Deadline: '}
                    {new Date(opportunity.deadline).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Expired Warning */}
            {isExpired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 font-bold">This opportunity has expired</p>
                <p className="text-red-600 text-sm">The deadline for this opportunity has passed.</p>
              </div>
            )}

            {/* Requirements */}
            {opportunity.requirements && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <h2 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Requirements
                </h2>
                <p className="text-slate-600 text-sm">{opportunity.requirements}</p>
              </div>
            )}

            {/* Main Content */}
            <div
              className="prose prose-slate max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: opportunity.content }}
            />

            {/* CTA Button */}
            <div className="border-t border-slate-200 pt-6">
              <a
                href={opportunity.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDE59] text-[#1a1a1a] font-black rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Visit Original Source
                <ExternalLink size={18} />
              </a>
              <p className="text-xs text-slate-400 mt-3">
                Published {opportunity.published_at
                  ? new Date(opportunity.published_at).toLocaleDateString()
                  : new Date(opportunity.created_at).toLocaleDateString()
                }
              </p>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-500">
          Powered by Gellobit RSS Processor
        </div>
      </footer>
    </div>
  );
}
