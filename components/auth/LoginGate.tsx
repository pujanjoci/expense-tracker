'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { KeyRound, Mail, User, UserRoundPlus, WalletCards, ArrowRight, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  authenticateUser,
  registerUser,
  AppUser,
  setLocalGuestUser,
  getLocalOfflineDataSummary,
  LocalOfflineDataSummary,
} from '@/lib/api';

const REMEMBERED_USERNAME_KEY = 'expense_tracker_remembered_user';

interface LoginGateProps {
  onAuthenticated: (user: AppUser) => Promise<void> | void;
  onSkip?: (name?: string) => Promise<void> | void;
}

export function LoginGate({ onAuthenticated, onSkip }: LoginGateProps) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'ask_name'>('login');
  const [nickname, setNickname] = useState('');
  const [offlineData, setOfflineData] = useState<LocalOfflineDataSummary | null>(null);
  const [showCloudPrompt, setShowCloudPrompt] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore remembered username on mount
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(REMEMBERED_USERNAME_KEY) ||
        localStorage.getItem('fintrack_remembered_username');
      if (saved) {
        setUsername(saved);
        setRememberMe(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    // If registering, check whether offline data exists in local storage
    if (mode === 'register') {
      const summary = getLocalOfflineDataSummary();
      if (summary.hasData) {
        setOfflineData(summary);
        setShowCloudPrompt(true);
        return;
      }
    }

    await executeAuth(false);
  };

  const executeAuth = async (saveLocalDataToCloud: boolean) => {
    setError('');
    setIsSubmitting(true);

    try {
      if (rememberMe && mode === 'login') {
        localStorage.setItem(REMEMBERED_USERNAME_KEY, username.trim());
      } else if (!rememberMe) {
        localStorage.removeItem(REMEMBERED_USERNAME_KEY);
      }

      const result = mode === 'register'
        ? await registerUser(
            username,
            name,
            password,
            saveLocalDataToCloud && offlineData ? offlineData.data : undefined
          )
        : await authenticateUser(username, password);

      if (!result.success || !result.user) {
        let msg = result.error || 'Could not sign in. Check your username and password.';
        if (result.error && result.error.includes('Unknown POST action: login')) {
          msg = 'Apps Script update required: In Google Sheet > Extensions > Apps Script > Deploy > Manage deployments > Edit > New version > Deploy.';
        }
        setError(msg);
        setShowCloudPrompt(false);
        return;
      }

      setShowCloudPrompt(false);
      await onAuthenticated(result.user);
    } catch (err: any) {
      let msg = err?.message || 'Could not reach the server. Check your connection or skip to use offline.';
      if (msg.includes('Unknown POST action: login')) {
        msg = 'Apps Script update required: In Google Sheet > Extensions > Apps Script > Deploy > Manage deployments > Edit > New version > Deploy.';
      }
      setError(msg);
      setShowCloudPrompt(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const chosenName = nickname.trim() || 'User';
    try {
      localStorage.setItem('username', chosenName);
    } catch {
      // Ignore storage quota error
    }
    const guestUser = setLocalGuestUser(chosenName);
    if (onSkip) {
      await onSkip(chosenName);
    } else {
      await onAuthenticated(guestUser);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 relative select-none">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Expense Tracker
            </h1>
            <p className="text-xs text-slate-500">
              {showCloudPrompt
                ? 'Cloud Sync Prompt'
                : mode === 'ask_name'
                ? 'Offline Profile Setup'
                : mode === 'login'
                ? 'Sign in to your account'
                : 'Create a new account'}
            </p>
          </div>
        </div>

        {showCloudPrompt ? (
          /* Cloud Data Migration Prompt */
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-blue-950">
              <div className="flex items-center gap-2.5">
                <CloudUpload className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Local data found on device</p>
                  <p className="text-[11px] text-blue-700">
                    {offlineData?.transactionCount || 0} transaction{(offlineData?.transactionCount || 0) === 1 ? '' : 's'} recorded offline.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Do you want to save the data to the cloud?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                We can save your existing offline records directly to your newly signed up account.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 leading-relaxed"
              >
                {error}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={() => executeAuth(true)}
                className="w-full h-10 text-sm font-semibold"
                icon={CloudUpload}
                isLoading={isSubmitting}
              >
                Yes, save data to cloud
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => executeAuth(false)}
                className="w-full h-10 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                isLoading={isSubmitting}
              >
                No, start fresh
              </Button>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowCloudPrompt(false);
                  setError('');
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Back to registration form
              </button>
            </div>
          </div>
        ) : mode === 'ask_name' ? (
          /* Prompt for nickname when skipping */
          <form onSubmit={handleSkipSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="guest-nickname" className="block text-xs font-semibold text-slate-700">
                What should i call you
              </label>
              <Input
                id="guest-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="What should i call you"
                icon={User}
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold"
              icon={ArrowRight}
            >
              Continue
            </Button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Login / Register Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                icon={User}
                autoComplete="name"
                required
              />
            )}

            <Input
              label="Username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or email"
              icon={Mail}
              autoComplete="username"
              required
            />

            <Input
              label="Password"
              type="password"
              icon={KeyRound}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={mode === 'register' ? 8 : undefined}
              required
            />

            {/* Remember me (login mode) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    Remember me
                  </span>
                </label>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 leading-relaxed"
              >
                {error}
              </p>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold"
              icon={mode === 'register' ? UserRoundPlus : ArrowRight}
              isLoading={isSubmitting}
            >
              {mode === 'register' ? 'Create Account' : 'Sign In'}
            </Button>

            {/* Toggle register / sign in */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setShowCloudPrompt(false);
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {mode === 'register'
                  ? 'Already have an account? Sign in'
                  : 'Create new account'}
              </button>
            </div>

            {/* Divider */}
            <div className="relative pt-2 pb-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2.5 text-slate-400 font-medium tracking-wider">
                  or
                </span>
              </div>
            </div>

            {/* Skip button */}
            <button
              type="button"
              onClick={() => {
                setError('');
                setShowCloudPrompt(false);
                setMode('ask_name');
              }}
              className="w-full h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer"
            >
              Skip
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
