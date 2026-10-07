'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AppUser, testGoogleScriptConnection, resetToDefaultSeedData, signOutUser, getCurrentAppUser, isGuestUser } from '@/lib/api';
import {
  Settings,
  CircleDollarSign,
  Database,
  RefreshCw,
  Download,
  RotateCcw,
  Check,
  AlertTriangle,
  Cloud,
  MailCheck,
  Zap,
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
  const { settings, updateSettings, refreshData, syncBankEmails, transactions, accounts, categories } = useApp();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  useEffect(() => { setCurrentUser(getCurrentAppUser()); }, []);

  // Currency form state
  const [currency, setCurrency] = useState(settings.currency || 'NPR');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'Rs.');
  const [currencyPosition, setCurrencyPosition] = useState<'prefix' | 'suffix'>(
    settings.currencyPosition || 'prefix'
  );

  // Cloud API Endpoint
  const [endpointUrl, setEndpointUrl] = useState(settings.googleSheetsUrl || '');
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  // Reset dialog state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleSaveEndpointUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUrl(true);
    try {
      await updateSettings({
        googleSheetsUrl: endpointUrl.trim(),
      });
      await refreshData();
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleTestConnection = async () => {
    if (!endpointUrl.trim()) {
      setTestStatus({
        tested: true,
        success: false,
        message: 'Please provide a valid sync endpoint URL first.',
      });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await testGoogleScriptConnection(endpointUrl.trim());
      setTestStatus({
        tested: true,
        success: res.success,
        message: res.message,
      });
    } finally {
      setIsTesting(false);
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
        description="Manage your currency preferences, sync configuration, and data backups"
        icon={Settings}
      />

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
              {/* Preset selector */}
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

              {/* Currency Symbol */}
              <Input
                label="Currency Symbol"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. Rs. or $"
                required
              />

              {/* Symbol Placement */}
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

      {/* Sync Endpoint (only for signed-in accounts) */}
      {!isGuestUser() && (
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-600" />
              <CardTitle>Sync Endpoint</CardTitle>
            </div>
            <Badge variant={settings.googleSheetsUrl ? 'success' : 'secondary'}>
              {settings.googleSheetsUrl ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
          <CardDescription>
            Configure the shared sync service. User accounts keep each person's records distinct and private.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSaveEndpointUrl} className="space-y-4">
            <Input
              label="Endpoint URL"
              placeholder="https://your-backend-endpoint/exec"
              value={endpointUrl}
              onChange={(e) => {
                setEndpointUrl(e.target.value);
                setTestStatus(null);
              }}
              helperText="Usually set by the app deployment. A custom endpoint overrides it in this browser."
            />

            {/* Test Status Banner */}
            {testStatus && (
              <div
                className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                  testStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                isLoading={isTesting}
                icon={RefreshCw}
              >
                Test Connection
              </Button>
              <Button type="submit" size="sm" icon={Check} isLoading={isSavingUrl}>
                Save Endpoint
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Automated Email Tracking */}
      {currentUser?.role === 'owner' && <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MailCheck className="w-5 h-5 text-emerald-600" />
            <CardTitle>Automated Bank & Wallet Tracking</CardTitle>
          </div>
          <CardDescription>
            Automatically parse transactions from incoming bank alert emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Smart Tracking Features:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Automatically extracts debits, credits, amounts, and dates.</li>
              <li>Detects personal eSewa top-ups as transfers to your wallet.</li>
              <li>Automatically categorizes expenses (Food & Dining, Utilities, Fuel, Groceries, etc.).</li>
              <li>Deduplicates alert emails so each transaction is recorded exactly once.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Scan Alert Emails Now</p>
              <p className="text-[11px] text-slate-500">Trigger an on-demand scan of your recent alert emails</p>
            </div>
            <Button
              type="button"
              size="sm"
              icon={MailCheck}
              onClick={() => syncBankEmails()}
              disabled={!settings.googleSheetsUrl}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>}

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

      <Card>
        <CardHeader>
          <CardTitle>{isGuestUser() ? 'Cloud Sync' : 'Account'}</CardTitle>
          <CardDescription>
            {isGuestUser() ? (
              <>Do you need to sync to the cloud? <strong>Sign up</strong> to access and backup your data across devices.</>
            ) : (
              <>Signed in as <strong className="text-slate-800">{currentUser?.name ? `${currentUser.name} (${currentUser.email})` : (currentUser?.email || 'User')}</strong> &bull; Role: <span className="capitalize font-semibold text-slate-700">{currentUser?.role || 'user'}</span></>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {isGuestUser()
              ? 'Currently saving data on this device only.'
              : 'Sign out before using this browser with another account.'}
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
