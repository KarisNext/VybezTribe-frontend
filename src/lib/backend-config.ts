import { NextRequest, NextResponse } from 'next/server';

// ===============================================
// 1. ENVIRONMENT CONFIGURATION
// ===============================================

export const getBackendUrl = () => {
  return process.env.NODE_ENV === 'development'
    ? process.env.BACKEND_URL || 'http://localhost:5000'
    : process.env.BACKEND_URL || 'https://api.vybeztribe.com';
};

// ===============================================
// 2. HEADER UTILITIES
// ===============================================

/**
 * Builds standard headers for a request going from the frontend to the backend.
 * It ensures the Content-Type is application/json and forwards the 'Cookie' header
 * and 'User-Agent' from the incoming NextRequest.
 */
export const buildHeadersFromRequest = (
  request: NextRequest, 
  additionalHeaders: HeadersInit = {}
): HeadersInit => {
  const incomingHeaders = request.headers;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const cookie = incomingHeaders.get('cookie');
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  
  const userAgent = incomingHeaders.get('user-agent');
  if (userAgent) {
    headers['User-Agent'] = userAgent;
  }
  
  // Merge additional headers, allowing them to override defaults or incoming headers
  const mergedHeaders = new Headers(headers);
  
  if (additionalHeaders) {
    new Headers(additionalHeaders).forEach((value, key) => {
      mergedHeaders.set(key, value);
    });
  }

  return mergedHeaders;
};

// ===============================================
// 3. COOKIE UTILITY
// ===============================================

/**
 * Forwards Set-Cookie headers from the backend response to the Next.js response.
 */
export const forwardCookies = (
  backendResponse: Response, 
  nextResponse: NextResponse
) => {
  const setCookieHeaders = backendResponse.headers.getSetCookie();
  
  if (setCookieHeaders) {
    setCookieHeaders.forEach(cookie => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });
  }
};


// ===============================================
// 4. GENERAL FETCH UTILITY (FIXED)
// ===============================================

interface FetchOptions extends RequestInit {
  timeout?: number;
}

const DEFAULT_TIMEOUT = 10000;

/**
 * Performs a fetch request with standard options, a configurable timeout,
 * and robust error handling.
 */
export async function safeFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, headers, ...rest } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // Ensure headers is always defined as HeadersInit for type safety
  const finalHeaders: HeadersInit = headers || {};

  const defaultOptions: RequestInit = {
    method: 'GET',
    cache: 'no-cache',
    credentials: 'include',
    headers: finalHeaders, // Use the guaranteed-defined headers
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...rest, // Spread rest (excluding headers, which is handled below)
      signal: controller.signal,
      headers: { // Explicitly spread and re-merge headers to resolve type issue and ensure correct merge
        ...defaultOptions.headers,
        ...finalHeaders,
      } as HeadersInit, // Cast back to HeadersInit to satisfy fetch() requirement strictly
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw error;
  }
}
