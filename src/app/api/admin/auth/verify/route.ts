// frontend/src/app/api/client/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';


export async function GET(request: NextRequest) {
  try {
    const requestCookies = request.headers.get('cookie') || '';
    
    const verifyResponse = await fetch(`${getBackendUrl()}/api/client/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
      },
      credentials: 'include'
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const nextResponse = NextResponse.json(verifyData);
      
      forwardCookies(verifyResponse, nextResponse);
      return nextResponse;
    }
    
    const createResponse = await fetch(`${getBackendUrl()}/api/client/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
      },
      body: JSON.stringify({ action: 'create_anonymous' }),
      credentials: 'include'
    });
    
    if (!createResponse.ok) {
      throw new Error('Failed to create anonymous session');
    }

    const createData = await createResponse.json();
    const nextResponse = NextResponse.json(createData);
    
    forwardCookies(createResponse, nextResponse);
    return nextResponse;

  } catch (error) {
    console.error('Client verification error:', error);
    
    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      isAnonymous: false,
      user: null,
      client_id: 'temp-client-id',
      csrf_token: 'temp-csrf-token',
      message: 'Using temporary session'
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
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    return nextResponse;

  } catch (error) {
    console.error('Client POST error:', error);
    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      isAnonymous: false,
      client_id: 'temp-client-id',
      csrf_token: 'temp-csrf-token',
      message: 'Using temporary session'
    }, { status: 200 });
  }
}
