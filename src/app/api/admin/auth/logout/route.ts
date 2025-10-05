import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://api.vybeztribe.com';
};

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('Frontend logout request - has cookies:', !!requestCookies);
    
    const response = await fetch(`${backendUrl}/api/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Frontend',
        'X-CSRF-Token': request.headers.get('x-csrf-token') || ''
      },
      credentials: 'include'
    });

    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {
        success: true,
        authenticated: false,
        user: null,
        csrf_token: null,
        error: null,
        message: 'Logout completed'
      };
    } catch (parseError) {
      console.error('Failed to parse logout response:', parseError);
      // Even if parsing fails, treat as successful logout
      data = {
        success: true,
        authenticated: false,
        user: null,
        csrf_token: null,
        error: null,
        message: 'Logout completed'
      };
    }
    
    console.log('Backend logout response:', { 
      status: response.status, 
      success: data.success
    });
    
    // Create response - always return 200 for logout
    const nextResponse = NextResponse.json(data, { status: 200 });

    // Forward cookie clearing headers from backend
    const setCookieHeaders = response.headers.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      console.log('Forwarding cookie clearing headers');
      setCookieHeaders.forEach((cookie, index) => {
        if (index === 0) {
          nextResponse.headers.set('Set-Cookie', cookie);
        } else {
          nextResponse.headers.append('Set-Cookie', cookie);
        }
      });
    }

    // Also handle single Set-Cookie header
    const singleSetCookie = response.headers.get('set-cookie');
    if (singleSetCookie && (!setCookieHeaders || setCookieHeaders.length === 0)) {
      console.log('Forwarding single cookie clearing header');
      nextResponse.headers.set('Set-Cookie', singleSetCookie);
    }

    return nextResponse;

  } catch (error) {
    console.error('Frontend logout API error:', error);
    // Even on error, return successful logout response
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null,
      csrf_token: null,
      error: null,
      message: 'Logout completed (with errors)'
    }, { status: 200 });
  }
}