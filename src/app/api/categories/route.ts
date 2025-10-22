import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';


export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const requestCookies = request.headers.get('cookie') || '';
    
    const response = await fetch(`${backendUrl}/api/news/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'VybezTribe-App',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: 'Categories unavailable',
        categories: []
      }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Categories service error',
      categories: []
    }, { status: 503 });
  }
}
