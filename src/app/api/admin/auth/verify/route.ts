// frontend/src/app/api/admin/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('🔍 Admin verify - checking session');
    
    const backendUrl = `${getBackendUrl()}/api/admin/auth/verify`;
    console.log('Backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
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
    console.log('Verify data:', { success: data.success, authenticated: data.authenticated });
    
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
