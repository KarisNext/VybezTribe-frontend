// frontend/src/app/api/articles/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://api.vybeztribe.com';
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
    
    const queryString = searchParams.toString();
    const endpoint = `/api/articles/${slug}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Article API request:', endpoint);
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
        'Authorization': request.headers.get('authorization') || '',
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { 
      status: response.ok ? 200 : response.status 
    });
    
    // Forward cookies
    const setCookieHeaders = response.headers.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    }
    
    return nextResponse;

  } catch (error) {
    console.error('Article API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch article',
      article: null
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
    
    console.log('Article POST request:', slug, body.action || 'unknown');
    
    const response = await fetch(`${backendUrl}/api/articles/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Forward cookies
    const setCookieHeaders = response.headers.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    }
    
    return nextResponse;

  } catch (error) {
    console.error('Article POST error:', error);
    return NextResponse.json({
      success: false,
      message: 'Request failed'
    }, { status: 500 });
  }
}