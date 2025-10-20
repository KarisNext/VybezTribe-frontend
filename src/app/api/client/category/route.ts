// frontend/src/app/api/client/category/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const type = searchParams.get('type') || 'news';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'Category slug is required'
      }, { status: 400 });
    }

    const headers = new Headers({
        'Content-Type': 'application/json',
    });
    if (request.headers.has('authorization')) {
        headers.set('Authorization', request.headers.get('authorization')!);
    }
    if (request.headers.has('cookie')) {
        headers.set('Cookie', request.headers.get('cookie')!);
    }

    let backendUrl = '';
    
    switch (type) {
      case 'news':
        backendUrl = `${getBackendUrl()}/api/categories/${encodeURIComponent(slug)}/news?page=${page}&limit=${limit}`;
        break;
      case 'featured':
        backendUrl = `${getBackendUrl()}/api/categories/${encodeURIComponent(slug)}/featured?limit=${limit}`;
        break;
      case 'trending':
        backendUrl = `${getBackendUrl()}/api/categories/${encodeURIComponent(slug)}/trending?limit=${limit}`;
        break;
      case 'stats':
        backendUrl = `${getBackendUrl()}/api/categories/${encodeURIComponent(slug)}/stats`;
        break;
      case 'details':
        backendUrl = `${getBackendUrl()}/api/categories/${encodeURIComponent(slug)}`;
        break;
      default:
        backendUrl = `${getBackendUrl()}/api/categories/${encodeURIComponent(slug)}/news?page=${page}&limit=${limit}`;
        break;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: headers,
      cache: 'no-cache'
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          message: `Category '${slug}' not found`
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`,
        error: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    forwardCookies(response, nextResponse);
    return nextResponse;

  } catch (error) {
    console.error('Category route error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
