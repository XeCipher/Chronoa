import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  // 1. Convert webcal:// to https://
  const url = rawUrl.replace('webcal://', 'https://');

  try {
    console.log(`[Calendar Proxy] Fetching from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Use a standard browser User-Agent to avoid being flagged as a bot
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/calendar, text/plain, */*',
        'Cache-Control': 'no-cache',
      },
      // Timeout after 10 seconds so the app doesn't hang
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[Calendar Proxy] Apple responded with ${response.status}: ${response.statusText}`);
      return NextResponse.json({ error: `Apple returned status ${response.status}` }, { status: response.status });
    }

    const data = await response.text();

    // Verification: Ensure we actually got calendar data
    if (data.includes('BEGIN:VCALENDAR')) {
      console.log(`[Calendar Proxy] Success: Received valid ICS data (${data.length} bytes)`);
      return new NextResponse(data, {
        headers: { 
          'Content-Type': 'text/calendar',
          'Access-Control-Allow-Origin': '*', // Ensure CORS is open for the frontend
        },
      });
    } else {
      console.error(`[Calendar Proxy] Error: Response did not contain VCALENDAR data. Starts with: ${data.substring(0, 50)}`);
      return NextResponse.json({ error: 'Link provided is not a valid iCal feed.' }, { status: 422 });
    }

  } catch (error: any) {
    console.error(`[Calendar Proxy] Critical Fetch Error: ${error.message}`);
    return NextResponse.json({ error: 'Failed to connect to Apple Calendar servers.' }, { status: 502 });
  }
}