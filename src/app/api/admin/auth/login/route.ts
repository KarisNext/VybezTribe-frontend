// ============================================
// FILE 1: frontend/src/app/api/admin/auth/login/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('🔐 Admin login - forwarding to backend');
    
    const response = await fetch(`${getBackendUrl()}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Admin',
      },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    
    console.log('📡 Backend response status:', response.status);
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Forward cookies from backend
    forwardCookies(response, nextResponse);
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Admin login error:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Login request failed',
      message: error instanceof Error ? error.message : 'Network error'
    }, { status: 500 });
  }
}

// ============================================
// FILE 2: frontend/src/app/api/admin/auth/verify/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('🔍 Admin verify - checking session');
    
    const response = await fetch(`${getBackendUrl()}/api/admin/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Admin',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('📡 Backend verify status:', response.status);
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    
    forwardCookies(response, nextResponse);
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Admin verify error:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Session verification failed',
      message: error instanceof Error ? error.message : 'Network error'
    }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }
}

// ============================================
// FILE 3: frontend/src/app/api/admin/auth/logout/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('🚪 Admin logout - forwarding to backend');
    
    const response = await fetch(`${getBackendUrl()}/api/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Clear admin session cookie
    nextResponse.cookies.delete('vybeztribe_admin_session');
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Admin logout error:', error);
    
    const nextResponse = NextResponse.json({
      success: true,
      message: 'Logged out'
    });
    
    nextResponse.cookies.delete('vybeztribe_admin_session');
    
    return nextResponse;
  }
}

// ============================================
// FILE 4: frontend/src/app/api/client/auth/anonymous/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('👤 Creating anonymous session');
    
    const response = await fetch(`${getBackendUrl()}/api/client/auth/anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
      },
      credentials: 'include'
    });
    
    console.log('📡 Anonymous session response:', response.status);
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Anonymous session error:', error);
    
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: error instanceof Error ? error.message : 'Session creation failed'
    }, { status: 500 });
  }
}

// ============================================
// FILE 5: frontend/src/app/api/client/auth/verify/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('🔍 Client verify - checking session');
    
    const response = await fetch(`${getBackendUrl()}/api/client/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
      },
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('📡 Client verify status:', response.status);
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    
    forwardCookies(response, nextResponse);
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Client verify error:', error);
    
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: error instanceof Error ? error.message : 'Session check failed'
    }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }
}

// ============================================
// FILE 6: frontend/src/app/api/client/auth/logout/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('🚪 Client logout - forwarding to backend');
    
    const response = await fetch(`${getBackendUrl()}/api/client/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Clear client session cookie
    nextResponse.cookies.delete('vybeztribe_public_session');
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Client logout error:', error);
    
    const nextResponse = NextResponse.json({
      success: true,
      message: 'Logged out'
    });
    
    nextResponse.cookies.delete('vybeztribe_public_session');
    
    return nextResponse;
  }
}
