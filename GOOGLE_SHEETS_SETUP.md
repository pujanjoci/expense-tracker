# Google Sheets Backend Setup Guide

This guide walks you through setting up Google Sheets and Google Apps Script as the backend API and automated email parser for your **Expense Tracker** application.

---

## 1. Open Google Sheet & Apps Script

1. Open your **Google Sheet**.
2. Click **Extensions > Apps Script** in the top navigation.
3. Replace all existing code in `Code.gs` with the code from [`Code.gs`](./Code.gs).
4. Save the project (`Ctrl + S`).

---

## 2. Interactive Menu Inside Google Sheets

Whenever you open or refresh your Google Sheet, an **"Expense Tracker"** menu will appear in the top toolbar:

* **Sync Bank Emails Now**: Instantly fetches new Gmail transaction alert emails.
* **Enable 15-Minute Auto-Sync Trigger**: Sets up automated background sync every 15 minutes.
* **Disable Auto-Sync Trigger**: Removes the automated background trigger.
* **Reprocess All Emails (Fresh Import)**: Clears previously skipped email logs and imports all historical transaction emails.
* **Clean Accounts to Nabil & eSewa (0 Balance)**: Cleans the `Accounts` tab so only **Nabil Bank** and **eSewa** exist with 0 opening balance.

---

## 3. Web App Deployment

1. In the Apps Script editor, click **Deploy > Manage deployments**.
2. Click the ✏️ **Edit** icon next to your active deployment.
3. Under **Version**, select **New version**.
4. Set **Execute as**: `Me (<your-email>)`.
5. Set **Who has access**: `Anyone`.
6. Click **Deploy** and copy the **Web App URL**.
7. Paste this URL in your `.env.local` and `.env` files:
   ```env
   NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

---

## 4. Automatic Background Sync (`setupAutoTrigger`)

To have the script automatically scan for new bank alert emails every 15 minutes in the background (even when the sheet is closed):

* **Option A**: Click **Expense Tracker > Enable 15-Minute Auto-Sync Trigger** in your Google Sheet menu.
* **Option B**: In the Apps Script editor, select **`setupAutoTrigger`** from the function dropdown and click **Run**.
