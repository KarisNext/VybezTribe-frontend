// frontend/src/app/api/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('🚪 Admin logout API - forwarding to backend');
    
    const backendUrl = `${getBackendUrl()}/api/admin/auth/logout`;
    
    const response = await fetch(backendUrl, {
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
    nextResponse.cookies.set('vybeztribe_admin_session', '', {
      maxAge: 0,
      path: '/'
    });
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Admin logout API error:', error);
    
    const nextResponse = NextResponse.json({
      success: true,
      message: 'Logged out'
    });
    
    nextResponse.cookies.set('vybeztribe_admin_session', '', {
      maxAge: 0,
      path: '/'
    });
    
    return nextResponse;
  }
}
