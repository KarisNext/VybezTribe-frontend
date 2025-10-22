import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await fetch(`${getBackendUrl()}/api/retrieve?${queryString}`, {
      method: 'GET',
      headers: buildHeadersFromRequest(request),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend responded with status: ${response.status}, body: ${errorText}`);
      throw new Error(`Backend responded with status: ${response.status}`);
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
    console.error('Admin GET API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve admin posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${getBackendUrl()}/api/actions`, {
      method: 'POST',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend POST responded with status: ${response.status}, body: ${errorText}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Admin POST API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to perform bulk action',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Post ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(`${getBackendUrl()}/api/retrieve?id=${id}`, {
      method: 'DELETE',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend DELETE responded with status: ${response.status}, body: ${errorText}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Admin DELETE API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete post',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
