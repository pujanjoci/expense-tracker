import { NextRequest, NextResponse } from 'next/server';

/**
 * Exponential backoff fetcher for Google Apps Script endpoints
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  delayMs = 1000
): Promise<Response> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Retry on Rate limit (429) or Server error (5xx)
      if (res.status === 429 || res.status >= 500) {
        attempt++;
        if (attempt >= maxRetries) return res;
        const wait = delayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }
      return res;
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      const wait = delayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw new Error('Maximum network retries exceeded for Google Sheets endpoint');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gasUrl = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || '';

    if (!gasUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL is not configured on the server.' },
        { status: 500 }
      );
    }

    const { action, ...payload } = body;

    // Call Google Apps Script with retry and backoff
    const gasResponse = await fetchWithRetry(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload }),
      // Cache with Next.js revalidate
      next: { revalidate: action === 'syncUserData' && payload.direction === 'pull' ? 30 : 0 },
    });

    const data = await gasResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API/sheets Route Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server failed to communicate with Google Sheets.' },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'ping';
    const gasUrl = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || '';

    if (!gasUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL is not configured.' },
        { status: 500 }
      );
    }

    const fetchUrl = `${gasUrl}?action=${encodeURIComponent(action)}&t=${Date.now()}`;
    const res = await fetchWithRetry(fetchUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server failed to query Google Sheets.' },
      { status: 502 }
    );
  }
}
