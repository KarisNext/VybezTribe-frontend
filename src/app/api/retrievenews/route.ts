// frontend/src/app/api/retrieve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let slug = searchParams.get('slug');
    
    console.log('=== RETRIEVE ARTICLE ROUTE DEBUG ===');
    console.log('Received raw slug:', slug);
    console.log('Backend URL:', getBackendUrl());
    
    if (!slug) {
      console.log('ERROR: No slug provided');
      return NextResponse.json({ 
        success: false, 
        message: 'Article slug is required' 
      }, { status: 400 });
    }

    // Clean up slug
    slug = slug.trim().replace(/^-+|-+$/g, '');
    console.log('Cleaned slug:', slug);
    
    if (!slug) {
      console.log('ERROR: Slug is empty after cleaning');
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid article slug' 
      }, { status: 400 });
    }

    // Build backend URL
    const backendUrl = `${getBackendUrl()}/api/articles/${encodeURIComponent(slug)}`;
    console.log('Calling backend URL:', backendUrl);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
    };

    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-cache'
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Backend error response:', errorText);
      
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          message: 'Article not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`,
        error: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Backend data received successfully');

    const nextResponse = NextResponse.json({
      success: true,
      article: data.article,
      related_articles: data.related_articles || [],
      comments: data.comments || []
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    forwardCookies(response, nextResponse);
    return nextResponse;

  } catch (error) {
    console.error('=== RETRIEVE ARTICLE ROUTE ERROR ===');
    console.error('Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, slug, ...otherData } = body;

    console.log('=== RETRIEVE ARTICLE POST DEBUG ===');
    console.log('Action:', action);
    console.log('Slug:', slug);

    if (!action || !slug) {
      return NextResponse.json({
        success: false,
        message: 'Action and slug are required'
      }, { status: 400 });
    }

    let endpoint = '';
    
    switch (action) {
      case 'view':
        endpoint = `${getBackendUrl()}/api/articles/${encodeURIComponent(slug)}/view`;
        break;
      case 'like':
        endpoint = `${getBackendUrl()}/api/articles/${encodeURIComponent(slug)}/like`;
        break;
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

    console.log('Calling backend endpoint:', endpoint);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
    };

    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(otherData)
    });

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
    console.error('=== RETRIEVE ARTICLE POST ERROR ===');
    console.error('Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Action failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
