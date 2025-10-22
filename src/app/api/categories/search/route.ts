import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';


export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const requestCookies = request.headers.get('cookie') || '';

    const response = await fetch(`${backendUrl}/api/client?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'Unknown'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: 'Search unavailable'
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      news: data.news || [],
      pagination: data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    });

  } catch (error) {
    console.error('Client search error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
