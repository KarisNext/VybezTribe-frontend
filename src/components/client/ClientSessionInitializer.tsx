// frontend/src/components/client/ClientSessionInitializer.tsx
'use client';

import { useClientSession } from './hooks/ClientSessions';

export function ClientSessionInitializer() {
  const { isLoading, isAuthenticated, clientId, error } = useClientSession();
  
  // This component doesn't render anything, it just initializes the session
  // You can add debug info here during development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ display: 'none' }} data-debug-session>
        Loading: {isLoading ? 'true' : 'false'} | 
        Auth: {isAuthenticated ? 'true' : 'false'} | 
        Client: {clientId || 'none'} | 
        Error: {error || 'none'}
      </div>
    );
  }
  
  return null;
}
