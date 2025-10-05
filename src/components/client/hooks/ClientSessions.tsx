// frontend/src/app/components/ClientSessions.tsx
'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface ClientSessionData {
  success: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  user: null;
  client_id: string | null;
  csrf_token: string | null;
  message: string | null;
}

interface ClientSessionContextType {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  clientId: string | null;
  csrfToken: string | null;
  error: string | null;
  checkSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  sessionToken: string | null;
}

const ClientSessionContext = createContext<ClientSessionContextType | undefined>(undefined);

export const useClientSession = () => {
  const context = useContext(ClientSessionContext);
  if (!context) {
    return {
      isAuthenticated: false,
      isAnonymous: true,
      isLoading: false,
      clientId: null,
      csrfToken: null,
      error: null,
      sessionToken: null,
      checkSession: async () => {},
      refreshSession: async () => {}
    };
  }
  return context;
};

export const ClientSessionProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleSessionResponse = useCallback((data: ClientSessionData) => {
    console.log('Client session response:', {
      success: data.success,
      isAuthenticated: data.isAuthenticated,
      hasClientId: !!data.client_id
    });

    if (data.success) {
      setClientId(data.client_id);
      setCsrfToken(data.csrf_token);
      setIsAuthenticated(data.isAuthenticated);
      setIsAnonymous(data.isAnonymous);
      setError(null);
    } else {
      setClientId(data.client_id);
      setCsrfToken(data.csrf_token);
      setIsAuthenticated(false);
      setIsAnonymous(true);
      setError(data.message);
    }
  }, []);

  const createAnonymousSession = useCallback(async () => {
    try {
      console.log('Creating anonymous session...');
      const response = await fetch('/api/client/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'create_anonymous' })
      });

      if (response.ok) {
        const data = await response.json();
        handleSessionResponse(data);
        console.log('Anonymous session created:', data.client_id);
        return true;
      } else {
        console.log('Failed to create anonymous session');
        return false;
      }
    } catch (err) {
      console.error('Error creating anonymous session:', err);
      return false;
    }
  }, [handleSessionResponse]);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Checking client session...');
      
      const response = await fetch('/api/client/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        handleSessionResponse(data);
        console.log('Client session verified');
      } else if (response.status === 401) {
        console.log('No valid session found, creating anonymous session...');
        // Try to create anonymous session if none exists
        const created = await createAnonymousSession();
        if (!created) {
          setIsAuthenticated(false);
          setIsAnonymous(true);
          setClientId(null);
          setCsrfToken(null);
          setError('Failed to create session');
        }
      } else {
        console.log('Session check failed with status:', response.status);
        setIsAuthenticated(false);
        setIsAnonymous(true);
        setClientId(null);
        setCsrfToken(null);
        setError('Session check failed');
      }
    } catch (err) {
      console.error('Session check network error:', err);
      setError('Network error during session check');
      setIsAuthenticated(false);
      setIsAnonymous(true);
    } finally {
      setIsLoading(false);
    }
  }, [handleSessionResponse, createAnonymousSession]);

  const refreshSession = useCallback(async () => {
    console.log('Refreshing client session...');
    await checkSession();
  }, [checkSession]);

  // Initial session check
  useEffect(() => {
    console.log('ClientSessionProvider mounted, checking session...');
    checkSession();
  }, [checkSession]);

  // Periodic refresh every 10 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      console.log('Periodic session refresh...');
      checkSession();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkSession]);

  // Debug logging
  useEffect(() => {
    console.log('Client session state:', {
      isAuthenticated,
      isAnonymous,
      isLoading,
      hasClientId: !!clientId,
      hasError: !!error
    });
  }, [isAuthenticated, isAnonymous, isLoading, clientId, error]);

  const value: ClientSessionContextType = {
    isAuthenticated,
    isAnonymous,
    isLoading,
    clientId,
    csrfToken,
    error,
    sessionToken: csrfToken, // Use CSRF token as session token
    checkSession,
    refreshSession
  };

  return (
    <ClientSessionContext.Provider value={value}>
      {children}
    </ClientSessionContext.Provider>
  );
};