// frontend/src/app/api/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    // Build headers and forward cookies for admin logout
    const headers = buildHeadersFromRequest(request, {
      'X-CSRF-Token': request.headers.get('x-csrf-token') || '',
    });

    // FIXED: Proxy to the ADMIN logout endpoint, not client
    const response = await fetch(`${getBackendUrl()}/api/admin/auth/logout`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
    });

    // Handle response text (might be empty for 204)
    const responseText = await response.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {
        success: true,
        message: 'Admin logout completed',
        authenticated: false
      };
    } catch (parseError) {
      if (response.ok) {
        data = { 
          success: true, 
          message: 'Admin logout completed', 
          authenticated: false 
        };
      } else {
        throw new Error(`Admin logout failed. Status: ${response.status}. Response: ${responseText}`);
      }
    }
    
    // Prepare response and forward cookies
    const nextResponse = NextResponse.json(data, { status: response.status });
    forwardCookies(response, nextResponse);
    
    return nextResponse;
  } catch (error) {
    console.error('❌ Frontend admin logout API error:', error);
    
    // Return graceful error to allow client-side cleanup
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Admin logout failed due to network error, but attempting client side cleanup.',
      error: error instanceof Error ? error.message : 'Unknown network error'
    }, { status: 202 });
  }
}
