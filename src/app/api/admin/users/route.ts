import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://vybeztribe.com' 
  : 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    console.log('Frontend API: GET /api/admin/users');
    
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const backendUrl = `${API_BASE_URL}/api/admin/users${queryString ? `?${queryString}` : ''}`;
    
    console.log('Proxying to:', backendUrl);
    console.log('Headers:', {
      cookie: request.headers.get('Cookie') ? 'present' : 'missing',
      csrfToken: request.headers.get('X-CSRF-Token') ? 'present' : 'missing'
    });
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'Content-Type': 'application/json',
        'User-Agent': 'VybezTribe-Admin/1.0',
        ...(request.headers.get('X-CSRF-Token') && {
          'X-CSRF-Token': request.headers.get('X-CSRF-Token')
        })
      },
      credentials: 'include'
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`Backend users GET error: ${response.status} - ${errorText}`);
      } catch (e) {
        console.error(`Backend users GET error: ${response.status} - Unable to read response`);
      }
      
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
          message: 'Admin users endpoint not found - check backend routing',
          users: [],
          debug: {
            backendUrl,
            status: response.status,
            error: errorText
          }
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: `Backend error: ${response.status}`,
        users: [],
        debug: {
          status: response.status,
          error: errorText
        }
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Backend data received:', { 
      success: data.success, 
      userCount: data.users?.length || 0 
    });
    
    return NextResponse.json(data, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Admin Users GET API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch users - network error',
      users: [],
      debug: {
        error: (error as Error).message,
        stack: (error as Error).stack
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { first_name, last_name, email, password, role } = body;
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'First name, last name, email, password, and role are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate password length
    if (password.trim().length < 6) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['editor', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid role specified' 
      }, { status: 400 });
    }

    // Clean the body data
    const cleanBody = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      password: password.trim(),
      role: role.trim()
    };

    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
      },
      body: JSON.stringify(cleanBody),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Backend users POST error: ${response.status} - ${data.message || 'Unknown error'}`);
    }

    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
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
    
    // Validate required fields for update
    const { first_name, last_name, email, role } = body;
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !role?.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'First name, last name, email, and role are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['editor', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid role specified' 
      }, { status: 400 });
    }

    // Clean the body data
    const cleanBody = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      role: role.trim()
    };

    const response = await fetch(`${API_BASE_URL}/api/admin/users?id=${id.trim()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
      },
      body: JSON.stringify(cleanBody),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Backend users PUT error: ${response.status} - ${data.message || 'Unknown error'}`);
    }

    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
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

    const response = await fetch(`${API_BASE_URL}/api/admin/users?id=${id.trim()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Backend users DELETE error: ${response.status} - ${data.message || 'Unknown error'}`);
    }

    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Admin Users DELETE API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete user' 
    }, { status: 500 });
  }
}