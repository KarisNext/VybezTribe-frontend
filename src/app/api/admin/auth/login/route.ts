// frontend/src/app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('Admin login API route - forwarding to backend');
    
    // IMPORTANT: No trailing slash in the URL
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
    
    console.log('Backend login response status:', response.status);
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status 
    });
    
    // Forward Set-Cookie headers from backend
    forwardCookies(response, nextResponse);
    
    return nextResponse;
  } catch (error) {
    console.error('Admin login API route error:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Login request failed',
      message: 'Network error during login'
    }, { 
      status: 500 
    });
  }
}
