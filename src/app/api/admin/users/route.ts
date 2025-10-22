
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${getBackendUrl()}/api/admin/users${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: buildHeadersFromRequest(request),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      
      if (response.status === 401) {
        return NextResponse.json({ 
          success: false, 
          message: 'Authentication required',
          users: [],
          authenticated: false
        }, { status: 401 });
      }
      
      if (response.status === 404) {
        return NextResponse.json({ 
          success: false, 
          message: 'Admin users endpoint not found',
          users: []
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: `Backend error: ${response.status}`,
        users: []
      }, { status: response.status });
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Admin Users GET API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch users',
      users: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { first_name, last_name, email, password, role } = body;
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'First name, last name, email, password, and role are required' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format' 
      }, { status: 400 });
    }

    if (password.trim().length < 6) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    const validRoles = ['editor', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid role specified' 
      }, { status: 400 });
    }

    const cleanBody = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      password: password.trim(),
      role: role.trim()
    };

    const response = await fetch(`${getBackendUrl()}/api/admin/users`, {
      method: 'POST',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(cleanBody),
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
    console.error('Admin Users POST API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create user' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !id.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }

    const body = await request.json();
    
    const { first_name, last_name, email, role } = body;
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !role?.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'First name, last name, email, and role are required' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format' 
      }, { status: 400 });
    }

    const validRoles = ['editor', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid role specified' 
      }, { status: 400 });
    }

    const cleanBody = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      role: role.trim()
    };

    const response = await fetch(`${getBackendUrl()}/api/admin/users?id=${id.trim()}`, {
      method: 'PUT',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(cleanBody),
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
    console.error('Admin Users PUT API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update user' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !id.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }

    const response = await fetch(`${getBackendUrl()}/api/admin/users?id=${id.trim()}`, {
      method: 'DELETE',
      headers: buildHeadersFromRequest(request),
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
    console.error('Admin Users DELETE API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete user' 
    }, { status: 500 });
  }
}
