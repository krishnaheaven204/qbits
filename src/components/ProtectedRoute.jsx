'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSuperAdmin } from '@/utils/auth';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      if (isSuperAdmin()) {
        setIsAuthorized(true);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Only render children if authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

