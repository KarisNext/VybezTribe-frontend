// File: frontend/src/app/api/admin/edit/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://vybeztribe.com' 
  : 'http://localhost:5000';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Retrieve single post for editing
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Valid post ID is required' 
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/retrieve/${id}`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
        'Accept': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Post not found' 
          },
          { status: 404 }
        );
      }
      
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
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

// PUT - Update post
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Valid post ID is required' 
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields for update
    const requiredFields = ['title', 'content', 'author_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/retrieve/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '',
        'X-Real-IP': request.headers.get('X-Real-IP') || '',
      },
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
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
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

// DELETE - Delete post (alternative endpoint)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Valid post ID is required' 
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    
    const response = await fetch(`${API_BASE_URL}/api/admin/retrieve/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '',
        'X-Real-IP': request.headers.get('X-Real-IP') || '',
      },
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
          message: errorData.message || 'Failed to delete post',
          error: `HTTP ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
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