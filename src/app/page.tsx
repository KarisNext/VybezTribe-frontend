'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is trying to access admin
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/admin') || currentPath.includes('/auth')) {
      // Don't redirect, let them access admin/auth pages
      return;
    }
    
    // Default redirect to client
    router.replace('/client');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column' 
    }}>
      <h2>VybezTribe</h2>
      <p>Loading...</p>
    </div>
  );
}