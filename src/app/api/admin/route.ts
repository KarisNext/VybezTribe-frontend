// File: frontend/src/app/api/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://vybeztribe.com' 
  : 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Forward the request to backend retrieve endpoint
    const response = await fetch(`${API_BASE_URL}/api/retrieve?${queryString}`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend responded with status: ${response.status}, body: ${errorText}`);
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
    
    // Handle bulk actions
    const response = await fetch(`${API_BASE_URL}/api/actions`, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'Content-Type': 'application/json',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
      },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend POST responded with status: ${response.status}, body: ${errorText}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status 
    });
    
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
    
    // Forward the request to backend retrieve endpoint
    const response = await fetch(`${API_BASE_URL}/api/retrieve?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'Content-Type': 'application/json',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
      },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend DELETE responded with status: ${response.status}, body: ${errorText}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status 
    });
    
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