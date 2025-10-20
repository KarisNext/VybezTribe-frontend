// frontend/src/app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : process.env.BACKEND_URL || 'https://vybeztribe-backend.onrender.com';
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
    
    console.log('[LOGIN] Request for:', body.identifier);
    console.log('[LOGIN] Backend URL:', backendUrl);
    
    // Get cookies from incoming request
    const incomingCookies = request.headers.get('cookie') || '';
    
    const response = await fetch(`${backendUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': incomingCookies,
        'Origin': request.headers.get('origin') || 'https://vybeztribe.com',
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Frontend'
      },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    
    let data;
    try {
      const responseText = await response.text();
      console.log('[LOGIN] Backend response:', responseText.substring(0, 200));
      data = responseText ? JSON.parse(responseText) : {
        success: false,
        authenticated: false,
        user: null,
        error: 'Empty response from server',
        message: null
      };
    } catch (parseError) {
      console.error('[LOGIN] Failed to parse backend response:', parseError);
      data = {
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid server response',
        message: null
      };
    }
    
    console.log('[LOGIN] Response:', { 
      status: response.status, 
      success: data.success,
      authenticated: data.authenticated,
      hasUser: !!data.user
    });
    
    // Create response
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // CRITICAL: Forward ALL Set-Cookie headers from backend
    const backendCookies = response.headers.raw()['set-cookie'] || [];
    console.log('[LOGIN] Backend sent', backendCookies.length, 'cookies');
    
    backendCookies.forEach((cookie) => {
      // Modify cookie for cross-domain if needed
      let modifiedCookie = cookie;
      
      if (process.env.NODE_ENV === 'production') {
        // Ensure SameSite=None and Secure for cross-domain
        if (!cookie.includes('SameSite=')) {
          modifiedCookie = `${cookie}; SameSite=None; Secure`;
        } else if (cookie.includes('SameSite=Lax') || cookie.includes('SameSite=Strict')) {
          modifiedCookie = cookie.replace(/SameSite=(Lax|Strict)/i, 'SameSite=None; Secure');
        }
      }
      
      nextResponse.headers.append('Set-Cookie', modifiedCookie);
    });
    
    // Add CORS headers for cross-domain
    nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return nextResponse;
    
  } catch (error) {
    console.error('[LOGIN] Network error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Authentication service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
