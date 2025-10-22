// frontend/src/app/api/client/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const categories = searchParams.get('categories');
    const sort = searchParams.get('sort') || 'relevance';
    const type = searchParams.get('type') || 'search';

    let backendUrl = '';
    
    if (type === 'suggestions') {
      backendUrl = `${getBackendUrl()}/api/search/suggestions?q=${encodeURIComponent(query || '')}&limit=${limit}`;
    } else if (type === 'popular') {
      backendUrl = `${getBackendUrl()}/api/search/popular?limit=${limit}`;
    } else {
      if (!query || query.trim().length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
          total: 0,
          query: ''
        });
      }

      backendUrl = `${getBackendUrl()}/api/search?q=${encodeURIComponent(query)}&limit=${limit}&sort=${sort}`;
      
      if (categories) {
        backendUrl += `&categories=${encodeURIComponent(categories)}`;
      }
    }

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (request.headers.has('authorization')) {
      headers.set('Authorization', request.headers.get('authorization')!);
    }
    if (request.headers.has('cookie')) {
      headers.set('Cookie', request.headers.get('cookie')!);
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: headers,
      cache: 'no-cache'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`,
        error: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    forwardCookies(response, nextResponse);
    return nextResponse;

  } catch (error) {
    console.error('Search route error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
