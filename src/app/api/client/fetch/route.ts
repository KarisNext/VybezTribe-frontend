// app/api/client/fetch/route.ts - WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://vybeztribe.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'news';
    
    console.log('Frontend API called with type:', type);
    
    // Build backend URL based on type
    let backendUrl = '';
    const params = new URLSearchParams();
    
    // Copy query parameters
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
        backendUrl = `${BACKEND_URL}/api/news/category/${category}`;
        break;
        
      case 'article':
        const slug = searchParams.get('slug');
        if (!slug) {
          return NextResponse.json({ success: false, message: 'Article slug required' }, { status: 400 });
        }
        backendUrl = `${BACKEND_URL}/api/news/article/${slug}`;
        break;
        
      case 'breaking':
        backendUrl = `${BACKEND_URL}/api/news/breaking`;
        break;
        
      case 'featured':
        backendUrl = `${BACKEND_URL}/api/news/featured`;
        break;
        
      case 'trending':
        backendUrl = `${BACKEND_URL}/api/news/trending`;
        break;
        
      case 'categories':
        backendUrl = `${BACKEND_URL}/api/news/categories`;
        break;
        
      case 'search':
        backendUrl = `${BACKEND_URL}/api/news`;
        const query = searchParams.get('q');
        if (query) params.set('search', query);
        break;
        
      default:
        backendUrl = `${BACKEND_URL}/api/news`;
    }
    
    const queryString = params.toString();
    const fullUrl = `${backendUrl}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Calling backend:', fullUrl);
    
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
    return NextResponse.json(data);
    
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
        endpoint = `${BACKEND_URL}/api/news/view/${id}`;
        break;
      case 'like':
        endpoint = `${BACKEND_URL}/api/news/like/${id}`;
        break;
      case 'share':
        endpoint = `${BACKEND_URL}/api/news/share/${id}`;
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
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Action failed'
    }, { status: 500 });
  }
}
