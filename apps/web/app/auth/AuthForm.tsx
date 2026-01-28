"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Check for recovery token in URL hash (comes from password reset email)
  useEffect(() => {
    const checkRecoveryToken = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
        // Supabase client will automatically pick up the token from the hash
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setMessage({ type: 'error', text: 'Invalid or expired recovery link. Please request a new one.' });
          setIsRecoveryMode(false);
        }
      }
    };
    checkRecoveryToken();
  }, [supabase.auth]);

  // Logo spin classes
  const logoClassName = `app-logo h-12 object-contain mx-auto mb-4${branding.logoSpinEnabled ? ' logo-spin' : ''}`;
  const logoStyle = branding.logoSpinEnabled && branding.logoSpinDuration
    ? { '--logo-spin-duration': `${branding.logoSpinDuration}s` } as React.CSSProperties
    : undefined;

  // Get redirect URL from query params (default to /account for logged-in users)
  const redirectUrl = searchParams.get('redirect') || '/account';

  // Get the correct origin for OAuth redirects
  const getOAuthOrigin = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;

    // Check if running in Capacitor (mobile app)
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();

    if (isCapacitor) {
      // In mobile app, use the actual server IP
      return origin;
    }

    // In web browser, replace 0.0.0.0 with localhost for OAuth compatibility
    if (origin.includes('0.0.0.0')) {
      return origin.replace('0.0.0.0', 'localhost');
    }
    return origin;
  };

  // Get mode from query params (signin, signup, or forgot)
  const mode = searchParams.get('mode') || 'signin';
  const isSignUp = mode === 'signup';
  const isForgot = mode === 'forgot';

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getOAuthOrigin()}/auth/callback?next=/account`,
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
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      router.push(redirectUrl);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getOAuthOrigin()}/auth?mode=signin`,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for a password reset link.' });
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      // Clear the hash and redirect to sign in
      window.history.replaceState(null, '', '/auth?mode=signin');
      setIsRecoveryMode(false);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    // Check if running in Capacitor (mobile app)
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

    if (isCapacitor) {
      try {
        // Use native Google Auth for mobile
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

        // Initialize GoogleAuth (required on Android)
        await GoogleAuth.initialize({
          clientId: '256893745455-oklneuv1pu0c6d48b3jnfhe47liu6bsr.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });

        const googleUser = await GoogleAuth.signIn();

        if (googleUser.authentication.idToken) {
          // Sign in to Supabase with the Google ID token
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleUser.authentication.idToken,
          });

          if (error) {
            console.error('Supabase sign in error:', error);
            alert(error.message);
          } else {
            router.push(redirectUrl);
          }
        } else {
          alert('No ID token received from Google');
        }
      } catch (error: any) {
        console.error('Google Sign In error:', error);
        alert(error.message || 'Error signing in with Google');
      } finally {
        setLoading(false);
      }
    } else {
      // Use OAuth flow for web
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getOAuthOrigin()}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
        },
      });
      if (error) {
        setLoading(false);
        alert(error.message);
      }
    }
  };

  // Render password reset form (when user clicks recovery link from email)
  if (isRecoveryMode) {
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
            <h2 className="text-3xl font-black text-[#1a1a1a]">Set New Password</h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter your new password below.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message.text}
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-none relative block w-full px-4 py-4 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-50"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-50"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-[#1a1a1a] bg-[#FFDE59] hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 shadow-lg shadow-yellow-100 transition-all"
            >
              {loading ? 'Please wait...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render forgot password form
  if (isForgot) {
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
            <h2 className="text-3xl font-black text-[#1a1a1a]">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message.text}
              </div>
            )}

            <div>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-50"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-[#1a1a1a] bg-[#FFDE59] hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 shadow-lg shadow-yellow-100 transition-all"
              >
                {loading ? 'Please wait...' : 'Send Reset Link'}
              </button>
              <button
                onClick={() => router.push('/auth?mode=signin')}
                className="group relative w-full flex items-center justify-center gap-2 py-4 px-4 border-2 border-gray-100 text-sm font-bold rounded-xl text-gray-500 hover:text-[#1a1a1a] hover:border-black transition-all"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          {message && (
            <div className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}

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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-none relative block w-full px-4 py-4 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-gray-50"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
                  onClick={() => router.push('/auth?mode=forgot')}
                  className="text-sm text-gray-500 hover:text-[#1a1a1a] transition-colors"
                >
                  Forgot your password?
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
