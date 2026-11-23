import { useState, type FormEvent } from 'react';
import { X, Lock } from 'lucide-react';
import { signInCustomer, signUpCustomer } from '../lib/api';
import type { AuthUser, Profile } from '../types/boutique';

interface AuthModalProps {
  open: boolean;
  initialPrompt?: string;
  onClose: () => void;
  onAuthenticated: (user: AuthUser, profile: Profile | null) => void;
}

export function AuthModal({
  open,
  initialPrompt,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpCustomer({
          full_name: fullName,
          email,
          phone,
          password,
        });
        onAuthenticated(res.user, res.profile);
      } else {
        const res = await signInCustomer({ email, password });
        onAuthenticated(res.user, res.profile);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Customer Sign In"
    >
      <div className="w-full max-w-md bg-[#FAF7F2] border border-[#E5DCCB] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5DCCB] flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#6B1D2F]">
              Kaveri Silks Patron Account
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#1E1B18] mt-1">
              {mode === 'signin' ? 'Sign In to Continue' : 'Create Your Account'}
            </h2>
            {initialPrompt && (
              <p className="text-xs text-[#5C544D] mt-1.5">{initialPrompt}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#5C544D] hover:text-[#1E1B18] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F2ECE1] rounded-md border border-[#E5DCCB]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#FAF7F2] text-[#6B1D2F] shadow-sm'
                  : 'text-[#5C544D] hover:text-[#1E1B18]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#FAF7F2] text-[#6B1D2F] shadow-sm'
                  : 'text-[#5C544D] hover:text-[#1E1B18]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-[#6B1D2F] bg-[#6B1D2F]/10 border border-[#6B1D2F]/30 rounded-md">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Meenakshi Sundaram"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98400 12345"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patron@example.com"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] transition-colors rounded-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Lock className="w-4 h-4 text-[#DFC06B]" aria-hidden="true" />
            <span>
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account & Continue'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
