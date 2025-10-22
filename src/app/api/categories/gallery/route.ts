import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // 1. Construct the full backend endpoint
    const endpoint = `${backendUrl}/api/client/gallery?${queryString}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      // 2. Use the central utility to build headers, including cookies
      headers: buildHeadersFromRequest(request),
      credentials: 'include'
    });

    if (!response.ok) {
      // Attempt to parse error data if available
      let errorData = { success: false, message: 'Gallery unavailable' };
      try {
        errorData = await response.json();
      } catch (e) {
        // Fallback for non-JSON errors
        errorData.message = `Backend responded with status: ${response.status}`;
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    const nextResponse = NextResponse.json({
      success: true,
      gallery_news: data.gallery_news || [],
      pagination: data.pagination || {
        page: 1,
        limit: 24,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    });

    // 3. Use the central utility to forward cookies back to the client
    forwardCookies(response, nextResponse);
    
    return nextResponse;

  } catch (error) {
    console.error('Client gallery API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch gallery data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
