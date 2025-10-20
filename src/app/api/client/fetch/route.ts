// frontend/src/app/api/client/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'news';
    
    let backendUrl = '';
    const params = new URLSearchParams();
    
    searchParams.forEach((value, key) => {
      if (key !== 'type') {
        params.set(key, value);
      }
    });
    
    switch (type) {
      case 'category':
        const category = searchParams.get('category');
        if (!category) {
          return NextResponse.json({ success: false, message: 'Category required' }, { status: 400 });
        }
        backendUrl = `${getBackendUrl()}/api/news/category/${category}`;
        break;
        
      case 'article':
        const slug = searchParams.get('slug');
        if (!slug) {
          return NextResponse.json({ success: false, message: 'Article slug required' }, { status: 400 });
        }
        backendUrl = `${getBackendUrl()}/api/news/article/${slug}`;
        break;
        
      case 'breaking':
        backendUrl = `${getBackendUrl()}/api/news/breaking`;
        break;
        
      case 'featured':
        backendUrl = `${getBackendUrl()}/api/news/featured`;
        break;
        
      case 'trending':
        backendUrl = `${getBackendUrl()}/api/news/trending`;
        break;
        
      case 'categories':
        backendUrl = `${getBackendUrl()}/api/news/categories`;
        break;
        
      case 'search':
        backendUrl = `${getBackendUrl()}/api/news`;
        const query = searchParams.get('q');
        if (query) params.set('search', query);
        break;
        
      default:
        backendUrl = `${getBackendUrl()}/api/news`;
    }
    
    const queryString = params.toString();
    const fullUrl = `${backendUrl}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    if (!response.ok) {
      console.error('Backend error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        message: `Backend error: ${response.status}`
      }, { status: response.status });
    }
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('API route error:', error);
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
    const { action, id } = body;
    
    if (!action || !id) {
      return NextResponse.json({
        success: false,
        message: 'Action and ID required'
      }, { status: 400 });
    }
    
    let endpoint = '';
    switch (action) {
      case 'view':
        endpoint = `${getBackendUrl()}/api/news/view/${id}`;
        break;
      case 'like':
        endpoint = `${getBackendUrl()}/api/news/like/${id}`;
        break;
      case 'share':
        endpoint = `${getBackendUrl()}/api/news/share/${id}`;
        break;
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Action failed'
    }, { status: 500 });
  }
}
