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
  Sun,
  Moon,
  ScrollText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

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
  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark'>('all');
  const [themeChangedToast, setThemeChangedToast] = useState(false);

  useEffect(() => {
    const user = getCurrentAppUser();
    setCurrentUser(user);
    if (user) {
      const isGuest = isGuestUser();
      setProfileName(user.name || '');
      setProfileAvatar(isGuest ? undefined : user.avatar);
      setProfilePreset(isGuest ? 'default' : (user.avatarPreset || 'default'));
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
      const isGuest = isGuestUser();
      const updated = updateUserProfile({
        name: profileName.trim(),
        avatar: isGuest ? undefined : profileAvatar,
        avatarPreset: isGuest ? 'default' : profilePreset,
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
    setThemeChangedToast(true);
    setTimeout(() => setThemeChangedToast(false), 2400);
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

  const selectedThemeObj = THEME_OPTIONS.find((t) => t.id === activeTheme) || THEME_OPTIONS[0];

  const lightCount = THEME_OPTIONS.filter((t) => !t.isDark).length;
  const darkCount = THEME_OPTIONS.filter((t) => t.isDark).length;

  const filteredThemes = THEME_OPTIONS.filter((theme) => {
    if (themeFilter === 'light') return !theme.isDark;
    if (themeFilter === 'dark') return theme.isDark;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
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
                    avatar={isGuestUser() ? undefined : profileAvatar}
                    presetId={isGuestUser() ? 'default' : profilePreset}
                    name={profileName}
                    size="xl"
                    className="ring-4 ring-white dark:ring-slate-900 shadow-md"
                  />
                  {!isGuestUser() && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload profile picture"
                        className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-full shadow-md hover:bg-slate-800 transition-colors cursor-pointer border-2 border-white dark:border-slate-800"
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
                    </>
                  )}
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

            {/* Profile Avatar Icon Section */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile Avatar</span>
                </p>
                {isGuestUser() ? (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    Single Default Icon
                  </Badge>
                ) : profileAvatar ? (
                  <button
                    type="button"
                    onClick={() => setProfileAvatar(undefined)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Clear Custom Photo
                  </button>
                ) : null}
              </div>

              {isGuestUser() ? (
                /* Non-signed-in users get that single default icon, not many choosable icons */
                <div className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="h-11 w-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs shrink-0">
                    <ProfileAvatar presetId="default" size="md" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      Standard Default Profile Icon
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Standard single icon for users who are not signed in. Connect your account to customize cloud avatars.
                    </p>
                  </div>
                </div>
              ) : (
                /* Signed-in users can choose from the avatar options */
                <>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Choose a designer avatar icon or keep the standard default profile icon:
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
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                            isSelected
                              ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 scale-105 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                          title={opt.name}
                        >
                          <ProfileAvatar presetId={opt.id} size="md" />
                          <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium truncate max-w-full">
                            {opt.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
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
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Themes & Financial Aesthetics</CardTitle>
                <CardDescription>
                  Tailor your workspace atmosphere, contrast, and tactile financial surfaces
                </CardDescription>
              </div>
            </div>

            {/* Quick Dark / Light Switch */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleThemeChange(selectedThemeObj.isDark ? 'paper' : 'aurora-dark')}
                icon={selectedThemeObj.isDark ? Sun : Moon}
              >
                {selectedThemeObj.isDark ? 'Switch to Paper Light' : 'Switch to Obsidian Dark'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Featured Active Theme Hero Showcase */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 bg-gradient-to-br from-slate-50 via-white to-slate-100/60 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950 shadow-xs">
            {/* Ambient accent glow matching selected theme */}
            <div
              className="absolute -right-16 -top-16 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-500"
              style={{ backgroundColor: selectedThemeObj.accent }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Left active metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs">
                    Current Active Theme
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs">
                    {selectedThemeObj.isDark ? (
                      <Moon className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-500" />
                    )}
                    {selectedThemeObj.isDark ? 'Dark Terminal' : 'Light Canvas'}
                  </span>
                  {selectedThemeObj.badge && (
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs"
                      style={{
                        borderColor: `${selectedThemeObj.accent}40`,
                        backgroundColor: `${selectedThemeObj.accent}15`,
                        color: selectedThemeObj.accent,
                      }}
                    >
                      {selectedThemeObj.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    {selectedThemeObj.name}
                    <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                      [{selectedThemeObj.tag}]
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                    {selectedThemeObj.description}
                  </p>
                </div>

                {/* Color swatches strip */}
                <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Palette Tokens:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs" style={{ backgroundColor: selectedThemeObj.accent }} />
                      <span className="font-mono text-[10px]">Accent</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs" style={{ backgroundColor: selectedThemeObj.incomeColor }} />
                      <span className="font-mono text-[10px]">Income</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs" style={{ backgroundColor: selectedThemeObj.expenseColor }} />
                      <span className="font-mono text-[10px]">Expense</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs" style={{ backgroundColor: selectedThemeObj.previewCard }} />
                      <span className="font-mono text-[10px]">Surface</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs" style={{ backgroundColor: selectedThemeObj.previewBg }} />
                      <span className="font-mono text-[10px]">Canvas</span>
                    </div>
                  </div>

                  {themeChangedToast && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 ml-auto animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Theme applied!
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Quick Switch Button */}
              <div className="sm:hidden self-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleThemeChange(selectedThemeObj.isDark ? 'paper' : 'aurora-dark')}
                  icon={selectedThemeObj.isDark ? Sun : Moon}
                >
                  {selectedThemeObj.isDark ? 'Switch to Paper Light' : 'Switch to Dark Obsidian'}
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills & Counter */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
              <button
                type="button"
                onClick={() => setThemeFilter('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                  themeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                All Themes ({THEME_OPTIONS.length})
              </button>
              <button
                type="button"
                onClick={() => setThemeFilter('light')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
                  themeFilter === 'light'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Light & Paper ({lightCount})
              </button>
              <button
                type="button"
                onClick={() => setThemeFilter('dark')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
                  themeFilter === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Dark Terminals ({darkCount})
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Click any theme card to preview instantly
            </span>
          </div>

          {/* Theme Grid with Miniature Realistic Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((theme) => {
              const isActive = activeTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={cn(
                    'group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer overflow-hidden',
                    isActive
                      ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/25 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-2xs'
                  )}
                >
                  {/* Top Header inside Card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                        {theme.name}
                      </span>
                      {theme.id === 'paper' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <ScrollText className="w-2.5 h-2.5" />
                          Paper
                        </span>
                      )}
                    </div>

                    {/* Active status or Mode badge */}
                    {isActive ? (
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                        {theme.isDark ? 'Dark' : 'Light'}
                      </span>
                    )}
                  </div>

                  {/* Realistic Mini Dashboard Mockup */}
                  <div
                    className="relative h-28 w-full rounded-xl overflow-hidden border p-2 mb-3 select-none flex flex-col justify-between transition-transform duration-200 group-hover:scale-[1.01]"
                    style={{
                      backgroundColor: theme.previewBg,
                      borderColor: theme.previewBorder,
                    }}
                  >
                    {/* Top mini browser / status bar */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shadow-2xs" style={{ backgroundColor: theme.accent }} />
                        <span className="w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: theme.previewText }} />
                        <span className="w-1 h-1 rounded-full opacity-25" style={{ backgroundColor: theme.previewText }} />
                      </div>
                      <span
                        className="text-[9px] font-mono tracking-tight font-medium"
                        style={{ color: theme.previewMuted }}
                      >
                        {theme.tag}
                      </span>
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          color: theme.previewMuted,
                        }}
                      >
                        {theme.isDark ? 'TERMINAL' : 'CANVAS'}
                      </span>
                    </div>

                    {/* Middle mini layout (Mini sidebar + Mini card) */}
                    <div className="flex items-stretch gap-2 my-auto">
                      {/* Mini sidebar silhouette */}
                      <div
                        className="w-4 rounded-md flex flex-col items-center gap-1 py-1"
                        style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                      >
                        <div className="w-2 h-1.5 rounded-[1px]" style={{ backgroundColor: theme.accent }} />
                        <div className="w-1.5 h-1 rounded-[1px] opacity-35" style={{ backgroundColor: theme.previewText }} />
                        <div className="w-1.5 h-1 rounded-[1px] opacity-35" style={{ backgroundColor: theme.previewText }} />
                      </div>

                      {/* Mini wealth card */}
                      <div
                        className="flex-1 rounded-lg p-2 border shadow-2xs flex flex-col justify-between"
                        style={{
                          backgroundColor: theme.previewCard,
                          borderColor: theme.previewBorder,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[8px] font-semibold uppercase tracking-wider"
                            style={{ color: theme.previewMuted }}
                          >
                            Net Balance
                          </span>
                          <span
                            className="w-1.5 h-1.5 rounded-full shadow-xs"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <div
                          className="font-display font-bold text-xs tracking-tight"
                          style={{ color: theme.previewText }}
                        >
                          Rs. 142,500
                        </div>
                        {/* Mini income / expense indicator */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            className="text-[8px] font-bold"
                            style={{ color: theme.incomeColor }}
                          >
                            ▲ +82k
                          </span>
                          <span
                            className="text-[8px] font-bold"
                            style={{ color: theme.expenseColor }}
                          >
                            ▼ -34k
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom color accent bar */}
                    <div className="flex items-center justify-between text-[8px] pt-1 border-t border-black/5 dark:border-white/5 font-mono">
                      <span style={{ color: theme.previewMuted }}>Colorway</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: theme.accent }} title="Accent" />
                        <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: theme.incomeColor }} title="Income" />
                        <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: theme.expenseColor }} title="Expense" />
                      </div>
                    </div>
                  </div>

                  {/* Description & Action Footer */}
                  <div className="space-y-2 mt-auto">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {theme.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {theme.accent}
                      </span>
                      <span className={cn(
                        'text-[11px] font-semibold transition-colors',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                      )}>
                        {isActive ? 'Active theme' : 'Click to apply →'}
                      </span>
                    </div>
                  </div>
                </div>
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
