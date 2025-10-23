// frontend/src/components/client/hooks/ClientSessions.tsx
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
    throw new Error('useClientSession must be used within a ClientSessionProvider');
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
  const [initialCheckDone, setInitialCheckDone] = useState(false);

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
      
      const response = await fetch('/api/client/auth/anonymous', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        handleSessionResponse(data);
        console.log('Anonymous session created successfully');
        return true;
      } else {
        console.error('Failed to create anonymous session:', response.status);
        return false;
      }
    } catch (err) {
      console.error('Error creating anonymous session:', err);
      return false;
    }
  }, [handleSessionResponse]);

  const checkSession = useCallback(async (isInitialCheck: boolean = false) => {
    if (isLoading && !isInitialCheck) return;
    
    try {
      if (isInitialCheck) {
        setIsLoading(true);
      }
      setError(null);
      
      console.log('Checking client session...');
      
      const response = await fetch('/api/client/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        handleSessionResponse(data);
        console.log('Client session verified');
      } else if (response.status === 401 && isInitialCheck) {
        // No session exists, create anonymous session on initial check only
        console.log('No session found, creating anonymous session...');
        await createAnonymousSession();
      } else {
        console.log('Session check failed with status:', response.status);
        setIsAuthenticated(false);
        setIsAnonymous(true);
        setError('Session check failed');
      }
    } catch (err) {
      console.error('Session check network error:', err);
      setError('Network error during session check');
      setIsAuthenticated(false);
      setIsAnonymous(true);
      
      // Try to create anonymous session on network error during initial check
      if (isInitialCheck) {
        await createAnonymousSession();
      }
    } finally {
      if (isInitialCheck) {
        setIsLoading(false);
        setInitialCheckDone(true);
      }
    }
  }, [handleSessionResponse, isLoading, createAnonymousSession]);

  const refreshSession = useCallback(async () => {
    console.log('Refreshing client session...');
    await checkSession(false);
  }, [checkSession]);

  // Initial session check - ONLY ONCE
  useEffect(() => {
    if (!initialCheckDone) {
      console.log('Initial client session check...');
      checkSession(true);
    }
  }, [checkSession, initialCheckDone]);

  const value: ClientSessionContextType = {
    isAuthenticated,
    isAnonymous,
    isLoading,
    clientId,
    csrfToken,
    error,
    sessionToken: csrfToken,
    checkSession,
    refreshSession
  };

  return (
    <ClientSessionContext.Provider value={value}>
      {children}
    </ClientSessionContext.Provider>
  );
};
