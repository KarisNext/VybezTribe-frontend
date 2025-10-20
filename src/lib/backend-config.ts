// frontend/src/lib/backend-config.ts

export const getBackendUrl = (): string => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  return process.env.BACKEND_URL || 'https://vybeztribe-backend.onrender.com';
};

export const forwardCookies = (response: Response) => {
  const cookies: string[] = [];
  const backendCookies = response.headers.raw?.()['set-cookie'] || [];
  
  backendCookies.forEach((cookie) => {
    let modifiedCookie = cookie;
    
    if (process.env.NODE_ENV === 'production') {
      if (!cookie.includes('SameSite=')) {
        modifiedCookie = `${cookie}; SameSite=None; Secure`;
      } else if (cookie.includes('SameSite=Lax') || cookie.includes('SameSite=Strict')) {
        modifiedCookie = cookie.replace(/SameSite=(Lax|Strict)/i, 'SameSite=None; Secure');
      }
    }
    
    cookies.push(modifiedCookie);
  });
  
  return cookies;
};

export const buildBackendHeaders = (request: Request): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cookie': request.headers.get('Cookie') || '',
    'User-Agent': 'VybezTribe-Admin/1.0',
  };
  
  const csrfToken = request.headers.get('X-CSRF-Token');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  const origin = request.headers.get('origin');
  if (origin) {
    headers['Origin'] = origin;
  }
  
  return headers;
};
