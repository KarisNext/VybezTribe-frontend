// frontend/src/app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const headers: HeadersInit = {
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
      'Accept': 'application/json',
    };

    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const backendUrl = queryString 
      ? `${getBackendUrl()}/api/media?${queryString}`
      : `${getBackendUrl()}/api/media`;

    console.log('Fetching media from:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-cache'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend GET responded with status: ${response.status}, body: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: 'Failed to fetch media' };
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const headers: HeadersInit = {
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
    };
    
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${getBackendUrl()}/api/media`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend POST responded with status: ${response.status}, body: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: 'Failed to upload media' };
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Media POST API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload media',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');
    
    if (!mediaId) {
      return NextResponse.json(
        { success: false, message: 'Media ID is required' },
        { status: 400 }
      );
    }
    
    const headers: HeadersInit = {
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
    };
    
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${getBackendUrl()}/api/media/${mediaId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend DELETE responded with status: ${response.status}, body: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: 'Failed to delete media' };
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Media DELETE API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete media',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
