import Link from 'next/link';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { Calendar, MapPin, Gift, Briefcase, GraduationCap, Trophy, Clock, BookOpen } from 'lucide-react';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

// Cached function to fetch branding settings
const getBranding = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const { data: logoSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'personalization.app_logo_url')
            .maybeSingle();

        const { data: nameSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'personalization.app_name')
            .maybeSingle();

        return {
            logoUrl: logoSetting?.value || null,
            appName: nameSetting?.value || 'GelloBit',
        };
    },
    ['branding-opportunities'],
    { revalidate: 300, tags: ['branding'] }
);

const opportunityTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  giveaway: { label: 'Giveaway', icon: Gift, color: 'bg-pink-100 text-pink-700' },
  contest: { label: 'Contest', icon: Trophy, color: 'bg-yellow-100 text-yellow-700' },
  sweepstakes: { label: 'Sweepstakes', icon: Gift, color: 'bg-purple-100 text-purple-700' },
  dream_job: { label: 'Dream Job', icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
  get_paid_to: { label: 'Get Paid To', icon: Briefcase, color: 'bg-green-100 text-green-700' },
  instant_win: { label: 'Instant Win', icon: Trophy, color: 'bg-orange-100 text-orange-700' },
  job_fair: { label: 'Job Fair', icon: Briefcase, color: 'bg-indigo-100 text-indigo-700' },
  scholarship: { label: 'Scholarship', icon: GraduationCap, color: 'bg-cyan-100 text-cyan-700' },
  volunteer: { label: 'Volunteer', icon: Briefcase, color: 'bg-teal-100 text-teal-700' },
  free_training: { label: 'Free Training', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-700' },
  promo: { label: 'Promo', icon: Gift, color: 'bg-red-100 text-red-700' },
  evergreen: { label: 'Evergreen', icon: BookOpen, color: 'bg-lime-100 text-lime-700' },
};

interface Opportunity {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  opportunity_type: string;
  deadline: string | null;
  prize_value: string | null;
  location: string | null;
  featured_image_url: string | null;
  published_at: string | null;
}

async function getOpportunities(type?: string): Promise<Opportunity[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('opportunities')
    .select('id, slug, title, excerpt, opportunity_type, deadline, prize_value, location, featured_image_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (type) {
    query = query.eq('opportunity_type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }

  return data || [];
}

export default async function OpportunitiesPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams;
  const [opportunities, branding] = await Promise.all([
    getOpportunities(params.type),
    getBranding()
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt={branding.appName}
                    className="h-10 object-contain"
                  />
                ) : (
                  <div className="bg-[#FFDE59] p-2 rounded-xl font-black text-xl shadow-sm">GB</div>
                )}
              </Link>
              <div>
                <h1 className="font-black text-2xl text-[#1a1a1a]">Opportunities</h1>
                <p className="text-sm text-slate-500">Discover contests, giveaways, jobs & more</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/opportunities"
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                !params.type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </Link>
            {Object.entries(opportunityTypeLabels).map(([key, { label }]) => (
              <Link
                key={key}
                href={`/opportunities?type=${key}`}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  params.type === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {opportunities.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">No opportunities yet</h2>
            <p className="text-slate-500">Check back later for new opportunities!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => {
              const typeConfig = opportunityTypeLabels[opportunity.opportunity_type] || {
                label: opportunity.opportunity_type,
                icon: Gift,
                color: 'bg-gray-100 text-gray-700'
              };
              const Icon = typeConfig.icon;

              return (
                <Link
                  key={opportunity.id}
                  href={`/opportunities/${opportunity.slug}`}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Image */}
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {opportunity.featured_image_url ? (
                      <img
                        src={opportunity.featured_image_url}
                        alt={opportunity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-[#1a1a1a] mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {opportunity.title}
                    </h3>

                    {opportunity.excerpt && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {opportunity.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {opportunity.prize_value && (
                        <span className="flex items-center gap-1">
                          <Gift size={12} />
                          {opportunity.prize_value}
                        </span>
                      )}
                      {opportunity.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {opportunity.location}
                        </span>
                      )}
                      {opportunity.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(opportunity.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-500">
          Powered by Gellobit RSS Processor
        </div>
      </footer>
    </div>
  );
}
