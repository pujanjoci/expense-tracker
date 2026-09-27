import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'An unexpected error occurred while loading your financial data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center my-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900">Failed to load data</h3>
      <p className="mt-1 max-w-md text-xs sm:text-sm text-rose-700">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button onClick={onRetry} variant="outline" size="sm" icon={RefreshCw}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
