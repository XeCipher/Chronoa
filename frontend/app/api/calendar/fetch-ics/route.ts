// frontend/app/api/calendar/fetch-ics/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Added (s)? to ensure Apple's webcals:// protocols are converted correctly
  url = url.replace(/^webcal(s)?:\/\//i, 'https://');

  try {
    const response = await fetch(url, {
      headers: {
        // Standard User-Agent helps bypass calendar providers blocking automated scripts
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/calendar, text/plain, */*'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch calendar data. The link might be private or invalid.' }, { status: 400 });
    }

    const text = await response.text();

    // Basic validation to ensure we successfully received an ICS calendar format
    if (!text.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({ error: 'Invalid calendar format received. Make sure it is an iCal (.ics) link.' }, { status: 400 });
    }

    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/calendar' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to the calendar URL.' }, { status: 500 });
  }
}