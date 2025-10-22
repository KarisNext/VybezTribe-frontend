// frontend/src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';


// GET - Retrieve comprehensive statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30days';
    
    // Validate timeRange parameter
    const validTimeRanges = ['7days', '30days', '90days', 'all'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid time range. Use 7days, 30days, 90days, or all' 
        },
        { status: 400 }
      );
    }

    const headers: HeadersInit = {
      'Cookie': request.headers.get('Cookie') || '',
      'User-Agent': 'VybezTribe-Admin/1.0',
      'Accept': 'application/json',
    };

    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${getBackendUrl()}/api/admin/stats?timeRange=${timeRange}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('Backend stats error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      // Return fallback stats structure on error
      return NextResponse.json(
        {
          success: false,
          message: `Stats service unavailable (${response.status})`,
          stats: {
            totalPosts: 0,
            publishedPosts: 0,
            draftPosts: 0,
            archivedPosts: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            featuredPosts: 0,
            averageReadingTime: 0,
            categoriesCount: 0,
            categoriesWithCounts: [],
            monthlyStats: [],
            topPosts: [],
            recentActivity: []
          }
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Ensure the response has the expected structure
    const stats = {
      totalPosts: data.stats?.totalPosts || 0,
      publishedPosts: data.stats?.publishedPosts || 0,
      draftPosts: data.stats?.draftPosts || 0,
      archivedPosts: data.stats?.archivedPosts || 0,
      totalViews: data.stats?.totalViews || 0,
      totalLikes: data.stats?.totalLikes || 0,
      totalComments: data.stats?.totalComments || 0,
      featuredPosts: data.stats?.featuredPosts || 0,
      averageReadingTime: data.stats?.averageReadingTime || 0,
      categoriesCount: data.stats?.categoriesCount || 0,
      categoriesWithCounts: data.stats?.categoriesWithCounts || [],
      monthlyStats: data.stats?.monthlyStats || [],
      topPosts: data.stats?.topPosts || [],
      recentActivity: data.stats?.recentActivity || []
    };

    const nextResponse = NextResponse.json({
      success: true,
      stats,
      timeRange,
      lastUpdated: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Admin stats API error:', error);
    
    // Return fallback stats structure on error
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: {
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
          archivedPosts: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          featuredPosts: 0,
          averageReadingTime: 0,
          categoriesCount: 0,
          categoriesWithCounts: [],
          monthlyStats: [],
          topPosts: [],
          recentActivity: []
        }
      },
      { status: 500 }
    );
  }
}
