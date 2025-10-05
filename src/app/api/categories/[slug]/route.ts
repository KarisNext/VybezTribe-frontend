import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://api.vybeztribe.com';
};

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const backendUrl = getBackendUrl();
    const { searchParams } = new URL(request.url);
    const slug = params.slug;
    
    const queryString = searchParams.toString();
    const requestCookies = request.headers.get('cookie') || '';

    const response = await fetch(`${backendUrl}/api/client/category/${slug}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': requestCookies,
        'User-Agent': request.headers.get('user-agent') || 'Unknown'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: 'Category not found or unavailable'
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Client category fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}