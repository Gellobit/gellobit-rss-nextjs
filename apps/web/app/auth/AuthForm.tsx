"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

interface Branding {
    logoUrl: string | null;
    appName: string;
}

interface AuthFormProps {
    branding: Branding;
}

function AuthFormInner({ branding }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Get redirect URL from query params (default to /account for logged-in users)
  const redirectUrl = searchParams.get('redirect') || '/account';

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/account`,
      },
    });
    setLoading(false);
    if (error) {
      console.error("SignUp Error:", error);
      alert(error.message);
    } else {
      alert('Account created! Check your email for the confirmation link.');
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) alert(error.message);
    else router.push(redirectUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
        <div className="text-center">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.appName}
              className="h-12 object-contain mx-auto mb-4"
            />
          ) : (
            <div className="inline-block bg-[#FFDE59] p-3 rounded-2xl font-black text-2xl shadow-sm mb-4">GB</div>
          )}
          <h2 className="text-3xl font-black text-[#1a1a1a]">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your Pro subscription and saved opportunities.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-50"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-50"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-[#1a1a1a] bg-[#FFDE59] hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 shadow-lg shadow-yellow-100 transition-all"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border-2 border-gray-100 text-sm font-bold rounded-xl text-gray-500 hover:text-[#1a1a1a] hover:border-black transition-all"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function AuthForm({ branding }: AuthFormProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <AuthFormInner branding={branding} />
    </Suspense>
  );
}
