
// src/app/api/admin/edit/[id]/route.ts - CLEANED AND CORRECTED CODE

import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';


interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Valid post ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBackendUrl()}/api/admin/retrieve/${id}`, {
      method: 'GET',
      headers: buildHeadersFromRequest(request), 
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, message: 'Post not found' },
          { status: 404 }
        );
      }
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
    console.error('Admin edit GET API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve post for editing',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Valid post ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const requiredFields = ['title', 'content', 'author_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBackendUrl()}/api/admin/retrieve/${id}`, {
      method: 'PUT',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }), 
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Backend responded with status: ${response.status}` 
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to update post',
          error: `HTTP ${response.status}`
        },
        { status: response.status }
      );
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
    console.error('Admin edit PUT API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update post',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Valid post ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({})); 
    
    const response = await fetch(`${getBackendUrl()}/api/admin/retrieve/${id}`, {
      method: 'DELETE',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }), 
      credentials: 'include',
      ...(Object.keys(body).length > 0 && { body: JSON.stringify(body) }) 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Backend responded with status: ${response.status}` 
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to delete post',
          error: `HTTP ${response.status}`
        },
        { status: response.status }
      );
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
    console.error('Admin edit DELETE API error:', error);
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
