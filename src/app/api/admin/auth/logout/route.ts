// frontend/src/app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    const response = await fetch(`${getBackendUrl()}/api/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-Frontend',
        'X-CSRF-Token': request.headers.get('x-csrf-token') || ''
      },
      credentials: 'include'
    });

    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {
        success: true,
        authenticated: false,
        user: null,
        csrf_token: null,
        error: null,
        message: 'Logout completed'
      };
    } catch (parseError) {
      console.error('Failed to parse logout response:', parseError);
      data = {
        success: true,
        authenticated: false,
        user: null,
        csrf_token: null,
        error: null,
        message: 'Logout completed'
      };
    }
    
    const nextResponse = NextResponse.json(data, { status: 200 });
    forwardCookies(response, nextResponse);

    return nextResponse;

  } catch (error) {
    console.error('Frontend logout API error:', error);
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null,
      csrf_token: null,
      error: null,
      message: 'Logout completed (with errors)'
    }, { status: 200 });
  }
}
