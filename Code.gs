/**
 * Expense Tracker - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Extensions > Apps Script
 * 3. Replace all code with this file
 * 4. Run `reprocessAllEmails` to clear duplicates and scan existing Gmail alert emails fresh
 * 5. Run `setupAutoTrigger` to enable automatic 15-minute background email syncing
 * 6. Deploy > Manage Deployments > Edit > New Version > Deploy (Access: Anyone)
 */

var USER_ESEWA_ID = '9860928584';

var SHEET_NAMES = {
  TRANSACTIONS: 'Transactions',
  ACCOUNTS: 'Accounts',
  CATEGORIES: 'Categories',
  SETTINGS: 'Settings',
  PROCESSED_EMAILS: 'ProcessedEmails'
};

var HEADERS = {
  TRANSACTIONS: ['id', 'date', 'type', 'accountId', 'categoryId', 'amount', 'description', 'transferToAccountId', 'createdAt'],
  ACCOUNTS: ['id', 'name', 'type', 'openingBalance', 'currency', 'active'],
  CATEGORIES: ['id', 'name', 'type', 'icon', 'active'],
  SETTINGS: ['key', 'value'],
  PROCESSED_EMAILS: ['messageId', 'subject', 'date', 'amount', 'status']
};

/**
 * Creates a custom "Expense Tracker" menu in the Google Sheets toolbar
 */
function onOpen(e) {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Expense Tracker')
      .addItem('Sync Bank Emails Now', 'menuSyncBankEmails')
      .addItem('Remove Duplicate Transactions', 'menuCleanDuplicates')
      .addSeparator()
      .addItem('Enable 15-Minute Auto-Sync Trigger', 'menuSetupAutoTrigger')
      .addItem('Disable Auto-Sync Trigger', 'menuRemoveAutoTrigger')
      .addSeparator()
      .addItem('Reprocess All Emails (Fresh Import - No Duplicates)', 'menuReprocessAllEmails')
      .addItem('Clean Accounts to Nabil & eSewa (0 Balance)', 'menuCleanAccounts')
      .addToUi();
  } catch (err) {
    // headless context
  }
}

function menuSyncBankEmails() {
  var res = syncBankEmailsFromGmail(false);
  SpreadsheetApp.getActiveSpreadsheet().toast('Imported ' + res.importedCount + ' new transactions (' + res.skippedCount + ' skipped/duplicate).', 'Sync Complete', 5);
}

function menuCleanDuplicates() {
  var msg = cleanDuplicatesFromTransactions();
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Deduplication', 5);
}

function menuSetupAutoTrigger() {
  var msg = setupAutoTrigger();
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Auto-Sync Trigger', 5);
}

function menuRemoveAutoTrigger() {
  var msg = removeAutoTrigger();
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Auto-Sync Trigger', 5);
}

function menuReprocessAllEmails() {
  var res = syncBankEmailsFromGmail(true);
  SpreadsheetApp.getActiveSpreadsheet().toast('Reprocessed! Imported ' + res.importedCount + ' unique transactions.', 'Reprocess Complete', 5);
}

function menuCleanAccounts() {
  cleanAndResetAccounts();
  SpreadsheetApp.getActiveSpreadsheet().toast('Accounts reset to Nabil Bank & eSewa with 0 balance.', 'Accounts Cleaned', 5);
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';

    if (action === 'ping') {
      return jsonResponse({ success: true, message: 'Expense Tracker API is live.' });
    }

    if (action === 'initSheet') {
      initSheet();
      return jsonResponse({ success: true, message: 'All sheets initialized successfully.' });
    }

    if (action === 'cleanDuplicates') {
      var dupMsg = cleanDuplicatesFromTransactions();
      return jsonResponse({ success: true, message: dupMsg });
    }

    if (action === 'setupAutoTrigger') {
      var triggerMsg = setupAutoTrigger();
      return jsonResponse({ success: true, message: triggerMsg });
    }

    if (action === 'removeAutoTrigger') {
      var removeMsg = removeAutoTrigger();
      return jsonResponse({ success: true, message: removeMsg });
    }

    if (action === 'cleanAndResetAccounts') {
      cleanAndResetAccounts();
      return jsonResponse({ success: true, message: 'Accounts cleaned to Nabil Bank & eSewa with 0 balance.' });
    }

    if (action === 'resetOpeningBalances') {
      resetOpeningBalancesToZero();
      return jsonResponse({ success: true, message: 'All account opening balances reset to 0.' });
    }

    if (action === 'syncBankEmails') {
      var syncResult = syncBankEmailsFromGmail(false);
      return jsonResponse({ success: true, data: syncResult });
    }

    if (action === 'reprocessAllEmails') {
      var reprocessResult = reprocessAllEmails();
      return jsonResponse({ success: true, data: reprocessResult });
    }

    if (action === 'getTransactions') {
      var transactions = getRowsAsObjects(SHEET_NAMES.TRANSACTIONS);
      return jsonResponse({ success: true, data: transactions });
    }

    if (action === 'getAccounts') {
      var accounts = getRowsAsObjects(SHEET_NAMES.ACCOUNTS);
      return jsonResponse({ success: true, data: accounts });
    }

    if (action === 'getCategories') {
      var categories = getRowsAsObjects(SHEET_NAMES.CATEGORIES);
      return jsonResponse({ success: true, data: categories });
    }

    if (action === 'getSettings') {
      var settingsList = getRowsAsObjects(SHEET_NAMES.SETTINGS);
      var settingsObj = {};
      settingsList.forEach(function(item) {
        settingsObj[item.key] = item.value;
      });
      return jsonResponse({ success: true, data: settingsObj });
    }

    return jsonResponse({ success: false, error: 'Unknown GET action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    var action = payload.action || '';

    if (action === 'initSheet') {
      initSheet();
      return jsonResponse({ success: true, message: 'Sheets initialized successfully.' });
    }

    if (action === 'cleanDuplicates') {
      var dupMsg = cleanDuplicatesFromTransactions();
      return jsonResponse({ success: true, message: dupMsg });
    }

    if (action === 'setupAutoTrigger') {
      var triggerMsg = setupAutoTrigger();
      return jsonResponse({ success: true, message: triggerMsg });
    }

    if (action === 'removeAutoTrigger') {
      var removeMsg = removeAutoTrigger();
      return jsonResponse({ success: true, message: removeMsg });
    }

    if (action === 'cleanAndResetAccounts') {
      cleanAndResetAccounts();
      return jsonResponse({ success: true, message: 'Accounts cleaned successfully.' });
    }

    if (action === 'syncBankEmails') {
      var syncResult = syncBankEmailsFromGmail(false);
      return jsonResponse({ success: true, data: syncResult });
    }

    if (action === 'reprocessAllEmails') {
      var reprocessResult = reprocessAllEmails();
      return jsonResponse({ success: true, data: reprocessResult });
    }

    if (action === 'createTransaction') {
      var newTx = payload.transaction;
      if (!newTx.id) newTx.id = 'tx-' + new Date().getTime();
      if (!newTx.createdAt) newTx.createdAt = new Date().toISOString();
      if (typeof newTx.amount === 'string') {
        newTx.amount = parseFloat(newTx.amount.replace(/,/g, '')) || 0;
      }
      insertRow(SHEET_NAMES.TRANSACTIONS, HEADERS.TRANSACTIONS, newTx);
      return jsonResponse({ success: true, data: newTx });
    }

    if (action === 'updateTransaction') {
      var updatedTxData = payload.transaction;
      if (updatedTxData && typeof updatedTxData.amount === 'string') {
        updatedTxData.amount = parseFloat(updatedTxData.amount.replace(/,/g, '')) || 0;
      }
      var updatedTx = updateRow(SHEET_NAMES.TRANSACTIONS, HEADERS.TRANSACTIONS, payload.id, updatedTxData);
      return jsonResponse({ success: true, data: updatedTx });
    }

    if (action === 'deleteTransaction') {
      deleteRow(SHEET_NAMES.TRANSACTIONS, payload.id);
      return jsonResponse({ success: true, message: 'Transaction deleted' });
    }

    if (action === 'createAccount') {
      var newAcc = payload.account;
      if (!newAcc.id) newAcc.id = 'acc-' + new Date().getTime();
      if (newAcc.active === undefined) newAcc.active = true;
      if (typeof newAcc.openingBalance === 'string') {
        newAcc.openingBalance = parseFloat(newAcc.openingBalance.replace(/,/g, '')) || 0;
      }
      insertRow(SHEET_NAMES.ACCOUNTS, HEADERS.ACCOUNTS, newAcc);
      return jsonResponse({ success: true, data: newAcc });
    }

    if (action === 'updateAccount') {
      var updatedAccData = payload.account;
      if (updatedAccData && typeof updatedAccData.openingBalance === 'string') {
        updatedAccData.openingBalance = parseFloat(updatedAccData.openingBalance.replace(/,/g, '')) || 0;
      }
      var updatedAcc = updateRow(SHEET_NAMES.ACCOUNTS, HEADERS.ACCOUNTS, payload.id, updatedAccData);
      return jsonResponse({ success: true, data: updatedAcc });
    }

    if (action === 'deleteAccount') {
      deleteRow(SHEET_NAMES.ACCOUNTS, payload.id);
      return jsonResponse({ success: true, message: 'Account deleted' });
    }

    if (action === 'createCategory') {
      var newCat = payload.category;
      if (!newCat.id) newCat.id = 'cat-' + new Date().getTime();
      if (newCat.active === undefined) newCat.active = true;
      insertRow(SHEET_NAMES.CATEGORIES, HEADERS.CATEGORIES, newCat);
      return jsonResponse({ success: true, data: newCat });
    }

    if (action === 'updateCategory') {
      var updatedCat = updateRow(SHEET_NAMES.CATEGORIES, HEADERS.CATEGORIES, payload.id, payload.category);
      return jsonResponse({ success: true, data: updatedCat });
    }

    if (action === 'deleteCategory') {
      deleteRow(SHEET_NAMES.CATEGORIES, payload.id);
      return jsonResponse({ success: true, message: 'Category deleted' });
    }

    if (action === 'updateSettings') {
      var newSettings = payload.settings;
      var setSheet = getOrCreateSheet(SHEET_NAMES.SETTINGS, HEADERS.SETTINGS);
      var currentSettings = getRowsAsObjects(SHEET_NAMES.SETTINGS);
      var keys = Object.keys(newSettings);

      keys.forEach(function(key) {
        var existing = currentSettings.find(function(s) { return s.key === key; });
        if (existing) {
          updateRow(SHEET_NAMES.SETTINGS, HEADERS.SETTINGS, key, { key: key, value: newSettings[key] });
        } else {
          insertRow(SHEET_NAMES.SETTINGS, HEADERS.SETTINGS, { key: key, value: newSettings[key] });
        }
      });

      return jsonResponse({ success: true, data: newSettings });
    }

    return jsonResponse({ success: false, error: 'Unknown POST action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reprocess all bank emails from scratch (wipes auto-imported rows first to prevent any duplicates)
 */
function reprocessAllEmails() {
  cleanAndResetAccounts();
  clearTransactionsSheet();
  return syncBankEmailsFromGmail(true);
}

function clearTransactionsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (sheet) {
    sheet.clear();
    sheet.appendRow(HEADERS.TRANSACTIONS);
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.TRANSACTIONS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');
  }
}

/**
 * Scans Gmail for bank alert emails and imports them into Transactions sheet with strict deduplication
 */
function syncBankEmailsFromGmail(resetIgnored) {
  initSheet();

  if (resetIgnored === true) {
    clearProcessedEmailsSheet();
  }

  var processedIds = getProcessedEmailIds();
  var accounts = getRowsAsObjects(SHEET_NAMES.ACCOUNTS);
  var categories = getRowsAsObjects(SHEET_NAMES.CATEGORIES);

  // Load existing transactions in sheet to prevent inserting duplicate entries
  var existingTransactions = getRowsAsObjects(SHEET_NAMES.TRANSACTIONS);
  var existingSignatures = {};
  var existingIds = {};

  existingTransactions.forEach(function(tx) {
    existingIds[tx.id] = true;
    var sig = String(tx.date) + '|' + String(tx.type) + '|' + String(tx.amount) + '|' + String(tx.description).trim();
    existingSignatures[sig] = true;
  });

  var queries = [
    'from:(txn-alert@nabilbank.com OR customercare@nabilbank.com) "Transaction Alert"',
    'subject:("Transaction Alert" OR "Debit Alert" OR "Credit Alert")'
  ];

  var query = queries.join(' OR ');
  var threads = GmailApp.search(query, 0, 50);

  var importedCount = 0;
  var skippedCount = 0;
  var newlyImported = [];

  for (var t = 0; t < threads.length; t++) {
    var messages = threads[t].getMessages();
    for (var m = 0; m < messages.length; m++) {
      var message = messages[m];
      var msgId = message.getId();

      if (processedIds[msgId] || existingIds['tx-email-' + msgId]) {
        continue;
      }

      var subject = message.getSubject() || '';
      var body = message.getPlainBody() || '';
      var sender = message.getFrom() || '';
      var date = message.getDate();

      var parsedTx = extractBankTransaction(subject, body, sender, date, accounts, categories, msgId);

      if (parsedTx) {
        var txSig = String(parsedTx.date) + '|' + String(parsedTx.type) + '|' + String(parsedTx.amount) + '|' + String(parsedTx.description).trim();

        // Check for duplicate transaction signature
        if (existingSignatures[txSig] || existingIds[parsedTx.id]) {
          markEmailAsProcessed(msgId, subject, parsedTx.date, parsedTx.amount, 'duplicate_skipped');
          processedIds[msgId] = true;
          skippedCount++;
          continue;
        }

        insertRow(SHEET_NAMES.TRANSACTIONS, HEADERS.TRANSACTIONS, parsedTx);
        markEmailAsProcessed(msgId, subject, parsedTx.date, parsedTx.amount, 'imported');
        processedIds[msgId] = true;
        existingIds[parsedTx.id] = true;
        existingSignatures[txSig] = true;
        importedCount++;
        newlyImported.push(parsedTx);
      } else {
        markEmailAsProcessed(msgId, subject, Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd'), 0, 'ignored');
        processedIds[msgId] = true;
        skippedCount++;
      }
    }
  }

  return {
    importedCount: importedCount,
    skippedCount: skippedCount,
    transactions: newlyImported
  };
}

/**
 * Bulletproof extractor for Nabil Bank & Nepali bank alert emails
 */
function extractBankTransaction(subject, rawBody, sender, emailDateObj, accounts, categories, msgId) {
  var text = rawBody
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/\r/g, '\n');

  var type = null;
  var amount = null;
  var txDateStr = null;
  var remarks = '';

  // 1. Check for Nabil Bank Table format
  var nabilMatch = text.match(/(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)[\s\S]{1,50}?\b(Credit|Debit)\b[\s\S]{1,50}?([\d,]+(?:\.\d{1,2})?)[\s\S]{1,50}?([\d,]+(?:\.\d{1,2})?)[\s\S]{1,50}?([^\n\r]+)/i);

  if (nabilMatch) {
    txDateStr = nabilMatch[1].trim();
    type = nabilMatch[2].toLowerCase() === 'credit' ? 'income' : 'expense';
    amount = parseFloat(nabilMatch[3].replace(/,/g, ''));
    remarks = nabilMatch[5].trim();
  }

  // 2. Line-by-Line Token Search for Nabil / Structured Alerts
  if (!amount) {
    var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (/^(Debit|Credit)$/i.test(l)) {
        type = l.toLowerCase() === 'credit' ? 'income' : 'expense';
        if (i + 1 < lines.length) {
          var potentialAmt = lines[i + 1].replace(/,/g, '').replace(/NPR\.?|Rs\.?/i, '').trim();
          if (/^[\d]+(?:\.\d{1,2})?$/.test(potentialAmt)) {
            amount = parseFloat(potentialAmt);
            if (i - 1 >= 0 && /\d{4}-\d{2}-\d{2}/.test(lines[i - 1])) {
              txDateStr = lines[i - 1].match(/\d{4}-\d{2}-\d{2}/)[0];
            }
            if (i + 3 < lines.length) {
              remarks = lines[i + 3];
            }
            break;
          }
        }
      }
    }
  }

  // 3. Paragraph / Free-text alert format
  if (!amount) {
    var cleanNoCommas = text.replace(/,/g, '');

    if (/debited|debit alert|paid|withdrawn|purchase|deducted|spent|dr\./i.test(cleanNoCommas)) {
      type = 'expense';
    } else if (/credited|credit alert|deposited|received|refund|transfer in|cr\./i.test(cleanNoCommas)) {
      type = 'income';
    }

    if (type) {
      var amtMatch = cleanNoCommas.match(/(?:npr\.?|rs\.?|inr\.?|\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                     cleanNoCommas.match(/(?:debited|credited|amount)\s+(?:by|for|is|of|:)?\s*(?:npr\.?|rs\.?)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (amtMatch && amtMatch[1]) {
        amount = parseFloat(amtMatch[1]);
      }

      var remMatch = cleanNoCommas.match(/(?:remarks?|towards|info|narrative|txn description|particulars?|merchant)\s*[:\-]\s*([A-Za-z0-9\s\.\-_#]+)/i);
      if (remMatch && remMatch[1]) {
        remarks = remMatch[1].trim().split('\n')[0].substring(0, 45);
      }
    }
  }

  // If no amount extracted, return null
  if (!amount || isNaN(amount) || amount <= 0) return null;

  // Match Bank Account (Defaults to Nabil Bank)
  var matchedAccount = matchAccountFromEmail(text + ' ' + sender, accounts);
  var accountId = matchedAccount ? matchedAccount.id : (accounts[0] ? accounts[0].id : 'acc-1');

  // Clean Remarks / Description
  var description = remarks || (type === 'expense' ? ((matchedAccount ? matchedAccount.name : 'Nabil Bank') + ' Debit') : ((matchedAccount ? matchedAccount.name : 'Nabil Bank') + ' Credit'));
  description = description.replace(/Enjoy advanced.*/i, '').replace(/For support.*/i, '').replace(/Thank you.*/i, '').trim();

  // Smart Category Match
  var categoryId = matchCategoryByDescription(description, text, type, categories);

  // ==================== SMART ESEWA ID LOGIC ====================
  var combinedText = (description + ' ' + text);
  var esewaPhoneMatch = combinedText.match(/\b(98\d{8}|97\d{8})\b/);
  var foundEsewaId = esewaPhoneMatch ? esewaPhoneMatch[1] : '';

  var transferToAccountId = undefined;
  var esewaAcc = accounts.find(function(a) { return /esewa/i.test(a.name); });

  // 1. If it's an eSewa Load/Topup
  if (/esewa\s*load|esewa|e-sewa/i.test(description + ' ' + text)) {
    if (type === 'expense') {
      if (foundEsewaId === USER_ESEWA_ID || (!foundEsewaId && /esewa\s*load/i.test(description))) {
        if (esewaAcc && esewaAcc.id !== accountId) {
          type = 'transfer';
          transferToAccountId = esewaAcc.id;
          description = 'eSewa Load (' + USER_ESEWA_ID + ')';
          categoryId = undefined;
        }
      } else {
        type = 'expense';
        description = 'eSewa Payment to ' + (foundEsewaId || remarks || 'Merchant');
        transferToAccountId = undefined;
      }
    } else if (type === 'income') {
      if (foundEsewaId === USER_ESEWA_ID && esewaAcc && esewaAcc.id !== accountId) {
        type = 'transfer';
        var tempAcc = accountId;
        accountId = esewaAcc.id;
        transferToAccountId = tempAcc;
        description = 'eSewa Withdrawal to Bank';
        categoryId = undefined;
      } else {
        type = 'income';
        description = 'eSewa Transfer Received' + (foundEsewaId ? ' from ' + foundEsewaId : '');
      }
    }
  }

  // Format Date (Strict YYYY-MM-DD)
  var formattedDate = '';
  if (txDateStr) {
    formattedDate = txDateStr.split(' ')[0];
  } else {
    formattedDate = Utilities.formatDate(emailDateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  // Deterministic unique ID based on Gmail Message ID
  var uniqueTxId = msgId ? ('tx-email-' + msgId) : ('tx-' + new Date().getTime());

  return {
    id: uniqueTxId,
    date: formattedDate,
    type: type,
    accountId: accountId,
    categoryId: categoryId,
    amount: amount,
    description: description,
    transferToAccountId: transferToAccountId,
    createdAt: new Date().toISOString()
  };
}

function matchAccountFromEmail(text, accounts) {
  var t = text.toLowerCase();

  for (var i = 0; i < accounts.length; i++) {
    var acc = accounts[i];
    var accName = acc.name.toLowerCase();

    if (accName.indexOf('nabil') !== -1 && (t.indexOf('nabil') !== -1 || t.indexOf('nabilbank') !== -1 || t.indexOf('nbank') !== -1 || t.indexOf('185') !== -1)) return acc;
    if (t.indexOf(accName) !== -1) return acc;
  }

  var nabil = accounts.find(function(a) { return /nabil/i.test(a.name); });
  if (nabil) return nabil;

  var defaultBank = accounts.find(function(a) { return a.active && a.type === 'bank'; });
  return defaultBank || accounts[0];
}

function matchCategoryByDescription(description, fullText, type, categories) {
  var t = (description + ' ' + fullText).toLowerCase();
  var relevantCategories = categories.filter(function(c) { return c.type === type && c.active; });

  if (type === 'income') {
    if (/salary|payroll|remuneration/i.test(t)) {
      var sal = relevantCategories.find(function(c) { return /salary/i.test(c.name); });
      if (sal) return sal.id;
    }
    if (/freelance|consulting|upwork|fiverr/i.test(t)) {
      var free = relevantCategories.find(function(c) { return /freelance/i.test(c.name); });
      if (free) return free.id;
    }
    if (/dividend|interest|stock|mutual fund/i.test(t)) {
      var inv = relevantCategories.find(function(c) { return /invest/i.test(c.name); });
      if (inv) return inv.id;
    }
    return relevantCategories[0] ? relevantCategories[0].id : undefined;
  }

  if (/food|restaurant|cafe|bakery|dining|kfc|pizza|burger|coffee|tea|bimala/i.test(t)) {
    var food = relevantCategories.find(function(c) { return /food/i.test(c.name); });
    if (food) return food.id;
  }
  if (/grocery|supermarket|bhatbhateni|mart|big mart|store/i.test(t)) {
    var groc = relevantCategories.find(function(c) { return /groc/i.test(c.name); });
    if (groc) return groc.id;
  }
  if (/petrol|fuel|gas station|diesel/i.test(t)) {
    var fuel = relevantCategories.find(function(c) { return /fuel/i.test(c.name); });
    if (fuel) return fuel.id;
  }
  if (/ride|pathao|indrive|uber|taxi|transport/i.test(t)) {
    var trans = relevantCategories.find(function(c) { return /transport/i.test(c.name); });
    if (trans) return trans.id;
  }
  if (/rent|housing|landlord/i.test(t)) {
    var rent = relevantCategories.find(function(c) { return /rent|house/i.test(c.name); });
    if (rent) return rent.id;
  }
  if (/nea|electricity|bill|water|khanepani/i.test(t)) {
    var util = relevantCategories.find(function(c) { return /util|bill/i.test(c.name); });
    if (util) return util.id;
  }
  if (/worldlink|vianet|dishhome|internet|ntc|ncell|wifi/i.test(t)) {
    var net = relevantCategories.find(function(c) { return /internet|wifi/i.test(c.name); });
    if (net) return net.id;
  }
  if (/daraz|shopping|cloth|shoes|amazon/i.test(t)) {
    var shop = relevantCategories.find(function(c) { return /shop/i.test(c.name); });
    if (shop) return shop.id;
  }
  if (/pharmacy|hospital|doctor|medical|health/i.test(t)) {
    var health = relevantCategories.find(function(c) { return /health|medic/i.test(c.name); });
    if (health) return health.id;
  }
  if (/qfx|cinema|movie|netflix|spotify|subscription/i.test(t)) {
    var ent = relevantCategories.find(function(c) { return /entertain|sub/i.test(c.name); });
    if (ent) return ent.id;
  }

  return relevantCategories[0] ? relevantCategories[0].id : undefined;
}

function getProcessedEmailIds() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.PROCESSED_EMAILS);
  if (!sheet) {
    sheet = getOrCreateSheet(SHEET_NAMES.PROCESSED_EMAILS, HEADERS.PROCESSED_EMAILS);
    return {};
  }
  var data = sheet.getDataRange().getValues();
  var ids = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) ids[String(data[i][0])] = true;
  }
  return ids;
}

function clearProcessedEmailsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.PROCESSED_EMAILS);
  if (sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
  }
}

function markEmailAsProcessed(msgId, subject, date, amount, status) {
  var sheet = getOrCreateSheet(SHEET_NAMES.PROCESSED_EMAILS, HEADERS.PROCESSED_EMAILS);
  sheet.appendRow([msgId, subject, date, amount, status]);
}

/**
 * Creates or resets the automatic 15-minute background time-based trigger
 */
function setupAutoTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncBankEmailsFromGmail') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('syncBankEmailsFromGmail')
    .timeBased()
    .everyMinutes(15)
    .create();

  return 'Auto-sync trigger created: runs every 15 minutes in background.';
}

/**
 * Removes any active background auto-sync trigger
 */
function removeAutoTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var count = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncBankEmailsFromGmail') {
      ScriptApp.deleteTrigger(triggers[i]);
      count++;
    }
  }
  return 'Removed ' + count + ' auto-sync trigger(s).';
}

/**
 * Scans Transactions sheet and removes all duplicate rows
 */
function cleanDuplicatesFromTransactions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (!sheet) return 'Transactions sheet not found';

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 'No transactions to deduplicate';

  var headers = data[0];
  var seenSignatures = {};
  var seenIds = {};
  var uniqueRows = [];
  var removedCount = 0;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] || row[0].toString().trim() === '') continue;

    var id = String(row[0]);
    var date = String(row[1]);
    var type = String(row[2]);
    var amount = String(row[5]);
    var desc = String(row[6]).trim();

    var signature = date + '|' + type + '|' + amount + '|' + desc;

    if (!seenSignatures[signature] && !seenIds[id]) {
      seenSignatures[signature] = true;
      seenIds[id] = true;
      uniqueRows.push(row);
    } else {
      removedCount++;
    }
  }

  sheet.clear();
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');

  if (uniqueRows.length > 0) {
    sheet.getRange(2, 1, uniqueRows.length, headers.length).setValues(uniqueRows);
  }

  return 'Deduplicated: removed ' + removedCount + ' duplicate transaction(s). Kept ' + uniqueRows.length + ' unique.';
}

function getOrCreateSheet(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');
  }
  return sheet;
}

function getRowsAsObjects(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    if (!rowData[0] || rowData[0].toString().trim() === '') continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var val = rowData[j];

      if (header === 'amount' || header === 'openingBalance') {
        if (typeof val === 'string') {
          val = parseFloat(val.replace(/,/g, '').replace(/[^0-9.-]/g, '')) || 0;
        } else {
          val = Number(val) || 0;
        }
      } else if (header === 'date') {
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else if (typeof val === 'string') {
          var dateMatch = val.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            val = dateMatch[1];
          }
        }
      } else if (header === 'active') {
        val = (val === true || val === 'TRUE' || val === 'true');
      } else if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }

      obj[header] = val;
    }
    rows.push(obj);
  }

  return rows;
}

function insertRow(sheetName, headers, obj) {
  var sheet = getOrCreateSheet(sheetName, headers);
  var row = headers.map(function(h) {
    return obj[h] !== undefined ? obj[h] : '';
  });
  sheet.appendRow(row);
}

function updateRow(sheetName, headers, id, updates) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) throw new Error('Item with id ' + id + ' not found in ' + sheetName);

  var existingObj = {};
  for (var j = 0; j < headers.length; j++) {
    existingObj[headers[j]] = data[rowIndex - 1][j];
  }

  var merged = Object.assign({}, existingObj, updates);
  var updatedRow = headers.map(function(h) {
    return merged[h] !== undefined ? merged[h] : '';
  });

  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);
  return merged;
}

function deleteRow(sheetName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Resets opening balances in the Accounts sheet to 0
 */
function resetOpeningBalancesToZero() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    for (var i = 2; i <= lastRow; i++) {
      sheet.getRange(i, 4).setValue(0);
    }
  }
}

/**
 * Cleans the Accounts sheet so ONLY Nabil Bank and eSewa exist with 0 opening balance
 */
function cleanAndResetAccounts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (!sheet) {
    sheet = getOrCreateSheet(SHEET_NAMES.ACCOUNTS, HEADERS.ACCOUNTS);
  }

  sheet.clear();
  sheet.appendRow(HEADERS.ACCOUNTS);
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.ACCOUNTS.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');

  var userAccounts = [
    ['acc-1', 'Nabil Bank (Savings)', 'bank', 0, 'NPR', true],
    ['acc-2', 'eSewa', 'wallet', 0, 'NPR', true]
  ];
  sheet.getRange(2, 1, userAccounts.length, userAccounts[0].length).setValues(userAccounts);
}

function initSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  getOrCreateSheet(SHEET_NAMES.TRANSACTIONS, HEADERS.TRANSACTIONS);
  getOrCreateSheet(SHEET_NAMES.PROCESSED_EMAILS, HEADERS.PROCESSED_EMAILS);

  var accSheet = getOrCreateSheet(SHEET_NAMES.ACCOUNTS, HEADERS.ACCOUNTS);
  if (accSheet.getLastRow() <= 1) {
    var defaultAccounts = [
      ['acc-1', 'Nabil Bank (Savings)', 'bank', 0, 'NPR', true],
      ['acc-2', 'eSewa', 'wallet', 0, 'NPR', true]
    ];
    accSheet.getRange(2, 1, defaultAccounts.length, defaultAccounts[0].length).setValues(defaultAccounts);
  }

  var catSheet = getOrCreateSheet(SHEET_NAMES.CATEGORIES, HEADERS.CATEGORIES);
  if (catSheet.getLastRow() <= 1) {
    var defaultCategories = [
      ['cat-inc-1', 'Salary', 'income', 'BriefcaseBusiness', true],
      ['cat-inc-2', 'Freelance & Consulting', 'income', 'Laptop', true],
      ['cat-inc-3', 'Investments & Dividends', 'income', 'TrendingUp', true],
      ['cat-inc-4', 'Gifts & Rewards', 'income', 'Gift', true],
      ['cat-exp-1', 'Food & Dining', 'expense', 'Utensils', true],
      ['cat-exp-2', 'Groceries', 'expense', 'Store', true],
      ['cat-exp-3', 'Transportation', 'expense', 'Car', true],
      ['cat-exp-4', 'Fuel & Petrol', 'expense', 'Fuel', true],
      ['cat-exp-5', 'Housing & Rent', 'expense', 'Home', true],
      ['cat-exp-6', 'Utilities & Bills', 'expense', 'Zap', true],
      ['cat-exp-7', 'Internet & WiFi', 'expense', 'Wifi', true],
      ['cat-exp-8', 'Shopping', 'expense', 'ShoppingBag', true],
      ['cat-exp-9', 'Healthcare & Medicine', 'expense', 'HeartPulse', true],
      ['cat-exp-10', 'Entertainment & Subscriptions', 'expense', 'Film', true]
    ];
    catSheet.getRange(2, 1, defaultCategories.length, defaultCategories[0].length).setValues(defaultCategories);
  }

  var setSheet = getOrCreateSheet(SHEET_NAMES.SETTINGS, HEADERS.SETTINGS);
  if (setSheet.getLastRow() <= 1) {
    var defaultSettings = [
      ['currency', 'NPR'],
      ['currencySymbol', 'Rs.'],
      ['currencyPosition', 'prefix'],
      ['dateFormat', 'dd MMM yyyy']
    ];
    setSheet.getRange(2, 1, defaultSettings.length, defaultSettings[0].length).setValues(defaultSettings);
  }
}
