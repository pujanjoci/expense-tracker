'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Check } from 'lucide-react';
import { parseAmountSafe, parseDateSafe } from '@/lib/utils';
import { format } from 'date-fns';
import { TransactionType } from '@/types';

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatementImportModal({ isOpen, onClose }: StatementImportModalProps) {
  const { accounts, categories, transactions, createTransactionsBulk } = useApp();

  const [csvRawText, setCsvRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);

  // Column mappings
  const [dateCol, setDateCol] = useState<number>(0);
  const [descCol, setDescCol] = useState<number>(1);
  const [amountCol, setAmountCol] = useState<number>(2);
  const [typeCol, setTypeCol] = useState<number>(-1);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [defaultType, setDefaultType] = useState<TransactionType>('expense');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      setCsvRawText(text);

      // Parse lines
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setError('CSV file must have a header row and at least one data row.');
        return;
      }

      // Simple CSV line parser respecting quotes
      const parseLine = (line: string) => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const parsedHeaders = parseLine(lines[0]);
      setHeaders(parsedHeaders);

      const parsedRows = lines.slice(1).map(parseLine);
      setRows(parsedRows);

      // Auto-detect columns by common header keywords
      parsedHeaders.forEach((h, idx) => {
        const lower = h.toLowerCase();
        if (lower.includes('date') || lower.includes('time')) setDateCol(idx);
        else if (lower.includes('desc') || lower.includes('particular') || lower.includes('narration') || lower.includes('remark') || lower.includes('detail')) setDescCol(idx);
        else if (lower.includes('amount') || lower.includes('debit') || lower.includes('credit') || lower.includes('sum')) setAmountCol(idx);
        else if (lower.includes('type') || lower.includes('dr/cr')) setTypeCol(idx);
      });
    };
    reader.readAsText(file);
  };

  // Preview parsed transactions & duplicate detection
  const parsedPreview = useMemo(() => {
    if (rows.length === 0) return [];

    return rows.map((r) => {
      const dateVal = r[dateCol] || '';
      const descVal = r[descCol] || 'Bank Import';
      const rawAmt = r[amountCol] || '0';
      const amt = Math.abs(parseAmountSafe(rawAmt));

      let txType: TransactionType = defaultType;
      if (typeCol >= 0 && r[typeCol]) {
        const tVal = r[typeCol].toLowerCase();
        if (tVal.includes('cr') || tVal.includes('credit') || tVal.includes('income') || tVal.includes('deposit')) {
          txType = 'income';
        } else {
          txType = 'expense';
        }
      } else {
        // If raw amount is negative, might be debit/expense
        if (rawAmt.includes('-') || rawAmt.includes('(')) {
          txType = 'expense';
        }
      }

      let parsedDate = '';
      try {
        parsedDate = format(parseDateSafe(dateVal), 'yyyy-MM-dd');
      } catch {
        parsedDate = format(new Date(), 'yyyy-MM-dd');
      }

      // Check for duplicate in existing transactions
      const isDuplicate = transactions.some((existing) => {
        const dateMatch = existing.date === parsedDate;
        const amtMatch = Math.abs(parseAmountSafe(existing.amount) - amt) < 0.01;
        const descMatch = (existing.description || '').toLowerCase() === descVal.toLowerCase();
        return dateMatch && amtMatch && descMatch;
      });

      return {
        date: parsedDate,
        description: descVal,
        amount: amt,
        type: txType,
        isDuplicate,
      };
    });
  }, [rows, dateCol, descCol, amountCol, typeCol, defaultType, transactions]);

  const duplicatesCount = parsedPreview.filter((p) => p.isDuplicate).length;
  const nonDuplicateCount = parsedPreview.length - duplicatesCount;

  const handleImport = async (skipDuplicates: boolean) => {
    if (!selectedAccountId) {
      setError('Please select an account to import these transactions into.');
      return;
    }

    const itemsToImport = skipDuplicates
      ? parsedPreview.filter((p) => !p.isDuplicate)
      : parsedPreview;

    if (itemsToImport.length === 0) {
      setError('No transactions available to import.');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const payload = itemsToImport.map((p) => ({
        date: p.date,
        type: p.type,
        accountId: selectedAccountId,
        amount: p.amount,
        description: p.description,
        tags: ['statement-import'],
      }));

      await createTransactionsBulk(payload);
      setImportResult({
        imported: itemsToImport.length,
        duplicates: duplicatesCount,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to import transactions');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setCsvRawText('');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setImportResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Import Bank Statement (CSV)"
    >
      <div className="space-y-4 pt-1">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {importResult ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Import Complete!</h3>
            <p className="text-xs text-muted-foreground">
              Successfully imported <strong className="text-emerald-400">{importResult.imported}</strong> transactions.
              {importResult.duplicates > 0 && ` (${importResult.duplicates} duplicates detected)`}
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          /* File Upload Drop Area */
          <div className="border-2 border-dashed border-border/60 hover:border-violet-500/50 rounded-2xl p-8 text-center transition-colors bg-surface-2/30">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="p-3 rounded-2xl bg-violet-500/15 text-violet-400 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Click to upload your bank statement CSV
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Standard CSV files from Chase, HDFC, SBI, Nabil, or any bank
              </p>
            </label>
          </div>
        ) : (
          /* Mapping & Preview */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
              <span>File: <strong>{fileName}</strong> ({rows.length} rows)</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-violet-400 hover:text-violet-300 underline cursor-pointer"
              >
                Change File
              </button>
            </div>

            {/* Target Account & Default Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Import into Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-surface border border-border/60 text-foreground"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Default Type
                </label>
                <select
                  value={defaultType}
                  onChange={(e) => setDefaultType(e.target.value as TransactionType)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-surface border border-border/60 text-foreground"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            {/* Column Mappings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-surface-2/40 border border-border/40">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Date</label>
                <select
                  value={dateCol}
                  onChange={(e) => setDateCol(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded text-xs bg-surface border border-border/60 text-foreground"
                >
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Col ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Description</label>
                <select
                  value={descCol}
                  onChange={(e) => setDescCol(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded text-xs bg-surface border border-border/60 text-foreground"
                >
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Col ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Amount</label>
                <select
                  value={amountCol}
                  onChange={(e) => setAmountCol(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded text-xs bg-surface border border-border/60 text-foreground"
                >
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Col ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Type (Optional)</label>
                <select
                  value={typeCol}
                  onChange={(e) => setTypeCol(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded text-xs bg-surface border border-border/60 text-foreground"
                >
                  <option value={-1}>None (use default)</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Col ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview First 5 Rows */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Preview (First 5 of {parsedPreview.length} rows)</span>
                {duplicatesCount > 0 && (
                  <span className="text-amber-400 font-medium">
                    ⚠️ {duplicatesCount} potential duplicate{duplicatesCount > 1 ? 's' : ''} detected
                  </span>
                )}
              </div>
              <div className="border border-border/40 rounded-xl overflow-hidden text-xs max-h-40 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-2 text-muted-foreground text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Type</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {parsedPreview.slice(0, 5).map((p, idx) => (
                      <tr key={idx} className={p.isDuplicate ? 'bg-amber-500/5' : ''}>
                        <td className="p-2 tabular-nums">{p.date}</td>
                        <td className="p-2 truncate max-w-[140px]">{p.description}</td>
                        <td className="p-2 capitalize">{p.type}</td>
                        <td className="p-2 text-right font-medium tabular-nums">{p.amount}</td>
                        <td className="p-2 text-center">
                          {p.isDuplicate ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                              Duplicate
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isImporting}
                className="cursor-pointer"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                {duplicatesCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleImport(true)}
                    disabled={isImporting || nonDuplicateCount === 0}
                    className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 cursor-pointer text-xs"
                  >
                    Skip Duplicates ({nonDuplicateCount})
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleImport(false)}
                  disabled={isImporting}
                  className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer text-xs"
                >
                  {isImporting ? 'Importing...' : `Import All (${parsedPreview.length})`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
