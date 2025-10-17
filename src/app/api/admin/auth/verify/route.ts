import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://vybeztribe.com';
};

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('Frontend verify request - forwarding session cookies');
    
    const response = await fetch(`${backendUrl}/api/admin/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Frontend',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      credentials: 'include'
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
      console.error('Failed to parse backend verify response:', parseError);
      data = {
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid server response',
        message: null
      };
    }
    
    console.log('Backend verify response:', { 
      status: response.status, 
      success: data.success,
      authenticated: data.authenticated,
      hasUser: !!data.user,
      userRole: data.user?.role
    });
    
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Forward session cookies from backend response
    const setCookieHeaders = response.headers.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
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
      nextResponse.headers.set('Set-Cookie', singleSetCookie);
    }

    return nextResponse;

  } catch (error) {
    console.error('Frontend verify API error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Session verification failed - network error',
      message: null
    }, { status: 500 });
  }
}
