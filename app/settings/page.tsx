'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  AppUser,
  resetToDefaultSeedData,
  signOutUser,
  getCurrentAppUser,
  isGuestUser,
  updateUserProfile,
} from '@/lib/api';
import {
  PROFILE_AVATAR_OPTIONS,
  PROFILE_BANNER_PRESETS,
  ProfileAvatar,
  getBannerStyle,
} from '@/lib/profile-avatars';
import {
  THEME_OPTIONS,
  getSavedTheme,
  applyTheme,
} from '@/lib/themes';
import {
  Settings,
  CircleDollarSign,
  Database,
  Download,
  RotateCcw,
  Check,
  User as UserIcon,
  Camera,
  CheckCircle2,
  Palette,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const PRESET_CURRENCIES = [
  { code: 'NPR', symbol: 'Rs.', name: 'Nepalese Rupee (NPR)', position: 'prefix' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', position: 'prefix' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', position: 'prefix' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', position: 'prefix' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', position: 'prefix' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)', position: 'prefix' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)', position: 'prefix' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', position: 'prefix' },
];

export default function SettingsPage() {
  const { settings, updateSettings, refreshData, transactions, accounts, categories } = useApp();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Profile editing state
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined);
  const [profilePreset, setProfilePreset] = useState<string>('default');
  const [profileBanner, setProfileBanner] = useState<string>('midnight');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Theme state
  const [activeTheme, setActiveTheme] = useState<string>('default');

  useEffect(() => {
    const user = getCurrentAppUser();
    setCurrentUser(user);
    if (user) {
      setProfileName(user.name || '');
      setProfileAvatar(user.avatar);
      setProfilePreset(user.avatarPreset || 'default');
      setProfileBanner(user.banner || 'midnight');
    }
    setActiveTheme(getSavedTheme());
  }, []);

  // Currency form state
  const [currency, setCurrency] = useState(settings.currency || 'NPR');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'Rs.');
  const [currencyPosition, setCurrencyPosition] = useState<'prefix' | 'suffix'>(
    settings.currencyPosition || 'prefix'
  );
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  // Reset dialog state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      setProfileAvatar(res);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Please choose a banner image under 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      setProfileBanner(res);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setIsSavingProfile(true);
    try {
      const updated = updateUserProfile({
        name: profileName.trim(),
        avatar: profileAvatar,
        avatarPreset: profilePreset,
        banner: profileBanner,
      });
      if (updated) setCurrentUser(updated);
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 3000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
  };

  const handlePresetChange = (code: string) => {
    const found = PRESET_CURRENCIES.find((c) => c.code === code);
    if (found) {
      setCurrency(found.code);
      setCurrencySymbol(found.symbol);
      setCurrencyPosition(found.position as 'prefix' | 'suffix');
    } else {
      setCurrency(code);
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCurrency(true);
    try {
      await updateSettings({
        currency,
        currencySymbol,
        currencyPosition,
      });
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await resetToDefaultSeedData();
      await refreshData();
      setIsResetDialogOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportJson = () => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      accounts,
      categories,
      transactions,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `expense_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Personalize your identity, custom banners, themes, and display settings"
        icon={Settings}
      />

      {/* User Profile & Banner Card */}
      <Card className="overflow-hidden">
        {/* Profile Banner Header */}
        <div
          className="relative h-28 sm:h-36 w-full border-b border-slate-200/80 transition-all duration-300"
          style={getBannerStyle(profileBanner)}
        >
          {/* Subtle lighting overlay */}
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />

          {/* Banner Edit Button */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-medium bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Upload custom banner image"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Banner</span>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerFile}
              className="hidden"
            />
          </div>
        </div>

        <CardContent className="pt-0 relative">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Row (Floating over banner) */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12 pb-2">
              <div className="flex items-end gap-3.5">
                <div className="relative group">
                  <ProfileAvatar
                    avatar={profileAvatar}
                    presetId={profilePreset}
                    name={profileName}
                    size="xl"
                    className="ring-4 ring-white shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload profile picture"
                    className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-full shadow-md hover:bg-slate-800 transition-colors cursor-pointer border-2 border-white"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </div>

                <div className="mb-1">
                  <h3 className="text-base font-bold text-slate-900">
                    {profileName || 'Your Profile'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentUser?.email || 'local@device'}
                  </p>
                </div>
              </div>

              <Badge variant={isGuestUser() ? 'secondary' : 'default'} className="self-start sm:self-end">
                {isGuestUser() ? 'Offline Mode' : currentUser?.role === 'owner' ? '👑 Owner' : 'Personal Account'}
              </Badge>
            </div>

            {/* Banner Presets Selection */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile Banner Style</span>
                </p>
                <span className="text-[11px] text-slate-400">Shows behind your profile in the sidebar</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PROFILE_BANNER_PRESETS.map((preset) => {
                  const isSelected = profileBanner === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setProfileBanner(preset.id)}
                      className={`h-11 rounded-lg border text-left p-1.5 transition-all relative overflow-hidden cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 ring-2 ring-slate-900/20 scale-[1.03] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 opacity-90 hover:opacity-100'
                      }`}
                      style={{ background: preset.previewBg }}
                    >
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-semibold text-white/90 drop-shadow-xs">
                        {preset.name.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-white text-slate-900 rounded-full flex items-center justify-center text-[8px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Profile Icon Selection */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Custom Profile Icon (Or Default)</span>
                </p>
                {profileAvatar && (
                  <button
                    type="button"
                    onClick={() => setProfileAvatar(undefined)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Clear Custom Photo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Choose a sleek designer avatar icon. The first icon is the new default profile icon:
              </p>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                {PROFILE_AVATAR_OPTIONS.map((opt) => {
                  const isSelected = profilePreset === opt.id && !profileAvatar;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setProfilePreset(opt.id);
                        setProfileAvatar(undefined);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/15 scale-105 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                      }`}
                      title={opt.name}
                    >
                      <ProfileAvatar presetId={opt.id} size="md" />
                      <span className="text-[10px] text-slate-700 font-medium truncate max-w-full">
                        {opt.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <Input
                label="What should we call you?"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
                required
              />
              <Input
                label="Account Identifier"
                value={currentUser?.email || 'local@device'}
                disabled
                helperText="Read-only account identifier"
              />
            </div>

            {/* Profile Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {profileSavedToast ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Profile updated successfully!
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Custom banner & avatar will appear across the sidebar and dashboard.
                </span>
              )}
              <Button type="submit" size="sm" icon={Check} isLoading={isSavingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Theme Customizer Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <CardTitle>Themes & Aesthetics</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred color theme and visual style for the entire web app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((theme) => {
              const isActive = activeTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{theme.name}</span>
                    {isActive && (
                      <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Theme Color Palette Preview */}
                  <div
                    className="h-12 w-full rounded-lg border border-slate-200/60 p-2 flex items-center justify-between mb-2 shadow-2xs"
                    style={{ background: theme.previewBg }}
                  >
                    <div
                      className="h-6 w-12 rounded border border-white/20"
                      style={{ background: theme.previewCard }}
                    />
                    <div
                      className="h-4 w-4 rounded-full shadow-2xs"
                      style={{ background: theme.accent }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    {theme.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Currency Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-slate-700" />
            <CardTitle>Currency & Display</CardTitle>
          </div>
          <CardDescription>
            Choose your default currency, symbol, and placement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCurrency} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Currency Preset"
                value={currency}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {PRESET_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Currency Symbol"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. Rs. or $"
                required
              />

              <Select
                label="Symbol Position"
                value={currencyPosition}
                onChange={(e) => setCurrencyPosition(e.target.value as 'prefix' | 'suffix')}
              >
                <option value="prefix">Prefix (e.g. Rs. 50,000)</option>
                <option value="suffix">Suffix (e.g. 50,000 Rs.)</option>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Preview: <strong className="text-slate-900">{currencyPosition === 'prefix' ? `${currencySymbol} 12,450` : `12,450 ${currencySymbol}`}</strong>
              </span>
              <Button type="submit" size="sm" icon={Check} isLoading={isSavingCurrency}>
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Data Management & Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-700" />
            <CardTitle>Data Management</CardTitle>
          </div>
          <CardDescription>
            Export and backup your financial records, or reset local cached data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportJson}
              className="justify-start h-11"
            >
              <div className="text-left">
                <div className="font-medium text-slate-900">Export JSON Backup</div>
                <div className="text-[11px] text-slate-500 font-normal">Download accounts, categories & transactions</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => setIsResetDialogOpen(true)}
              className="justify-start h-11 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <div className="text-left">
                <div className="font-medium text-rose-700">Clear Local Cache</div>
                <div className="text-[11px] text-rose-500 font-normal">Reset local state and re-sync from server</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Session Card */}
      <Card>
        <CardHeader>
          <CardTitle>{isGuestUser() ? 'Account Status' : 'Account'}</CardTitle>
          <CardDescription>
            {isGuestUser() ? (
              <>Currently running on this device. Sign up anytime to backup your data across devices.</>
            ) : (
              <>Signed in as <strong className="text-slate-800">{currentUser?.name ? `${currentUser.name} (${currentUser.email})` : (currentUser?.email || 'User')}</strong></>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {isGuestUser()
              ? 'Data is saved securely on this device.'
              : 'Signed in on this browser.'}
          </p>
          <Button type="button" variant={isGuestUser() ? 'primary' : 'outline'} size="sm" onClick={() => { void signOutUser(); }}>
            {isGuestUser() ? 'Sign Up' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetData}
        title="Clear Local Data"
        description="This will clear your locally cached transactions and reload fresh data from the server. Are you sure you want to proceed?"
        confirmLabel="Clear Cache"
        isLoading={isResetting}
      />
    </div>
  );
}
