// frontend/src/app/api/createposts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const content = formData.get('content') as string;
    if (content && (content.includes('[QUOTE]') || content.includes('[HIGHLIGHT]'))) {
      console.log('Processing content with formatting tags');
    }
    
    const headers: HeadersInit = {
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
    };
    
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${getBackendUrl()}/api/news`, {
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
        errorData = { success: false, message: 'Failed to create post' };
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    if (data.success && content && (content.includes('[QUOTE]') || content.includes('[HIGHLIGHT]'))) {
      data.message = `${data.message} - Special formatting applied successfully!`;
    }
    
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
    console.error('Create posts API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create post',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const headers: HeadersInit = {
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
    };

    const response = await fetch(`${getBackendUrl()}/api/news?${queryString}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend GET responded with status: ${response.status}, body: ${errorText}`);
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
    console.error('Create posts GET API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch post data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const newsId = formData.get('news_id');
    
    if (!newsId) {
      return NextResponse.json(
        { success: false, message: 'News ID is required for updates' },
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

    const response = await fetch(`${getBackendUrl()}/api/news/${newsId}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend PUT responded with status: ${response.status}, body: ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: 'Failed to update post' };
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
    console.error('Create posts PUT API error:', error);
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
