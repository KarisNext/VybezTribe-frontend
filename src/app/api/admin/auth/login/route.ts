// frontend/src/app/api/admin/auth/login/route.ts
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
