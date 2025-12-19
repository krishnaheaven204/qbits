import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime');
    const plantId = searchParams.get('plantId');
    const atun = searchParams.get('atun');
    const atpd = searchParams.get('atpd');

    const token = request.headers.get('authorization');

    const params = new URLSearchParams({
      startTime,
      plantId,
      atun: atun || '',
      atpd: atpd || ''
    });

    const apiUrl = `https://qbits.quickestimate.co/api/v1/plants/statistics-by-day/?${params}`;

    const headers = {
      'Accept': 'application/json',
    };
    
    if (token) {
      headers.Authorization = token;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
