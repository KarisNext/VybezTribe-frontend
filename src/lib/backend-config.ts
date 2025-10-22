
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
 * 2. Header Builders
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

// Removed `buildBackendHeaders` alias as it was misleading and is replaced by `getStandardHeaders` and `buildHeadersFromRequest`

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
 * Returns standard fetch options with common defaults.
 * @param headers Headers to use for the request.
 */
const BASE_FETCH_OPTIONS: RequestInit = {
  credentials: 'include',    // 🔒 Important for session cookies
  cache: 'no-store',         // 🚫 Prevent stale data for dynamic/authenticated data
};

/**
 * Returns standard fetch options with cookie inclusion and no caching.
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
 * NOTE: This assumes the headers are passed in explicitly or generated elsewhere.
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
    getStandardHeaders(options.headers as Record<string, string>) // Ensure custom headers are merged
  );

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: defaultOptions.headers // Ensure merged headers take precedence
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
