// frontend/src/lib/backend-config.ts
import { NextResponse } from 'next/server';

/**
 * Central backend URL configuration
 * Update this single file when changing hosting providers
 */
export const getBackendUrl = (): string => {
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  }
  
  // Production: Update this when moving to a new VPS or hosting provider
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.vybeztribe.com';
};

/**
 * Forward cookies from backend response to Next.js response
 * This ensures session cookies and other authentication tokens are properly maintained
 */
export const forwardCookies = (backendResponse: Response, nextResponse: NextResponse): void => {
  const setCookieHeaders = backendResponse.headers.get('set-cookie');
  if (setCookieHeaders) {
    nextResponse.headers.set('set-cookie', setCookieHeaders);
  }
};

/**
 * Get default headers for backend requests
 * Includes common headers needed for authentication and tracking
 */
export const getDefaultHeaders = (additionalHeaders?: HeadersInit): HeadersInit => {
  return {
    'User-Agent': 'VybezTribe-Admin/1.0',
    'Accept': 'application/json',
    ...additionalHeaders
  };
};

/**
 * Create fetch options with credentials and common settings
 */
export const getDefaultFetchOptions = (
  method: string = 'GET',
  additionalHeaders?: HeadersInit,
  body?: BodyInit
): RequestInit => {
  return {
    method,
    headers: getDefaultHeaders(additionalHeaders),
    credentials: 'include',
    ...(body && { body })
  };
};
