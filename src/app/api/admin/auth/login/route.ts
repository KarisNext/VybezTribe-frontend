// frontend/src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { email, password } = body;
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email and password are required' 
      }, { status: 400 });
    }

    const response = await fetch(`${getBackendUrl()}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password.trim()
      }),
      credentials: 'include'
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    
    return nextResponse;
    
  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Login failed' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'Cache-Control': 'no-cache',
      },
      credentials: 'include',
      cache: 'no-store'
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return nextResponse;
    
  } catch (error) {
    console.error('Admin verify API error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      message: 'Verification failed'
    }, { status: 500 });
  }
}
