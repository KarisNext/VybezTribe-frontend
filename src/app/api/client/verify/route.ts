// frontend/src/app/api/client/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : process.env.BACKEND_URL || 'https://vybeztribe-backend.onrender.com';
};

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const incomingCookies = request.headers.get('cookie') || '';
    
    console.log('[CLIENT VERIFY] Checking session...');
    
    const response = await fetch(`${backendUrl}/api/client/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': incomingCookies,
        'Cache-Control': 'no-cache',
        'Origin': request.headers.get('origin') || 'https://vybeztribe.com'
      },
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('[CLIENT VERIFY] Response status:', response.status);
    
    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: null,
        message: 'Empty response'
      };
    } catch (parseError) {
      console.error('[CLIENT VERIFY] Parse error:', parseError);
      data = {
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: null,
        message: 'Invalid response'
      };
    }
    
    const statusCode = response.ok ? 200 : response.status;
    const nextResponse = NextResponse.json(data, { status: statusCode });
    
    // Forward cookies
    const backendCookies = response.headers.raw()['set-cookie'] || [];
    backendCookies.forEach((cookie) => {
      let modifiedCookie = cookie;
      
      if (process.env.NODE_ENV === 'production') {
        if (!cookie.includes('SameSite=')) {
          modifiedCookie = `${cookie}; SameSite=None; Secure`;
        } else if (cookie.includes('SameSite=Lax') || cookie.includes('SameSite=Strict')) {
          modifiedCookie = cookie.replace(/SameSite=(Lax|Strict)/i, 'SameSite=None; Secure');
        }
      }
      
      nextResponse.headers.append('Set-Cookie', modifiedCookie);
    });
    
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return nextResponse;
    
  } catch (error) {
    console.error('[CLIENT VERIFY] Error:', error);
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: 'Session verification failed'
    }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const incomingCookies = request.headers.get('cookie') || '';
    const body = await request.json();
    
    console.log('[CLIENT VERIFY POST] Action:', body.action);
    
    const response = await fetch(`${backendUrl}/api/client/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': incomingCookies,
        'Origin': request.headers.get('origin') || 'https://vybeztribe.com'
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: null,
        message: 'Empty response'
      };
    } catch (parseError) {
      data = {
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: null,
        message: 'Invalid response'
      };
    }
    
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Forward cookies
    const backendCookies = response.headers.raw()['set-cookie'] || [];
    backendCookies.forEach((cookie) => {
      let modifiedCookie = cookie;
      
      if (process.env.NODE_ENV === 'production') {
        if (!cookie.includes('SameSite=')) {
          modifiedCookie = `${cookie}; SameSite=None; Secure`;
        } else if (cookie.includes('SameSite=Lax') || cookie.includes('SameSite=Strict')) {
          modifiedCookie = cookie.replace(/SameSite=(Lax|Strict)/i, 'SameSite=None; Secure');
        }
      }
      
      nextResponse.headers.append('Set-Cookie', modifiedCookie);
    });
    
    return nextResponse;
    
  } catch (error) {
    console.error('[CLIENT VERIFY POST] Error:', error);
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: 'Request failed'
    }, { status: 500 });
  }
}
