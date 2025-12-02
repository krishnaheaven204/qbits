'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handlePageChange = (e) => {
      setPageTitle(e.detail.title || 'Dashboard');
    };

    window.addEventListener('pageChange', handlePageChange);
    return () => window.removeEventListener('pageChange', handlePageChange);    
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
              <a href="#" className="pc-head-link ms-0" id="sidebar-hide">      
                <Bars3Icon className="h-5 w-5" />
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
              
              {/* Search */}
              <li className="dropdown pc-h-item">
                <a 
                  className="pc-head-link dropdown-toggle arrow-none m-0" 
                  href="#" 
                  role="button"
                  onClick={(e) => { e.preventDefault(); setShowSearch(!showSearch); }}
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </a>
                {showSearch && (
                  <div className="dropdown-menu dropdown-menu-end pc-h-dropdown drp-search show">
                    <form className="px-1" onSubmit={(e) => e.preventDefault()}>
                      <div className="mb-0 d-flex align-items-center">
                        <input 
                          type="search" 
                          className="form-control border-0 shadow-none" 
                          placeholder="Search stations..." 
                          id="qbits-search" 
                        />
                        <button className="btn btn-light-secondary btn-search" type="submit">Search</button>
                      </div>
                    </form>
                  </div>
                )}
              </li>
              
              {/* Notifications */}
              <li className="dropdown pc-h-item">
                <a 
                  className="pc-head-link dropdown-toggle arrow-none me-0" 
                  href="#" 
                  role="button"
                  onClick={(e) => { e.preventDefault(); setShowNotifications(!showNotifications); }}
                >
                  <BellIcon className="h-5 w-5" />
                  <span className="badge bg-danger pc-h-badge">3</span>
                </a>
                {showNotifications && (
                  <div className="dropdown-menu dropdown-notification dropdown-menu-end pc-h-dropdown show">
                    <div className="dropdown-header d-flex align-items-center justify-content-between">
                      <h5 className="m-0">Notifications</h5>
                      <div className="ms-auto">
                        <button className="btn btn-sm btn-link-secondary" onClick={() => setShowNotifications(false)}>Read all</button>
                      </div>
                    </div>
                    <div className="dropdown-body text-wrap header-notification-scroll position-relative" style={{maxHeight: 'calc(100vh - 185px)'}}>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item unread">
                          <p className="text-span text-muted mb-2">Today</p>
                          <div className="d-flex align-items-start">
                            <div className="flex-shrink-0 position-relative">
                              <div className="avtar avtar-s bg-light-warning">
                                <ExclamationTriangleIcon className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <h6 className="mb-0">Station Alert</h6>
                                <span className="text-sm text-muted">2 min ago</span>
                              </div>
                              <p className="text-muted small mb-2">Solar Station Alpha has a fault</p>
                              <p className="text-muted small mb-2">Inverter temperature exceeded threshold. Please check immediately.</p>
                              <span className="badge bg-danger text-white rounded-pill">Critical</span>
                            </div>
                          </div>
                        </li>
                        <li className="list-group-item">
                          <div className="d-flex align-items-start">
                            <div className="flex-shrink-0 position-relative">
                              <div className="avtar avtar-s bg-light-success">
                                <CheckCircleIcon className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <h6 className="mb-0">Production Update</h6>
                                <span className="text-sm text-muted">1 hour ago</span>
                              </div>
                              <p className="text-muted small mb-0">Daily production target achieved: 16.2 kWh</p>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </li>
              
              {/* User Profile */}
              <li className="dropdown pc-h-item header-user-profile">
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
                            <UserCircleIcon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="profile-user-details">
                          <h5 className="profile-user-name">Super Admin</h5>
                          <a className="profile-user-email" href={`mailto:${userEmail}`}>{userEmail}</a>
                        </div>
                      </div>
                      <div className="profile-actions">
                        <a href="#" className="profile-action-item" onClick={() => setShowProfile(false)}>
                          <UserCircleIcon className="profile-action-icon" />
                          <span>Edit profile</span>
                        </a>
                        <a href="#" className="profile-action-item" onClick={() => setShowProfile(false)}>
                          <Cog6ToothIcon className="profile-action-icon" />
                          <span>Settings</span>
                        </a>
                        <a href="#" className="profile-action-item" onClick={handleLogout}>
                          <PowerIcon className="profile-action-icon" />
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
