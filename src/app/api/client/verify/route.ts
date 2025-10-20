
// frontend/src/app/api/client/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    console.log('Client verify GET - checking existing session');
    
    const verifyResponse = await fetch(`${getBackendUrl()}/api/client/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
      },
      credentials: 'include',
      cache: 'no-store' // Important for session checks
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const nextResponse = NextResponse.json(verifyData);
      
      forwardCookies(verifyResponse, nextResponse);
      return nextResponse;
    }
    
    // If GET fails, return the error - don't automatically create session
    console.log('No existing session found, returning anonymous state');
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: 'No active session'
    }, { 
      status: 200, // Still return 200 but with anonymous state
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Client verification error:', error);
    
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: 'Session check failed'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    const body = await request.json();
    
    console.log('Client verify POST - creating session:', body.action);
    
    const response = await fetch(`${getBackendUrl()}/api/client/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;

  } catch (error) {
    console.error('Client POST error:', error);
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      client_id: null,
      csrf_token: null,
      message: 'Session creation failed'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
