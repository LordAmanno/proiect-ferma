import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, RefreshCw, Sprout } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import loginBg from '../assets/login-bg.png';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Please check your email to confirm your account!');
        console.log('Sign up result:', data);
      } else {
        // Sign In Logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
             throw new Error('Email not confirmed. Please check your inbox or use the resend button below.');
          }
          throw error;
        }
        console.log('Log in result:', data);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-gray-950">
      {/* Left Side - Image Section (Larger width for better visual impact) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img 
          src={loginBg} 
          alt="FieldOrigins" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
        />
        {/* Very subtle gradient only at the very bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80"></div>
        
        <div className="relative z-10 p-16 flex flex-col justify-end h-full text-white">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 w-fit">
              <Sprout size={20} className="text-green-400" />
              <span className="text-sm font-medium tracking-wide text-green-50">Smart Farming Solution</span>
            </div>
            <h2 className="text-5xl font-bold leading-tight">
              Cultivating the <br/>
              <span className="text-green-400">Future</span> of Agriculture
            </h2>
            <p className="text-gray-200 text-lg max-w-xl leading-relaxed opacity-90">
              Streamline your farm operations with advanced analytics, real-time monitoring, and intelligent resource management.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Cleaner, better spacing) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3 pb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 leading-normal">FieldOrigins</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium pt-1">
              {isSignUp ? 'Join our community of modern farmers.' : 'Welcome back! Please enter your details.'}
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100 dark:border-red-900/50">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {error.toLowerCase().includes('email not confirmed') && (
                    <button 
                      onClick={handleResendConfirmation}
                      className="text-red-700 dark:text-red-300 underline font-bold mt-1 hover:text-red-800 dark:hover:text-red-200"
                    >
                      Resend Confirmation Email
                    </button>
                  )}
                </div>
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm border border-green-100 dark:border-green-900/50">
                <AlertCircle size={18} />
                <span className="font-medium">Confirmation email sent! Please check your inbox.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                    placeholder="farmer@agriflow.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                    Password
                  </label>
                  {!isSignUp && (
                    <a href="#" className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 hover:underline">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="pt-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-950 text-gray-500">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-semibold py-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                >
                  {isSignUp ? 'Sign In Instead' : 'Create New Account'}
                </button>

                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    className="text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex items-center justify-center gap-1 transition-colors mt-2"
                  >
                    <RefreshCw size={12} />
                    Resend confirmation email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
