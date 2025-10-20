// frontend/src/app/api/admin/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : process.env.BACKEND_URL || 'https://vybeztribe-backend.onrender.com';
};

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    
    // Get ALL cookies from incoming request
    const incomingCookies = request.headers.get('cookie') || '';
    
    console.log('[VERIFY] Checking session...');
    console.log('[VERIFY] Has cookies:', !!incomingCookies);
    console.log('[VERIFY] Backend URL:', backendUrl);
    
    const response = await fetch(`${backendUrl}/api/admin/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': incomingCookies,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Origin': request.headers.get('origin') || 'https://vybeztribe.com',
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Frontend'
      },
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('[VERIFY] Backend response status:', response.status);
    
    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {
        success: false,
        authenticated: false,
        user: null,
        error: response.status === 401 ? 'Not authenticated' : 'Empty response',
        message: null
      };
    } catch (parseError) {
      console.error('[VERIFY] Parse error:', parseError);
      data = {
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid server response',
        message: null
      };
    }
    
    console.log('[VERIFY] Authenticated:', data.authenticated, 'Has user:', !!data.user);
    
    // Create response with appropriate status
    const statusCode = response.ok ? 200 : response.status;
    const nextResponse = NextResponse.json(data, { status: statusCode });
    
    // Forward any cookies from backend
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
    
    nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return nextResponse;
    
  } catch (error) {
    console.error('[VERIFY] Network error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Session verification failed',
      message: error instanceof Error ? error.message : 'Network error'
    }, { status: 503 });
  }
}
