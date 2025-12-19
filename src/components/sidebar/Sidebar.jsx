'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  ChartBarIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  CpuChipIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  ArrowDownTrayIcon,
  WrenchScrewdriverIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import './Sidebar.css';

export default function Sidebar() {
  const [expandedMenus, setExpandedMenus] = useState({});
  const pathname = usePathname();

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const isActive = (path) => {
    return pathname === `/${path}` || pathname.endsWith(`/${path}`);
  };

  const isMenuActive = (paths) => {
    return paths.some(path => pathname === `/${path}` || pathname.includes(`/${path}`));
  };

  return (
    <nav className="pc-sidebar">
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
        </div>
        <div className="navbar-content">
          <ul className="pc-navbar">
            {/* Dashboard */}
            <li className="pc-item">
              <Link href="/dashboard" className={`pc-link qbits-nav-item ${isActive('dashboard') ? 'active' : ''}`}>
                <span className="pc-micon">
                  <ChartBarIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">Dashboard</span>
              </Link>
            </li>

            {/* Station List */}
            <li className="pc-item">
              <Link href="/station-list" className={`pc-link qbits-nav-item ${isActive('station-list') ? 'active' : ''}`}>
                <span className="pc-micon">
                  <ListBulletIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">Station List</span>
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

            {/* Create Station */}
            <li className="pc-item">
              <Link href="/create-station" className={`pc-link qbits-nav-item ${isActive('create-station') ? 'active' : ''}`}>
                <span className="pc-micon">
                  <PlusCircleIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">Create Station</span>
              </Link>
            </li>

            {/* Device Library */}
            <li className={`pc-item pc-hasmenu ${expandedMenus.deviceLibrary || isMenuActive(['device-library/inverters', 'device-library/sensors', 'device-library/controllers']) ? 'active' : ''}`}>
              <a
                href="#!"
                className="pc-link qbits-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMenu('deviceLibrary');
                }}
              >
                <span className="pc-micon">
                  <CpuChipIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">Device Library</span>
                <span className="pc-arrow">
                  <ChevronRightIcon style={{width: '16px', height: '16px'}} />
                </span>
              </a>
              <ul className="pc-submenu" style={{maxHeight: expandedMenus.deviceLibrary || isMenuActive(['device-library/inverters', 'device-library/sensors', 'device-library/controllers']) ? '500px' : '0'}}>
                <li className="pc-item">
                  <Link href="/device-library/inverters" className={`pc-link ${isActive('device-library/inverters') || pathname === '/device-library/inverters' ? 'active' : ''}`}>Inverters</Link>
                </li>
                <li className="pc-item">
                  <Link href="/device-library/sensors" className={`pc-link ${isActive('device-library/sensors') || pathname === '/device-library/sensors' ? 'active' : ''}`}>Sensors</Link>
                </li>
                <li className="pc-item">
                  <Link href="/device-library/controllers" className={`pc-link ${isActive('device-library/controllers') || pathname === '/device-library/controllers' ? 'active' : ''}`}>Controllers</Link>
                </li>
              </ul>
            </li>

            {/* User List */}
            <li className={`pc-item pc-hasmenu ${expandedMenus.userList || isMenuActive(['user-list/all-users', 'user-list/admins', 'user-list/operators']) ? 'active' : ''}`}>
              <a
                href="#!"
                className="pc-link qbits-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMenu('userList');
                }}
              >
                <span className="pc-micon">
                  <UserGroupIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">User List</span>
                <span className="pc-arrow">
                  <ChevronRightIcon style={{width: '16px', height: '16px'}} />
                </span>
              </a>
              <ul className="pc-submenu" style={{maxHeight: expandedMenus.userList || isMenuActive(['user-list/all-users', 'user-list/admins', 'user-list/operators']) ? '500px' : '0'}}>
                <li className="pc-item">
                  <Link href="/user-list/all-users" className={`pc-link ${isActive('user-list/all-users') || pathname === '/user-list/all-users' ? 'active' : ''}`}>All Users</Link>
                </li>
                <li className="pc-item">
                  <Link href="/user-list/admins" className={`pc-link ${isActive('user-list/admins') || pathname === '/user-list/admins' ? 'active' : ''}`}>Company</Link>
                </li>
                <li className="pc-item">
                  <Link href="/user-list/operators" className={`pc-link ${isActive('user-list/operators') || pathname === '/user-list/operators' ? 'active' : ''}`}>Operators</Link>
                </li>
              </ul>
            </li>

            {/* Data Excel */}
            <li className="pc-item">
              <Link href="/data-excel" className={`pc-link qbits-nav-item ${isActive('data-excel') ? 'active' : ''}`}>
                <span className="pc-micon">
                  <DocumentArrowDownIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">Data Excel</span>
              </Link>
            </li>

            {/* Fault Export */}
            <li className={`pc-item pc-hasmenu ${expandedMenus.faultExport || isMenuActive(['fault-export/export-all', 'fault-export/export-date', 'fault-export/export-station']) ? 'active' : ''}`}>
              <a
                href="#!"
                className="pc-link qbits-nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMenu('faultExport');
                }}
              >
                <span className="pc-micon">
                  <ArrowDownTrayIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">Fault Export</span>
                <span className="pc-arrow">
                  <ChevronRightIcon style={{width: '16px', height: '16px'}} />
                </span>
              </a>
              <ul className="pc-submenu" style={{maxHeight: expandedMenus.faultExport || isMenuActive(['fault-export/export-all', 'fault-export/export-date', 'fault-export/export-station']) ? '500px' : '0'}}>
                <li className="pc-item">
                  <Link href="/fault-export/export-all" className={`pc-link ${isActive('fault-export/export-all') || pathname === '/fault-export/export-all' ? 'active' : ''}`}>Export All</Link>
                </li>
                <li className="pc-item">
                  <Link href="/fault-export/export-date" className={`pc-link ${isActive('fault-export/export-date') || pathname === '/fault-export/export-date' ? 'active' : ''}`}>Export by Date</Link>
                </li>
                <li className="pc-item">
                  <Link href="/fault-export/export-station" className={`pc-link ${isActive('fault-export/export-station') || pathname === '/fault-export/export-station' ? 'active' : ''}`}>Export by Station</Link>
                </li>
              </ul>
            </li>

            {/* Toolbox */}
            <li className="pc-item">
              <Link href="/toolbox" className={`pc-link qbits-nav-item ${isActive('toolbox') ? 'active' : ''}`}>
                <span className="pc-micon">
                  <WrenchScrewdriverIcon style={{width: '20px', height: '20px'}} />
                </span>
                <span className="pc-mtext">Toolbox</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
