# Google Sheets multi-user rollout

The repository now supports self-service user accounts, separate data tabs per account, an owner login, and background sync from a local-first cache. These changes do not modify the live Google spreadsheet or publish Apps Script for you.

## Apply the Apps Script update

1. Open the Google Sheet that already contains the owner's `Transactions`, `Accounts`, `Categories`, and `Settings` tabs.
2. Open **Extensions → Apps Script**.
3. Replace the project code with the current contents of `google-apps-script/Code.gs` from this repository.
4. Save, then use **Deploy → Manage deployments → Edit → New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**. The app authenticates account actions itself.
5. Reload the spreadsheet. Choose **Expense Tracker → Set Up / Reset Owner Login** and enter the owner password when prompted. The owner username is `owner.pujan@`. The password is not present in the code; Apps Script writes only a salted hash into `Users`.

## Configure the app

1. Set `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL` to the deployed Web App URL in `.env.local` for development and in the hosting provider's build environment for production.
2. Rebuild and redeploy the Next.js app so the shared endpoint is included in the client bundle.
3. Use the app's **Create an account** option to create a non-owner account. Sign in again with that username and password after reinstalling to restore its data.

The owner continues to use the existing workbook tabs. Each other account gets its own `User_<id>_Transactions`, `User_<id>_Accounts`, `User_<id>_Categories`, and `User_<id>_Settings` tabs. `Users` stores account metadata and salted password hashes; `Sessions` stores only hashed session tokens. Gmail scanning is restricted to the owner session.

## Limits to understand

- The app syncs a local cache in the background. If the network is unavailable, local edits remain queued in the cache and retry when connectivity returns or the app is focused again.
- Concurrent edits from multiple devices use last-write-wins snapshots and can overwrite one another.
- Separate tabs keep data organized and scoped by the app. The Google Sheet owner can still open every tab. If users must be unable to view their data even as spreadsheet owner, use a separate spreadsheet owned by each user or encrypt each user's data before it reaches Sheets.
- Sign-up is open to anyone who can reach the app. There is no email verification or account recovery flow yet; users must keep their passwords safe.
