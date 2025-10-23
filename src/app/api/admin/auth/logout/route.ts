// frontend/src/app/api/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('Admin logout - forwarding to backend');
    
    const response = await fetch(`${getBackendUrl()}/api/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status 
    });
    
    // Clear the admin session cookie
    nextResponse.cookies.delete('vybeztribe_admin_session');
    
    return nextResponse;
  } catch (error) {
    console.error('Admin logout error:', error);
    
    // Even on error, return success to clear frontend state
    const nextResponse = NextResponse.json({
      success: true,
      message: 'Logged out'
    });
    
    nextResponse.cookies.delete('vybeztribe_admin_session');
    
    return nextResponse;
  }
}
