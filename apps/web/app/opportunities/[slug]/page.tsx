import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { Calendar, MapPin, Gift, ExternalLink, ArrowLeft, Clock, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import UserNav from '@/components/UserNav';
import FavoriteButton from '@/components/FavoriteButton';
import Sidebar, { SidebarWidget, SidebarCTA } from '@/components/Sidebar';
import { Metadata } from 'next';
import OpportunityAdsLayout, {
  BelowTitleAd,
  InContentAd,
  EndOfPostAd,
  AfterCTAAd,
  OpportunitySidebarAd,
} from '@/components/ads/OpportunityAdsLayout';
import { getAdLayout } from '@/lib/config/ad-layouts';

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

// Fetch related opportunities of the same type
async function getRelatedOpportunities(currentSlug: string, opportunityType: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('opportunities')
    .select('slug, title, featured_image_url, deadline, prize_value')
    .eq('status', 'published')
    .eq('opportunity_type', opportunityType)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(5);

  if (error || !data) {
    return [];
  }

  return data.map(opp => ({
    title: opp.title,
    slug: `opportunities/${opp.slug}`,
    imageUrl: opp.featured_image_url,
    date: opp.deadline,
  }));
}

// Calculate days until deadline
function getDaysUntilDeadline(deadline: string | null): { days: number; isExpired: boolean; text: string } | null {
  if (!deadline) return null;

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isExpired: true, text: `Expired ${Math.abs(diffDays)} days ago` };
  } else if (diffDays === 0) {
    return { days: 0, isExpired: false, text: 'Ends today!' };
  } else if (diffDays === 1) {
    return { days: 1, isExpired: false, text: 'Ends tomorrow!' };
  } else if (diffDays <= 7) {
    return { days: diffDays, isExpired: false, text: `${diffDays} days left` };
  } else {
    return { days: diffDays, isExpired: false, text: `${diffDays} days left` };
  }
}

/**
 * Generate metadata for opportunity detail page
 * IMPORTANT: This page is protected and should NOT be indexed by search engines
 * All opportunities are private content behind authentication
 */
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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: opportunity.title,
    description: opportunity.excerpt || `${opportunity.title} - ${opportunity.opportunity_type}`,
    // CRITICAL: Prevent indexing of protected content
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    // No Open Graph for private content - prevents social media previews
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

  // Fetch related opportunities
  const relatedOpportunities = await getRelatedOpportunities(
    resolvedParams.slug,
    opportunity.opportunity_type
  );

  const isExpired = opportunity.deadline && new Date(opportunity.deadline) < new Date();
  const deadlineInfo = getDaysUntilDeadline(opportunity.deadline);

  // Get the ad layout for this opportunity type
  const adLayout = getAdLayout(opportunity.opportunity_type);

  return (
    <OpportunityAdsLayout opportunityType={opportunity.opportunity_type}>
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Opportunities
          </Link>
          <div className="hidden md:block">
            <UserNav hideOpportunities={true} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Article */}
          <div className="flex-1 min-w-0">
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
            {/* Type Badge & Save Button */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase">
                {opportunity.opportunity_type.replace('_', ' ')}
              </span>
              <FavoriteButton
                opportunityId={opportunity.id}
                size={24}
                showLabel={true}
                className="flex-shrink-0"
              />
            </div>

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

            {/* Ad: Below Title (High Urgency categories) */}
            <BelowTitleAd opportunityType={opportunity.opportunity_type} />

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

            {/* Ad: In-Content (Career/Education categories) */}
            <InContentAd opportunityType={opportunity.opportunity_type} />

            {/* Main Content */}
            <div
              className="prose prose-slate max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: opportunity.content }}
            />

            {/* Ad: End of Post */}
            <EndOfPostAd opportunityType={opportunity.opportunity_type} />

            {/* CTA Buttons */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={opportunity.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDE59] text-[#1a1a1a] font-black rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Visit Original Source
                  <ExternalLink size={18} />
                </a>
                <FavoriteButton
                  opportunityId={opportunity.id}
                  size={20}
                  showLabel={true}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg"
                />
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Published {opportunity.published_at
                  ? new Date(opportunity.published_at).toLocaleDateString()
                  : new Date(opportunity.created_at).toLocaleDateString()
                }
              </p>

              {/* Ad: After CTA (Lifestyle/Social categories - high CTR after copy code) */}
              <AfterCTAAd opportunityType={opportunity.opportunity_type} />
            </div>
          </div>
        </article>
          </div>

          {/* Sidebar - Desktop only */}
          <Sidebar
            showAd={false}
            relatedItems={relatedOpportunities}
            relatedTitle={`More ${opportunity.opportunity_type.replace('_', ' ')}s`}
          >
            {/* Type-specific Sidebar Ad */}
            <OpportunitySidebarAd opportunityType={opportunity.opportunity_type} />
            {/* Deadline Widget */}
            {deadlineInfo && (
              <SidebarWidget>
                <div className={`text-center p-4 rounded-lg ${
                  deadlineInfo.isExpired
                    ? 'bg-red-50 border border-red-200'
                    : deadlineInfo.days <= 3
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-green-50 border border-green-200'
                }`}>
                  <div className={`flex items-center justify-center gap-2 mb-2 ${
                    deadlineInfo.isExpired ? 'text-red-600' : deadlineInfo.days <= 3 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {deadlineInfo.isExpired ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  <div className={`text-2xl font-black ${
                    deadlineInfo.isExpired ? 'text-red-700' : deadlineInfo.days <= 3 ? 'text-amber-700' : 'text-green-700'
                  }`}>
                    {deadlineInfo.text}
                  </div>
                  {opportunity.deadline && (
                    <div className="text-xs text-slate-500 mt-2">
                      {new Date(opportunity.deadline).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              </SidebarWidget>
            )}

            {/* Prize Value Widget */}
            {opportunity.prize_value && (
              <SidebarWidget>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                    <Gift size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">Prize Value</span>
                  </div>
                  <div className="text-2xl font-black text-green-700">
                    {opportunity.prize_value}
                  </div>
                </div>
              </SidebarWidget>
            )}

            {/* Quick Actions Widget */}
            <SidebarWidget title="Quick Actions">
              <div className="space-y-3">
                <a
                  href={opportunity.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#FFDE59] text-[#1a1a1a] font-bold rounded-lg hover:bg-yellow-400 transition-colors text-sm"
                >
                  Apply Now
                  <ExternalLink size={16} />
                </a>
                <FavoriteButton
                  opportunityId={opportunity.id}
                  size={18}
                  showLabel={true}
                  className="w-full justify-center px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
                />
              </div>
            </SidebarWidget>

            {/* Browse More CTA */}
            <SidebarCTA
              title="Find More Opportunities"
              description="Browse all contests, giveaways, scholarships and more."
              buttonText="Browse All"
              buttonLink="/opportunities"
              variant="secondary"
            />
          </Sidebar>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-500">
          Powered by Gellobit RSS Processor
        </div>
      </footer>
    </div>
    </OpportunityAdsLayout>
  );
}
