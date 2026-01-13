import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center px-4">
        <SearchX className="mx-auto h-20 w-20 text-slate-300 mb-6" />
        <h1 className="text-3xl font-black text-[#1a1a1a] mb-2">
          Opportunity Not Found
        </h1>
        <p className="text-slate-500 mb-6 max-w-md">
          The opportunity you're looking for doesn't exist or may have been removed.
        </p>
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
        >
          Browse All Opportunities
        </Link>
      </div>
    </div>
  );
}
