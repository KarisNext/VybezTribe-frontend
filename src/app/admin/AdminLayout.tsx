'use client';

import React from 'react';
import { SessionProvider } from '../../components/includes/Session';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-application">
      <SessionProvider>
        <div className="admin-container">
          <main className="admin-main-content">
            {children}
          </main>
        </div>
      </SessionProvider>
    </div>
  );
}