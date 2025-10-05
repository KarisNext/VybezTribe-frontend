import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://api.vybeztribe.com';

const cleanSlug = (rawSlug: string): string | null => {
    if (!rawSlug) return null;
    let cleaned = rawSlug.trim().replace(/^-+|-+$/g, '');
    const pathParts = cleaned.split('/');
    if (pathParts.length > 1) {
        cleaned = pathParts[pathParts.length - 1]!;
    }
    cleaned = cleaned.trim().replace(/^-+|-+$/g, '');
    return cleaned || null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSlug = searchParams.get('slug');
    
    if (!rawSlug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Article slug is required' 
      }, { status: 400 });
    }

    const slug = cleanSlug(rawSlug);
    
    if (!slug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid article slug' 
      }, { status: 400 });
    }

    const backendUrl = `${BACKEND_URL}/api/articles/${encodeURIComponent(slug)}`;
    
    const headers = new Headers({
        'Content-Type': 'application/json',
    });
    if (request.headers.has('authorization')) {
        headers.set('Authorization', request.headers.get('authorization')!);
    }
    if (request.headers.has('cookie')) {
        headers.set('Cookie', request.headers.get('cookie')!);
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
    return NextResponse.json(data);

  } catch (error) {
    console.error('Article route error:', error);
    
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
    const { action, slug: rawSlug, ...otherData } = body;
    
    const slug = cleanSlug(rawSlug);

    if (!action || !slug) {
      return NextResponse.json({
        success: false,
        message: 'Action and a valid slug are required'
      }, { status: 400 });
    }

    let endpoint = '';
    
    switch (action) {
      case 'view':
        endpoint = `${BACKEND_URL}/api/articles/${encodeURIComponent(slug)}/view`;
        break;
      case 'like':
        endpoint = `${BACKEND_URL}/api/articles/${encodeURIComponent(slug)}/like`;
        break;
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(otherData)
    });

    try {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json({
            success: false,
            message: `Backend action failed with status ${response.status}`,
            error: response.statusText
        }, { status: response.status });
    }

  } catch (error) {
    console.error('Article POST error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Action failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}