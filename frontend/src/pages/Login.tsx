import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginProps {
  setActivePage: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ setActivePage }) => {
  const { loginUser } = useWeb3();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Perform Web2 Auth check
      const result = await loginUser(email, password);
      setIsLoading(false);

      if (result.success && result.role) {
        // Conditionally redirect based on returned user role
        if (result.role === 'ngo') {
          setActivePage('ngo-dashboard');
        } else if (result.role === 'admin') {
          setActivePage('admin-dashboard');
        } else {
          setActivePage('donor-dashboard');
        }
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError('Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[350px] h-[350px] rounded-full bg-trust-blue-light blur-[100px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[350px] h-[350px] rounded-full bg-milestone-green-light blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden relative z-10 p-6 sm:p-8 md:p-10"
      >
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-trust-blue-light border border-blue-100 flex items-center justify-center text-trust-blue shadow-sm mb-2">
            <UserCheck size={28} />
          </div>
          <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-500 max-w-xs">
            Sign in with your Web2 email and password to access your platform dashboard.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 mb-6 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl font-semibold flex items-center gap-2"
          >
            <Lock size={14} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                placeholder="name@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200 bg-white"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <span className="text-[10px] font-medium text-trust-blue hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200 bg-white"
              />
            </div>
          </div>

          {/* Demo account hints badge */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 font-bold text-slate-700">
              <ShieldCheck size={12} className="text-trust-blue" />
              <span>Demo Quick Login Credentials:</span>
            </div>
            <div><span className="font-semibold text-slate-700">NGO:</span> info@globalcare.org | <span className="font-semibold text-slate-700">Donor:</span> sarah@donor.org</div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-trust-blue text-white font-heading text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 mt-2 glow-blue flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating Account...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Form Footer Link */}
        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setActivePage('register')}
              className="text-trust-blue hover:underline font-bold cursor-pointer ml-1"
            >
              Register here
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
