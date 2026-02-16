'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './Sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMobileViewport = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  const isActive = (path) => {
    return pathname === `/${path}` || pathname.endsWith(`/${path}`);
  };

  useEffect(() => {
    const handleToggleSidebar = (event) => {
      const shouldOpen = event.detail?.open ?? false;
      if (isMobileViewport()) {
        setMobileOpen(!!shouldOpen);
      }
    };

    window.addEventListener('toggleMobileSidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggleMobileSidebar', handleToggleSidebar);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (!isMobileViewport()) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className={`pc-sidebar ${mobileOpen ? 'active' : ''}`}>
        <div className="navbar-wrapper">
          <div className="m-header">
            <div className="qbits-logo-container">
              <Link href="/dashboard" className="b-brand text-primary">
                <Image
                  src="/Qbits.svg"
                  alt="Qbits Energy"
                  height={80}
                  width={220}
                  className="qbits-logo"
                  priority
                />
              </Link>
            </div>
            <button
              aria-label="Close sidebar"
              className="sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
            >
              <XMarkIcon />
            </button>
          </div>
          <div className="navbar-content">
            <ul className="pc-navbar">
              <li className="pc-item">
                <Link href="/dashboard" className={`pc-link qbits-nav-item ${isActive('dashboard') ? 'active' : ''}`}>
                  <span className="pc-micon">
                    <ChartBarIcon style={{width: '20px', height: '20px'}} />
                  </span>
                  <span className="pc-mtext">Dashboard</span>
                </Link>
              </li>

              {/* Fault Info */}
              <li className="pc-item">
                <Link href="/fault-info" className={`pc-link qbits-nav-item ${isActive('fault-info') ? 'active' : ''}`}>
                  <span className="pc-micon">
                    <ExclamationTriangleIcon style={{width: '20px', height: '20px'}} />
                  </span>
                  <span className="pc-mtext">Fault Info</span>
                </Link>
              </li>

              {/* Stations */}
              <li className="pc-item">
                <Link href="/user-list/all-users" className={`pc-link qbits-nav-item ${isActive('user-list/all-users') ? 'active' : ''}`}>
                  <span className="pc-micon">
                    <ListBulletIcon style={{width: '20px', height: '20px'}} />
                  </span>
                  <span className="pc-mtext">Stations</span>
                </Link>
              </li>

              {/* Company */}
              <li className="pc-item">
                <Link href="/user-list/admins" className={`pc-link qbits-nav-item ${isActive('user-list/admins') ? 'active' : ''}`}>
                  <span className="pc-micon">
                    <UserGroupIcon style={{width: '20px', height: '20px'}} />
                  </span>
                  <span className="pc-mtext">Company</span>
                </Link>
              </li>

              {/* Inverters */}
              <li className="pc-item">
                <Link href="/user-list/operators" className={`pc-link qbits-nav-item ${isActive('user-list/operators') ? 'active' : ''}`}>
                  <span className="pc-micon">
                    <CpuChipIcon style={{width: '20px', height: '20px'}} />
                  </span>
                  <span className="pc-mtext">Inverters</span>
                </Link>
              </li>

              {/* Channel Partner */}
              <li className="pc-item">
                <Link href="/channel-partner" className={`pc-link qbits-nav-item ${isActive('channel-partner') ? 'active' : ''}`}>
                  <span className="pc-micon">
                    <UserGroupIcon style={{width: '20px', height: '20px'}} />
                  </span>
                  <span className="pc-mtext">Channel Partner</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {mobileOpen && <div className="pc-sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
