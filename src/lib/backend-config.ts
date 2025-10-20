// frontend/src/lib/backend-config.ts
import { NextResponse } from 'next/server';

/**
 * Central backend URL configuration
 * Handles both local development and Render deployments
 */
export const getBackendUrl = (): string => {
  // Always use environment variable first
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  // Render production - this will be set via Render environment variables
  // Typically looks like: https://your-backend-service-name.onrender.com
  // Render automatically provides this when you link services
  return 'https://vybeztribe-backend.onrender.com'; // Replace with your actual Render backend service name
};

/**
 * Forward cookies from backend response to Next.js response
 * This ensures session cookies and other authentication tokens are properly maintained
 */
export const forwardCookies = (backendResponse: Response, nextResponse: NextResponse): void => {
  const setCookieHeaders = backendResponse.headers.get('set-cookie');
  if (setCookieHeaders) {
    // Handle multiple set-cookie headers
    const cookies = setCookieHeaders.split(', ');
    cookies.forEach(cookie => {
      nextResponse.headers.append('set-cookie', cookie);
    });
  }
};

/**
 * Get default headers for backend requests
 * Includes common headers needed for authentication and tracking
 */
export const getDefaultHeaders = (additionalHeaders?: Record<string, string>): HeadersInit => {
  const baseHeaders: Record<string, string> = {
    'User-Agent': 'VybezTribe-Frontend/1.0',
    'Accept': 'application/json',
    ...additionalHeaders
  };

  // Remove any undefined headers
  Object.keys(baseHeaders).forEach(key => {
    if (baseHeaders[key] === undefined) {
      delete baseHeaders[key];
    }
  });

  return baseHeaders;
};

/**
 * Build headers for backend requests (alias for getDefaultHeaders for backward compatibility)
 */
export const buildBackendHeaders = (additionalHeaders?: Record<string, string>): HeadersInit => {
  return getDefaultHeaders(additionalHeaders);
};

/**
 * Create fetch options with credentials and common settings
 */
export const getDefaultFetchOptions = (
  method: string = 'GET',
  additionalHeaders?: Record<string, string>,
  body?: BodyInit
): RequestInit => {
  return {
    method,
    headers: getDefaultHeaders(additionalHeaders),
    credentials: 'include', // Important for cookies/sessions
    cache: 'no-store', // Important for dynamic data in server components
    ...(body && { body })
  };
};

/**
 * Build complete fetch configuration for backend requests with JSON body
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
    ...(body && { 
      body: JSON.stringify(body) 
    })
  };
};

/**
 * Helper to make backend API calls with proper error handling
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
    
    return response;
  } catch (error) {
    console.error('Backend request failed:', error);
    throw new Error(`Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
