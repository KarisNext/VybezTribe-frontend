// frontend/src/app/api/categories/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildBackendHeaders } from '@/lib/backend-config';

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const backendUrl = getBackendUrl();
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'Category slug is required'
      }, { status: 400 });
    }
    
    // Build query string with slug
    const queryParams = new URLSearchParams(searchParams);
    queryParams.set('slug', slug);
    
    // Add default type if not provided
    if (!queryParams.has('type')) {
      queryParams.set('type', 'news');
    }
    
    const queryString = queryParams.toString();
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('[CATEGORY] Fetching:', slug, 'type:', queryParams.get('type'));
    
    // Use the correct backend endpoint: /api/client/category with query params
    const endpoint = `${backendUrl}/api/client/category?${queryString}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': requestCookies,
        'Origin': request.headers.get('origin') || 'https://vybeztribe.com',
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App'
      },
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('[CATEGORY] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CATEGORY] Error:', errorText);
      return NextResponse.json({
        success: false,
        message: `Category '${slug}' not found or unavailable`
      }, { status: response.status });
    }
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    // Forward cookies
    const backendCookies = response.headers.raw()['set-cookie'] || [];
    backendCookies.forEach((cookie) => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });
    
    return nextResponse;
    
  } catch (error) {
    console.error('[CATEGORY] Network error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch category',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
