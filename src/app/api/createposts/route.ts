// File: frontend/src/app/api/createposts/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://vybeztribe.com' 
  : 'http://localhost:5000';

// Helper function to process content formatting on the frontend side
const processContentForDisplay = (content: string) => {
  if (!content) return content;
  
  // This is a simple client-side processing for validation
  // The main processing happens on the backend
  return content
    .replace(/\[QUOTE\](.*?)\[\/QUOTE\]/gs, '<blockquote class="news-large-quote">$1</blockquote>')
    .replace(/\[HIGHLIGHT\](.*?)\[\/HIGHLIGHT\]/gs, '<span class="news-highlight">$1</span>');
};

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Log the content for debugging (optional)
    const content = formData.get('content') as string;
    if (content && (content.includes('[QUOTE]') || content.includes('[HIGHLIGHT]'))) {
      console.log('Processing content with formatting tags');
    }
    
    // Forward the request to backend news creation endpoint
    const response = await fetch(`${API_BASE_URL}/api/news`, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
      },
      credentials: 'include',
      body: formData // FormData handles multipart/form-data automatically
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend POST responded with status: ${response.status}, body: ${errorText}`);
      
      // Try to parse as JSON for better error messages
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { success: false, message: 'Failed to create post' };
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    // Add success message for formatting features
    if (data.success && content && (content.includes('[QUOTE]') || content.includes('[HIGHLIGHT]'))) {
      data.message = `${data.message} - Special formatting applied successfully!`;
    }
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
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
    
    // Forward the request to backend news endpoint for getting news data
    const response = await fetch(`${API_BASE_URL}/api/news?${queryString}`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend GET responded with status: ${response.status}, body: ${errorText}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Process any content that comes back for display
    if (data.news && Array.isArray(data.news)) {
      data.news = data.news.map((newsItem: any) => ({
        ...newsItem,
        processed_content: newsItem.processed_content || processContentForDisplay(newsItem.content)
      }));
    } else if (data.news && data.news.content) {
      data.news.processed_content = data.news.processed_content || processContentForDisplay(data.news.content);
    }
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
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
    // Get the form data from the request
    const formData = await request.formData();
    const newsId = formData.get('news_id');
    
    if (!newsId) {
      return NextResponse.json(
        { success: false, message: 'News ID is required for updates' },
        { status: 400 }
      );
    }
    
    // Forward the request to backend news update endpoint
    const response = await fetch(`${API_BASE_URL}/api/news/${newsId}`, {
      method: 'PUT',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
      },
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
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
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