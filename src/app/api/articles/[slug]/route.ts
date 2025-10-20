// frontend/src/app/api/articles/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : process.env.BACKEND_URL || 'https://vybeztribe-backend.onrender.com';
};

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const backendUrl = getBackendUrl();
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const requestCookies = request.headers.get('cookie') || '';
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'Article slug is required'
      }, { status: 400 });
    }
    
    console.log('[ARTICLE] Fetching:', slug);
    
    // Use the correct backend endpoint: /api/client/article with query param
    const queryParams = new URLSearchParams(searchParams);
    queryParams.set('slug', slug);
    const queryString = queryParams.toString();
    
    const endpoint = `${backendUrl}/api/client/article?${queryString}`;
    
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
    
    console.log('[ARTICLE] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ARTICLE] Error:', errorText);
      return NextResponse.json({
        success: false,
        message: 'Article not found',
        article: null
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
    console.error('[ARTICLE] Network error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch article',
      article: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle article interactions (like, bookmark, share, comments)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const backendUrl = getBackendUrl();
    const { slug } = params;
    const requestCookies = request.headers.get('cookie') || '';
    const body = await request.json();
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'Article slug is required'
      }, { status: 400 });
    }
    
    console.log('[ARTICLE POST] Action:', body.action || 'unknown', 'for:', slug);
    
    // Use client API for interactions
    const queryParams = new URLSearchParams({ slug });
    const endpoint = `${backendUrl}/api/client/article?${queryParams}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': requestCookies,
        'Origin': request.headers.get('origin') || 'https://vybeztribe.com',
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App'
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Forward cookies
    const backendCookies = response.headers.raw()['set-cookie'] || [];
    backendCookies.forEach((cookie) => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });
    
    return nextResponse;
    
  } catch (error) {
    console.error('[ARTICLE POST] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
