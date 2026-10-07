import { TransactionType } from '@/types';

export interface ParsedStatementTransaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  suggestedCategory?: string;
  selected: boolean;
}

export function parseCsvStatement(content: string): ParsedStatementTransaction[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Determine delimiter (comma, semicolon, tab)
  const headerLine = lines[0];
  let delimiter = ',';
  if ((headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length) delimiter = ';';
  if ((headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length) delimiter = '\t';

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(headerLine).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Detect column indexes
  let dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));
  let descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('particular') || h.includes('remark') || h.includes('narrative') || h.includes('detail') || h.includes('info'));
  let amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('txn') || h.includes('sum'));
  let debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('withdrawal') || h.includes('dr'));
  let creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('deposit') || h.includes('cr'));
  let typeIdx = headers.findIndex((h) => h === 'type' || h.includes('txntype') || h.includes('mode'));

  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;

  const results: ParsedStatementTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (cols.length < 2) continue;

    const rawDate = cols[dateIdx] || '';
    const rawDesc = (cols[descIdx] || 'Transaction').replace(/"/g, '').trim();

    let type: TransactionType = 'expense';
    let amount = 0;

    if (debitIdx !== -1 && creditIdx !== -1) {
      const debitVal = parseFloat((cols[debitIdx] || '').replace(/[^0-9.]/g, ''));
      const creditVal = parseFloat((cols[creditIdx] || '').replace(/[^0-9.]/g, ''));

      if (!isNaN(creditVal) && creditVal > 0) {
        amount = creditVal;
        type = 'income';
      } else if (!isNaN(debitVal) && debitVal > 0) {
        amount = debitVal;
        type = 'expense';
      }
    } else if (amountIdx !== -1) {
      const rawAmt = (cols[amountIdx] || '').replace(/,/g, '');
      const parsedAmt = parseFloat(rawAmt.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsedAmt) && parsedAmt !== 0) {
        if (parsedAmt < 0) {
          amount = Math.abs(parsedAmt);
          type = 'expense';
        } else {
          amount = parsedAmt;
          type = 'income';
        }
      }

      if (typeIdx !== -1 && cols[typeIdx]) {
        const tStr = cols[typeIdx].toLowerCase();
        if (tStr.includes('cr') || tStr.includes('deposit') || tStr.includes('in')) type = 'income';
        if (tStr.includes('dr') || tStr.includes('withdraw') || tStr.includes('out')) type = 'expense';
      }
    }

    if (amount <= 0) continue;

    // Normalize date to YYYY-MM-DD
    const normalizedDate = normalizeDateString(rawDate);

    results.push({
      id: `stmt-${Date.now()}-${i}`,
      date: normalizedDate,
      type,
      amount,
      description: rawDesc,
      selected: true,
    });
  }

  return results;
}

export function parseRawTextStatement(text: string): ParsedStatementTransaction[] {
  const lines = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedStatementTransaction[] = [];
  let itemCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for date pattern (e.g. 2024-05-12 or 12/05/2024 or 12-May-2024)
    const dateMatch = line.match(/\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}-[A-Za-z]{3}-\d{2,4})\b/);
    if (!dateMatch) continue;

    const rawDate = dateMatch[1];
    const normalizedDate = normalizeDateString(rawDate);

    // Look for amounts
    const amountMatches = line.match(/(?:(?:npr|rs|\$|inr)\.?\s*)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/gi);
    if (!amountMatches) continue;

    let type: TransactionType = 'expense';
    if (/credit|cr\.|deposit|received|inward|refund/i.test(line)) {
      type = 'income';
    } else if (/debit|dr\.|withdraw|paid|purchase|fee|charges/i.test(line)) {
      type = 'expense';
    }

    // Grab first valid numeric amount
    let foundAmount = 0;
    for (const match of amountMatches) {
      const clean = match.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && parsed > 0 && parsed < 100000000) {
        foundAmount = parsed;
        break;
      }
    }

    if (foundAmount <= 0) continue;

    // Cleanup description
    let cleanDesc = line
      .replace(dateMatch[0], '')
      .replace(/(?:npr|rs|\$|inr)\.?\s*[0-9,.]+/gi, '')
      .replace(/\b(debit|credit|dr|cr|bal|balance)\b/gi, '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanDesc || cleanDesc.length < 3) {
      cleanDesc = type === 'expense' ? 'Bank Debit' : 'Bank Credit';
    }

    itemCounter++;
    results.push({
      id: `text-stmt-${Date.now()}-${itemCounter}`,
      date: normalizedDate,
      type,
      amount: foundAmount,
      description: cleanDesc.slice(0, 50),
      selected: true,
    });
  }

  return results;
}

function normalizeDateString(input: string): string {
  try {
    const clean = input.trim().replace(/[.]/g, '-').replace(/[/]/g, '-');
    const parts = clean.split('-');

    // Format YYYY-MM-DD
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${y}-${m}-${d}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY or MM-DD-YYYY
        const y = parts[2];
        const m = parts[1].padStart(2, '0');
        const d = parts[0].padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch {}

  return new Date().toISOString().slice(0, 10);
}
