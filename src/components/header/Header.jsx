'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  PowerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { logout, getCurrentUser } from '@/utils/auth';
import './Header.css';

export default function Header() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const userEmail = getCurrentUser() || 'admin@qbits.energy';
  const profileRef = useRef(null);

  useEffect(() => {
    const handlePageChange = (e) => {
      setPageTitle(e.detail.title || 'Dashboard');
    };

    window.addEventListener('pageChange', handlePageChange);
    return () => window.removeEventListener('pageChange', handlePageChange);    
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    router.push('/login');
  };

  return (
    <header className="pc-header">
      <div className="header-wrapper">

        {/* Mobile Menu Block */}
        <div className="me-auto pc-mob-drp">
          <ul className="list-unstyled">
            <li className="pc-h-item pc-sidebar-collapse">
              <a
                href="#"
                className="pc-head-link ms-0"
                id="sidebar-hide"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('toggleMobileSidebar', { detail: { open: true } }));
                }}
              >      
                <Bars3Icon style={{width: '25px', height: '25px'}} />
              </a>
            </li>
          </ul>
        </div>

        <div className="ms-auto">
            <ul className="list-unstyled">
              {/* Register Button */}
              <li className="pc-h-item">
                <Link href="/register" className="pc-head-link header-register-btn">
                  Register
                </Link>
              </li>
              
              
              {/* User Profile */}
              <li className="dropdown pc-h-item header-user-profile" ref={profileRef}>
                <a 
                  className="pc-head-link dropdown-toggle arrow-none me-0" 
                  href="#" 
                  role="button"
                  onClick={(e) => { e.preventDefault(); setShowProfile(!showProfile); }}
                >
                  <div className="user-avtar">
                    AU
                  </div>
                  <span className="ms-2">
                    <span className="user-name">Super Admin</span>
                    <span className="user-desc">System Administrator</span>
                  </span>
                </a>
                {showProfile && (
                  <div className="dropdown-menu dropdown-user-profile dropdown-menu-end pc-h-dropdown show">
                    <div className="dropdown-body-profile">
                      <div className="profile-user-info">
                        <div className="profile-avatar-container">
                          <div className="profile-avatar">
                            <UserCircleIcon style={{width: '20px', height: '20px'}} />
                          </div>
                        </div>
                        <div className="profile-user-details">
                          <h5 className="profile-user-name">Super Admin</h5>
                          <a className="profile-user-email" href={`mailto:${userEmail}`}>{userEmail}</a>
                        </div>
                      </div>
                      <div className="profile-actions">
                        <a href="#" className="profile-action-item" onClick={handleLogout}>
                          <PowerIcon className="profile-action-icon" style={{width: '20px', height: '20px'}} />
                          <span>Logout</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      </header>
  );
}
