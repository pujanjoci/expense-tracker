# Expense Tracker

A personal finance and expense tracking application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Google Sheets / Apps Script** backend.

Designed with clean typography, restrained accents, zero emojis (pure Lucide React iconography), dynamic balance calculations, and a mobile-first responsive architecture ready for future **Expo / React Native** Android builds.

---

## ✨ Key Features

- **Dynamic Account Balance Tracking**: Account balances are dynamically calculated in real-time from `openingBalance + income - expenses + (transfers in) - (transfers out)`.
- **Comprehensive Financial Dashboard**:
  - Greeting & current date header with quick "Add transaction" trigger.
  - Summary cards: Total Balance, Monthly Income with % change, Monthly Expenses with % change, Remaining / Savings rate.
  - Interactive **Income vs Expenses** monthly cash flow bar chart.
  - **Spending by category** donut breakdown chart.
  - Recent transactions stream with category icons and +/- amount indicators.
- **Full Transaction Management**:
  - Search by note, category, or account name.
  - Filters by Type (*Income, Expense, Transfer*), Account, Category, and Date range.
  - Sorting by Newest/Oldest and Amount High/Low.
  - CSV export for filtered transactions.
  - Adaptive UI: Clean desktop table and mobile-friendly touch cards.
- **Accounts & Multi-Wallet Support**:
  - Bank accounts, physical Cash in hand, Digital Wallets (*eSewa, Khalti, etc.*), and custom accounts.
  - Net Worth overview and per-account inflow/outflow stats.
  - Account lifecycle: Add, Edit, and Deactivate (soft-delete preserves transaction history).
- **Custom Categories with Lucide Iconography**:
  - Dedicated Income and Expense categories.
  - Built-in Lucide icon picker with zero emojis.
- **Spending & Income Analytics**:
  - Period filtering: *This month, Last month, Last 3 months, Last 6 months, This year, Custom range*.
  - Visual category breakdown with percentage progress bars.
  - 6-month historical cash flow trends.
- **Configurable Currency & Settings**:
  - Default currency: **NPR / Rs.** (configurable to USD, EUR, INR, GBP, etc.).
  - Configurable symbol position (Prefix / Suffix).
  - Built-in Google Apps Script endpoint testing and URL storage.
  - Full JSON backup export and sample seed data reset.
- **Google Sheets Backend API**:
  - Decoupled API abstraction (`src/lib/api.ts`).
  - Google Apps Script web app endpoint handling GET/POST operations.
  - Automatic fallback to offline / local storage with pre-seeded data when no Google Sheet is connected.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Database**: Google Sheets (via Google Apps Script Web App API)
- **Date Handling**: date-fns

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure the shared Google Apps Script endpoint

Copy `.env.example` to `.env.local` and set the Web App URL before building the public app. The endpoint is public, not a secret; user sessions scope each user to their own data tabs.

```env
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

On the owner spreadsheet, use **Expense Tracker > Set Up / Reset Owner Login** once. Enter the password for the owner login `owner.pujan@`; the `Users` tab stores only a salted hash. Other people can create accounts from the app's sign-in screen. The `Users` tab stores password hashes and account metadata; a `Sessions` tab stores hashed session tokens. Each non-owner receives their own Transactions, Accounts, Categories, and Settings tabs. Your original tabs remain assigned to you and continue to receive Gmail imports.

The app opens from its local cache and syncs changes to Sheets in the background. Users sign in again after reinstalling to restore their records. Local cache is per browser profile, and simultaneous edits from multiple devices can overwrite one another because Sheets is being used as a small-group data store rather than a conflict-resolving database. Separate tabs prevent accidental mixing in the app; the Google workbook owner can still open every tab.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
```bash
npm run build
```

### 5. Start Production Server
```bash
npm run start
```

---

## 📊 Google Sheets Setup

For complete step-by-step instructions on setting up your Google Sheet and deploying the Google Apps Script Web App, see **[GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)**.

The Google Apps Script code is located in `google-apps-script/Code.gs`.

---

## 📱 Future Mobile / Android (Expo) Compatibility

The codebase follows a decoupled, API-driven architecture:
- Data models in `types/index.ts` and API functions in `lib/api.ts` contain zero browser-specific UI dependencies.
- The same Google Apps Script API endpoints and TypeScript definitions can be dropped directly into an **Expo / React Native** project.
