'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface Admin {
  admin_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  permissions: any[];
  last_login: string | null;
  status: string;
}

interface SessionData {
  success: boolean;
  authenticated: boolean;
  user: Admin | null;
  error: string | null;
  message: string | null;
  csrfToken?: string;
}

interface SessionContextType {
  user: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  csrfToken: string | null;
  checkSession: () => Promise<void>;
  login: (credentials: { identifier: string; password: string }) => Promise<SessionData>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const handleSessionResponse = useCallback((data: SessionData) => {
    console.log('Handling session response:', {
      success: data.success,
      authenticated: data.authenticated,
      hasUser: !!data.user,
      error: data.error
    });
    
    if (data.success && data.authenticated && data.user) {
      setUser(data.user);
      setError(null);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      console.log('Session established for user:', data.user.email, 'with role:', data.user.role);
    } else {
      setUser(null);
      setError(data.error);
      setCsrfToken(null);
      console.log('Session cleared:', data.error || 'No error');
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      console.log('Checking admin session...');
      setIsLoading(true);
      
      const response = await fetch('/api/admin/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Session check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session check data received:', {
          success: data.success,
          authenticated: data.authenticated,
          hasUser: !!data.user,
          userRole: data.user?.role
        });
        handleSessionResponse(data);
      } else {
        console.log('Session check failed with status:', response.status);
        
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { 
            success: false, 
            authenticated: false, 
            user: null, 
            error: `HTTP ${response.status}`,
            message: null 
          };
        }
        
        if (response.status === 401) {
          setUser(null);
          setError(null);
          setCsrfToken(null);
        } else {
          setError(errorData.error || 'Session check failed');
        }
        
        handleSessionResponse(errorData);
      }
    } catch (err) {
      console.error('Session check network error:', err);
      const errorData: SessionData = {
        success: false,
        authenticated: false,
        user: null,
        error: 'Network error during session check',
        message: null
      };
      handleSessionResponse(errorData);
    } finally {
      setIsLoading(false);
    }
  }, [handleSessionResponse]);

  const login = async (credentials: { identifier: string; password: string }): Promise<SessionData> => {
    try {
      console.log('Attempting admin login for:', credentials.identifier);
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          identifier: credentials.identifier.trim(),
          password: credentials.password.trim()
        })
      });
      
      console.log('Login response status:', response.status);
      
      let data: SessionData;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError);
        data = {
          success: false,
          authenticated: false,
          user: null,
          error: 'Invalid server response',
          message: null
        };
      }
      
      console.log('Login response data:', {
        success: data.success,
        authenticated: data.authenticated,
        hasUser: !!data.user,
        error: data.error,
        userRole: data.user?.role
      });
      
      handleSessionResponse(data);
      return data;
      
    } catch (err) {
      console.error('Login request error:', err);
      const errorData: SessionData = { 
        success: false, 
        authenticated: false, 
        user: null, 
        error: 'Login request failed - network error', 
        message: null 
      };
      handleSessionResponse(errorData);
      return errorData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting admin logout...');
      setIsLoading(true);
      
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Logout response status:', response.status);
      
      // Always clear local state regardless of response
      setUser(null);
      setError(null);
      setCsrfToken(null);
      
      console.log('Logout completed - local state cleared');
      
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local state on error
      setUser(null);
      setError(null);
      setCsrfToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = useCallback(async () => {
    console.log('Refreshing admin session...');
    await checkSession();
  }, [checkSession]);

  // Initial session check
  useEffect(() => {
    console.log('SessionProvider mounted, initializing session check...');
    
    const initializeSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await checkSession();
    };
    
    initializeSession();
  }, [checkSession]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('Session state changed:', {
      isAuthenticated: !!user,
      isLoading,
      hasUser: !!user,
      userRole: user?.role,
      hasError: !!error,
      hasCsrfToken: !!csrfToken
    });
  }, [user, isLoading, error, csrfToken]);

  const value: SessionContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    csrfToken,
    checkSession,
    login,
    logout,
    refreshSession
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
