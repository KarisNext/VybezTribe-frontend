/**
 * ===============================================================
 * VybezTribe Backend Configuration Library
 * ---------------------------------------------------------------
 * This module defines how the frontend determines and communicates
 * with the backend API — both locally and in production on Render.
 * It ensures:
 *   ✅ Seamless environment detection (local, staging, production)
 *   ✅ Secure, consistent URL construction
 *   ✅ Cookie + session forwarding
 *   ✅ Centralized fetch configuration and headers
 * ===============================================================
 */

import { NextResponse } from 'next/server';

/* ---------------------------------------------------------------
 * 1. Environment & Base URL Logic
 * --------------------------------------------------------------- */

/**
 * Dynamically determines the correct backend base URL
 * Priority:
 *   1. Environment variable NEXT_PUBLIC_BACKEND_URL
 *   2. NODE_ENV === 'development' → localhost:5000
 *   3. Production fallback → https://www.vybeztribe.com
 * 
 * Example expected values:
 *   - Local:      http://localhost:5000
 *   - Render App: https://www.vybeztribe.com
 *   - Staging:    https://staging.vybeztribe.com (if used)
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
 * 2. Cookie Forwarding
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
    const cookies = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_\-]+=)/);
    cookies.forEach(cookie => {
      nextResponse.headers.append('set-cookie', cookie);
    });
  }
};

/* ---------------------------------------------------------------
 * 3. Header Builders
 * --------------------------------------------------------------- */

/**
 * Builds a clean set of headers with optional overrides.
 * Default headers include JSON acceptance and a unique User-Agent.
 */
export const getDefaultHeaders = (additionalHeaders?: Record<string, string>): HeadersInit => {
  const baseHeaders: Record<string, string> = {
    'User-Agent': 'VybezTribe-Frontend/1.0',
    'Accept': 'application/json',
    ...additionalHeaders
  };

  // Remove undefined or empty headers
  Object.keys(baseHeaders).forEach(key => {
    if (baseHeaders[key] === undefined || baseHeaders[key] === '') {
      delete baseHeaders[key];
    }
  });

  return baseHeaders;
};

/**
 * Alias for backward compatibility
 */
export const buildBackendHeaders = getDefaultHeaders;

/* ---------------------------------------------------------------
 * 4. Fetch Configuration Helpers
 * --------------------------------------------------------------- */

/**
 * Returns standard fetch options with cookie inclusion and
 * no caching (for dynamic authenticated data).
 */
export const getDefaultFetchOptions = (
  method: string = 'GET',
  additionalHeaders?: Record<string, string>,
  body?: BodyInit
): RequestInit => ({
  method,
  headers: getDefaultHeaders(additionalHeaders),
  credentials: 'include',   // 🔒 Important for session cookies
  cache: 'no-store',        // 🚫 Prevent stale data
  ...(body && { body })
});

/**
 * Builds full configuration for backend requests with a JSON body.
 */
export const buildBackendFetchConfig = (
  method: string = 'GET',
  body?: any,
  customHeaders?: Record<string, string>
): RequestInit => {
  const headers = buildBackendHeaders({
    'Content-Type': 'application/json',
    ...customHeaders
  });

  return {
    method,
    headers,
    credentials: 'include',
    cache: 'no-store',
    ...(body && { body: JSON.stringify(body) })
  };
};

/* ---------------------------------------------------------------
 * 5. Unified Request Handler
 * --------------------------------------------------------------- */

/**
 * Makes a backend request safely with automatic error reporting.
 * This standardizes error logging and ensures every request is
 * routed to the correct environment’s backend.
 */
export const makeBackendRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...getDefaultFetchOptions(),
      ...options
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

