
// frontend/src/app/api/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${getBackendUrl()}/api/admin/auth/logout`, {
      method: 'POST',
      headers: { cookie: cookieHeader },
      credentials: 'include',
    });

    const data = await response.json();

    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    forwardCookies(response, nextResponse);

    return nextResponse;
  } catch (error) {
    console.error('❌ Admin logout error:', error);
    return NextResponse.json(
      {
        success: false,
        isAuthenticated: false,
        message: error instanceof Error ? error.message : 'Logout failed',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      }
    );
  }
}
