// frontend/src/app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${getBackendUrl()}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Admin login error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    }, { status: 500 });
  }
}

// ❌ DO NOT ADD ANOTHER `export async function POST` HERE!
