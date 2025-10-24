// frontend/src/app/api/admin/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    // 1. Use the centralized utility to build headers and forward cookies, including User-Agent/CSRF
    const headers = buildHeadersFromRequest(request, {
      // Assuming X-CSRF-Token might be needed for the POST request
      'X-CSRF-Token': request.headers.get('x-csrf-token') || '',
    });

    // NOTE: Proxying to the client logout endpoint based on the frontend route name
    const response = await fetch(`${getBackendUrl()}/api/client/auth/logout`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      // If we need to send a body, we can capture it here, but logout usually doesn't need one.
    });

    // We fetch the raw text first to handle cases where the response body is empty (e.g., 204 No Content)
    const responseText = await response.text();
    let data;

    try {
      // Try parsing if there is text, otherwise assume success based on status/context
      data = responseText ? JSON.parse(responseText) : {
        success: true,
        message: 'Logout completed',
        authenticated: false
      };
    } catch (parseError) {
      // If parsing fails but the status is generally successful, return success data.
      if (response.ok) {
         data = { success: true, message: 'Logout completed (non-JSON response)', authenticated: false };
      } else {
         throw new Error(`Logout failed. Status: ${response.status}. Response: ${responseText}`);
      }
    }
    
    // 2. Prepare the NextResponse with the parsed data
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // 3. Forward Set-Cookie headers from the backend response
    forwardCookies(response, nextResponse);

    return nextResponse;

  } catch (error) {
    console.error('Frontend client logout API error:', error);
    // Even on error, we return a 200/202 to the client to ensure the client-side session state is cleared
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Logout failed due to network error, but attempting client side cleanup.',
      error: error instanceof Error ? error.message : 'Unknown network error'
    }, { status: 202 });
  }
}
