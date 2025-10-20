// frontend/src/app/api/article/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Article slug is required' 
      }, { status: 400 });
    }

    slug = slug.trim().replace(/^-+|-+$/g, '');
    
    if (!slug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid article slug' 
      }, { status: 400 });
    }

    const backendUrl = `${getBackendUrl()}/api/client/article?slug=${encodeURIComponent(slug)}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
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
    const nextResponse = NextResponse.json({
      success: true,
      article: data.article,
      related_articles: data.related_articles || [],
      comments: data.comments || []
    });
