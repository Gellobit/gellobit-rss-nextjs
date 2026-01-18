"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

interface Branding {
    logoUrl: string | null;
    appName: string;
    logoSpinEnabled?: boolean;
    logoSpinDuration?: number;
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

  // Logo spin classes
  const logoClassName = `app-logo h-12 object-contain mx-auto mb-4${branding.logoSpinEnabled ? ' logo-spin' : ''}`;
  const logoStyle = branding.logoSpinEnabled && branding.logoSpinDuration
    ? { '--logo-spin-duration': `${branding.logoSpinDuration}s` } as React.CSSProperties
    : undefined;

  // Get redirect URL from query params (default to /account for logged-in users)
  const redirectUrl = searchParams.get('redirect') || '/account';

  // Get mode from query params (signin or signup)
  const mode = searchParams.get('mode') || 'signin';
  const isSignUp = mode === 'signup';

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    });
    if (error) {
      setLoading(false);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
        <div className="text-center">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.appName}
              className={logoClassName}
              style={logoStyle}
            />
          ) : (
            <div className="app-logo inline-block bg-[#FFDE59] p-3 rounded-2xl font-black text-2xl shadow-sm mb-4">GB</div>
          )}
          <h2 className="text-3xl font-black text-[#1a1a1a]">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isSignUp
              ? 'Sign up to discover opportunities and save your favorites.'
              : 'Sign in to manage your Pro subscription and saved opportunities.'}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

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
            {isSignUp ? (
              <>
                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-[#1a1a1a] bg-[#FFDE59] hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 shadow-lg shadow-yellow-100 transition-all"
                >
                  {loading ? 'Please wait...' : 'Create Account'}
                </button>
                <button
                  onClick={() => router.push(`/auth?mode=signin${redirectUrl !== '/account' ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`)}
                  className="group relative w-full flex justify-center py-4 px-4 border-2 border-gray-100 text-sm font-bold rounded-xl text-gray-500 hover:text-[#1a1a1a] hover:border-black transition-all"
                >
                  Already have an account? Sign In
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-[#1a1a1a] bg-[#FFDE59] hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 shadow-lg shadow-yellow-100 transition-all"
                >
                  {loading ? 'Please wait...' : 'Sign In'}
                </button>
                <button
                  onClick={() => router.push(`/auth?mode=signup${redirectUrl !== '/account' ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`)}
                  className="group relative w-full flex justify-center py-4 px-4 border-2 border-gray-100 text-sm font-bold rounded-xl text-gray-500 hover:text-[#1a1a1a] hover:border-black transition-all"
                >
                  Don't have an account? Create one
                </button>
              </>
            )}
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
