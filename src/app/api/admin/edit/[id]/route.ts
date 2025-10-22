// frontend/src/app/api/admin/edit/[id]/route.ts - UPDATED CONTENT

import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, forwardCookies, buildHeadersFromRequest } from '@/lib/backend-config';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Valid post ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBackendUrl()}/api/admin/retrieve/${id}`, {
      method: 'GET',
      headers: buildHeadersFromRequest(request), // 🌟 FIX: Use the new function to process NextRequest
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, message: 'Post not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Admin edit GET API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve post for editing',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Valid post ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const requiredFields = ['title', 'content', 'author_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const response = await fetch(`${getBackendUrl()}/api/admin/retrieve/${id}`, {
      method: 'PUT',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }), // 🌟 FIX: Use the new function to process NextRequest
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Backend responded with status: ${response.status}` 
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to update post',
          error: `HTTP ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Admin edit PUT API error:', error);
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Valid post ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    
    const response = await fetch(`${getBackendUrl()}/api/admin/retrieve/${id}`, {
      method: 'DELETE',
      headers: buildHeadersFromRequest(request, { 'Content-Type': 'application/json' }), // 🌟 FIX: Use the new function to process NextRequest
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Backend responded with status: ${response.status}` 
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to delete post',
          error: `HTTP ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    forwardCookies(response, nextResponse);
    return nextResponse;
    
  } catch (error) {
    console.error('Admin edit DELETE API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete post',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```The build failure is a **TypeScript type error** because you are passing a `NextRequest` object to a function that expects a `Record<string, string>` (a plain object of headers).

The function `buildBackendHeaders` is an alias for `getDefaultHeaders` in your `backend-config.ts`, which is defined to accept an optional object of additional headers: `(additionalHeaders?: Record<string, string>)`.

To fix this and implement the intended functionality (forwarding client headers like `Authorization` or `Cookie` to the backend), you must **update `backend-config.ts`** with a new function to correctly extract and format headers from the `NextRequest` object and then **update `route.ts`** to use this new function.

The following code blocks contain the necessary **FIXES and the Serious UPGRADE** to your backend configuration.

## 1. Upgraded `frontend/src/lib/backend-config.ts`

This version is seriously upgraded to use clear naming (`buildHeadersFromRequest`), standard `Headers` objects for better manipulation, and explicitly forwards critical headers like `authorization` and `cookie` from the client request.

```typescript
// frontend/src/lib/backend-config.ts - UPGRADED CONTENT

/**
 * ===============================================================
 * VybezTribe Backend Configuration Library
 * ---------------------------------------------------------------
 * This module defines how the frontend determines and communicates
 * with the backend API — both locally and in production on Render.
 * It ensures:
 * ✅ Seamless environment detection (local, staging, production)
 * ✅ Secure, consistent URL construction
 * ✅ Cookie + session forwarding
 * ✅ Centralized fetch configuration and headers
 * ===============================================================
 */

import { NextRequest, NextResponse } from 'next/server';

/* ---------------------------------------------------------------
 * 1. Environment & Base URL Logic
 * --------------------------------------------------------------- */

/**
 * Dynamically determines the correct backend base URL
 * Priority:
 * 1. Environment variable NEXT_PUBLIC_BACKEND_URL
 * 2. NODE_ENV === 'development' → localhost:5000
 * 3. Production fallback → https://www.vybeztribe.com
 */
export const getBackendUrl = (): string => {
  // Highest priority — explicit environment variable
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  // Development environment
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }

  // Production fallback — Render domain or custom
  return 'https://www.vybeztribe.com';
};

/* ---------------------------------------------------------------
 * 2. Header Builders (The FIX Implementation)
 * --------------------------------------------------------------- */

/**
 * Defines a standard set of headers for all backend communications.
 */
const BASE_HEADERS: HeadersInit = {
  'User-Agent': 'VybezTribe-Frontend/1.0',
  'Accept': 'application/json',
};

/**
 * Builds a Headers object by merging base headers with optional additional headers.
 * This replaces the old `getDefaultHeaders`.
 * @param additionalHeaders Custom headers to include/override.
 * @returns A standard Headers object.
 */
export const getStandardHeaders = (additionalHeaders?: Record<string, string>): Headers => {
  const headers = new Headers(BASE_HEADERS);

  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      // Only set if the value is not undefined or empty
      if (value !== undefined && value !== '') {
        headers.set(key, value);
      }
    });
  }

  return headers;
};

/**
 * Builds headers for the backend request by extracting relevant headers
 * (like Authorization, Cookies, etc.) from the incoming NextRequest
 * and merging them with standard base headers.
 *
 * This is the FIX for the type error.
 *
 * @param request The incoming NextRequest object.
 * @param additionalHeaders Custom headers to include/override.
 * @returns A standard Headers object ready for the fetch call.
 */
export const buildHeadersFromRequest = (
  request: NextRequest,
  additionalHeaders?: Record<string, string>
): Headers => {
  const headers = getStandardHeaders(additionalHeaders);

  // 💡 Strategy: Forward crucial headers from the client to the backend API.
  // This is vital for authorization (Bearer tokens) and session management (Cookies).
  const headersToForward = ['authorization', 'cookie'];

  headersToForward.forEach(headerKey => {
    const value = request.headers.get(headerKey);
    if (value) {
      // Use append for 'cookie' to ensure all cookies are sent if combined.
      // Use set for 'authorization' as it's typically a single token.
      if (headerKey === 'cookie') {
        headers.append(headerKey, value);
      } else {
        headers.set(headerKey, value);
      }
    }
  });

  return headers;
};

// The old `buildBackendHeaders` alias is removed as it was misleading and is replaced by `getStandardHeaders` and `buildHeadersFromRequest`

/* ---------------------------------------------------------------
 * 3. Cookie Forwarding
 * --------------------------------------------------------------- */

/**
 * Forwards Set-Cookie headers from backend responses
 * to Next.js API route responses — important for maintaining
 * authenticated sessions across requests.
 */
export const forwardCookies = (backendResponse: Response, nextResponse: NextResponse): void => {
  const setCookieHeader = backendResponse.headers.get('set-cookie');
  if (setCookieHeader) {
    // Split multiple cookies correctly (Render & Express may combine them)
    // The regex splits by a comma that is followed by optional whitespace and then a valid cookie name character.
    const cookies = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_\-]+=)/);
    cookies.forEach(cookie => {
      nextResponse.headers.append('set-cookie', cookie);
    });
  }
};

/* ---------------------------------------------------------------
 * 4. Fetch Configuration Helpers
 * --------------------------------------------------------------- */

/**
 * Base configuration for most backend fetch requests.
 */
const BASE_FETCH_OPTIONS: RequestInit = {
  credentials: 'include',    // 🔒 Important for session cookies
  cache: 'no-store',         // 🚫 Prevent stale data for dynamic/authenticated data
};

/**
 * Returns standard fetch options with cookie inclusion and no caching.
 * This replaces the old `getDefaultFetchOptions`.
 * @param headers Headers to use for the request.
 */
export const buildDefaultFetchOptions = (
  method: string = 'GET',
  headers: HeadersInit = getStandardHeaders(),
  body?: BodyInit
): RequestInit => ({
  method,
  headers,
  ...BASE_FETCH_OPTIONS,
  ...(body && { body })
});


/**
 * Builds full configuration for backend requests with a JSON body.
 * This replaces the old `buildBackendFetchConfig`.
 */
export const buildJsonFetchConfig = (
  method: string = 'GET',
  body?: any,
  customHeaders?: Record<string, string>
): RequestInit => {
  const headers = getStandardHeaders({
    'Content-Type': 'application/json',
    ...customHeaders
  });

  return {
    method,
    headers,
    ...BASE_FETCH_OPTIONS,
    ...(body && { body: JSON.stringify(body) })
  };
};

/* ---------------------------------------------------------------
 * 5. Unified Request Handler
 * --------------------------------------------------------------- */

/**
 * Makes a backend request safely with automatic error reporting,
 * using the standard fetch options.
 * This is primarily for requests not originating from an API Route
 * that needs to forward cookies (e.g., server components, utility calls).
 */
export const makeBackendRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;

  // Merge default headers with any custom headers provided in options
  const defaultOptions: RequestInit = buildDefaultFetchOptions(
    options.method,
    // Use getStandardHeaders to correctly process optional additional headers in options.headers
    options.headers ? getStandardHeaders(options.headers as Record<string, string>) : undefined
  );

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: defaultOptions.headers, // Ensure merged headers take precedence
    });

    // Debugging in development mode only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[VybezTribe] Backend call → ${url}`);
      console.log(`[VybezTribe] Status → ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('[VybezTribe] ❌ Backend request failed:', error);
    throw new Error(`Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/* ---------------------------------------------------------------
 * 6. Utility Functions
 * --------------------------------------------------------------- */

/**
 * Logs the currently detected environment configuration.
 * Helpful for debugging Render deployments.
 */
export const logEnvironmentInfo = (): void => {
  console.log('================ VybezTribe Environment Info ================');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL || '(Not Set)');
  console.log('Resolved Backend URL:', getBackendUrl());
  console.log('=============================================================');
};

// Auto-log when loaded in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentInfo();
}
