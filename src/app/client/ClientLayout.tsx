// src/app/ClientLayout.tsx
'use client';

import React from 'react';
import { ClientSessionProvider } from '../../components/client/hooks/ClientSessions';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="client-application">
      <ClientSessionProvider>
        <div className="client-container">
          <main className="client-main-content">
            {children}
          </main>
        </div>
      </ClientSessionProvider>
    </div>
  );
}