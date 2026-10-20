import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Account, Category } from '@/types';
import { format } from 'date-fns';

export function exportTransactionsPDF({
  transactions,
  accounts,
  categories,
  currencySymbol = 'Rs.',
  title = 'Financial Transactions Report',
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencySymbol?: string;
  title?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const accountMap = new Map<string, string>();
  accounts.forEach((a) => accountMap.set(a.id, a.name));

  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  // Compute summary metrics
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') totalIncome += amt;
    else if (tx.type === 'expense') totalExpense += amt;
  });
  const net = totalIncome - totalExpense;

  // Header Title & Aurora Banner
  doc.setFillColor(15, 23, 42); // deep ink
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on ${format(new Date(), 'dd MMMM yyyy, HH:mm')} • ${transactions.length} records`, 14, 26);

  // Summary KPI Cards in PDF
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 58, 20, 2, 2, 'FD');
  doc.roundedRect(76, 42, 58, 20, 2, 2, 'FD');
  doc.roundedRect(138, 42, 58, 20, 2, 2, 'FD');

  // Income Card
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INCOME', 18, 48);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`${currencySymbol} ${totalIncome.toLocaleString('en-IN')}`, 18, 56);

  // Expense Card
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL EXPENSES', 80, 48);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(244, 63, 94);
  doc.text(`${currencySymbol} ${totalExpense.toLocaleString('en-IN')}`, 80, 56);

  // Net Card
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('NET BALANCE', 142, 48);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(net >= 0 ? 16 : 244, net >= 0 ? 185 : 63, net >= 0 ? 129 : 94);
  doc.text(`${currencySymbol} ${net.toLocaleString('en-IN')}`, 142, 56);

  // Transactions Table
  const tableRows = transactions.map((tx) => [
    tx.date,
    tx.description || (tx.type === 'transfer' ? 'Transfer' : 'Transaction'),
    tx.type.toUpperCase(),
    categoryMap.get(tx.categoryId || '') || '-',
    accountMap.get(tx.accountId) || tx.accountId,
    `${tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : ''}${currencySymbol} ${Number(tx.amount || 0).toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Date', 'Description', 'Type', 'Category', 'Account', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`transactions_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
