// File: frontend/src/app/api/admin/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

// POST - Handle bulk actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, post_ids, admin_id } = body;

    // Validate required fields
    if (!action || !post_ids || !Array.isArray(post_ids) || post_ids.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Action and post IDs are required' 
        },
        { status: 400 }
      );
    }

    if (!admin_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Admin authentication required' 
        },
        { status: 401 }
      );
    }

    // Validate action type
    const validActions = ['publish', 'draft', 'archive', 'delete', 'feature', 'unfeature'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid action specified' 
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '',
        'X-Real-IP': request.headers.get('X-Real-IP') || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        action,
        post_ids,
        admin_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Backend responded with status: ${response.status}` 
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Bulk action failed',
          error: `HTTP ${response.status}`
        },
        { status: response.status }
      );
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
    console.error('Admin bulk action API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to perform bulk action',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Export data functionality
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    
    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid format. Use csv or json' 
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/actions/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
        'User-Agent': 'VybezTribe-Admin/1.0',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    // Handle different content types
    const contentType = response.headers.get('content-type');
    
    if (format === 'csv' && contentType?.includes('text/csv')) {
      const csvContent = await response.text();
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="posts_export.csv"',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } else if (format === 'json' && contentType?.includes('application/json')) {
      const jsonContent = await response.json();
      return NextResponse.json(jsonContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="posts_export.json"',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } else {
      // Fallback for unexpected content types
      const data = await response.json();
      return NextResponse.json(data);
    }
    
  } catch (error) {
    console.error('Admin export API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to export data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
