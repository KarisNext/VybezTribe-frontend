import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://api.vybeztribe.com';
};

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid request format',
        message: null
      }, { status: 400 });
    }
    
    console.log('Frontend login request for:', body.identifier);
    
    // Forward cookies from the request to maintain session consistency
    const requestCookies = request.headers.get('cookie') || '';
    
    const response = await fetch(`${backendUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Frontend',
        'Cookie': requestCookies,
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.ip || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {
        success: false,
        authenticated: false,
        user: null,
        error: 'Empty response from server',
        message: null
      };
    } catch (parseError) {
      console.error('Failed to parse backend login response:', parseError);
      data = {
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid server response',
        message: null
      };
    }
    
    console.log('Backend login response:', { 
      status: response.status, 
      success: data.success,
      authenticated: data.authenticated,
      hasUser: !!data.user,
      userRole: data.user?.role
    });
    
    // Create response with the same status code
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Forward session cookies from backend response
    const setCookieHeaders = response.headers.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      console.log('Forwarding', setCookieHeaders.length, 'session cookie headers');
      setCookieHeaders.forEach((cookie, index) => {
        if (index === 0) {
          nextResponse.headers.set('Set-Cookie', cookie);
        } else {
          nextResponse.headers.append('Set-Cookie', cookie);
        }
      });
    }

    // Also handle single Set-Cookie header for compatibility
    const singleSetCookie = response.headers.get('set-cookie');
    if (singleSetCookie && (!setCookieHeaders || setCookieHeaders.length === 0)) {
      console.log('Forwarding single session cookie header');
      nextResponse.headers.set('Set-Cookie', singleSetCookie);
    }

    return nextResponse;

  } catch (error) {
    console.error('Frontend login API error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Authentication service unavailable - network error',
      message: null
    }, { status: 500 });
  }
}