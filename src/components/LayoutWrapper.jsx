'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/header/Header';
import Sidebar from '@/components/sidebar/Sidebar';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/register' || pathname === '/login' || pathname === '/auth/login' || pathname === '/auth/register';

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />
      <div className="main-content-wrapper">
        <Header />
        <div className="pc-content">
          {children}
        </div>
      </div>
    </div>
  );
}
