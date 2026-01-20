'use client';

import { useEffect, useMemo, useState } from 'react';
import './FaultInfo.css';

const STATUS_TABS = [
  { key: 'all', label: 'All', statusParam: -1 },
  { key: 'going', label: 'Going', statusParam: 0 },
  { key: 'recovered', label: 'Recovered', statusParam: 1 }
];

const getStatusMeta = (status) => {
  if (status === 1) return { label: 'Recovered', className: 'badge-recovered' };
  if (status === 2) return { label: 'Fault', className: 'badge-fault' };
  if (status === 0) return { label: 'Going', className: 'badge-unknown' };
  return { label: 'Unknown', className: 'badge-unknown' };
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = parseDate(value);
  if (!date) return 'N/A';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(',', '');
};

export default function FaultInfo() {
  const [activeTab, setActiveTab] = useState('all');
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const sortedFaults = useMemo(() => {
    const safeDate = (value) => parseDate(value)?.getTime() || 0;
    return [...faults].sort((a, b) => safeDate(b?.stime) - safeDate(a?.stime));
  }, [faults]);

  const paginatedFaults = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedFaults.slice(start, start + rowsPerPage);
  }, [sortedFaults, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedFaults.length / rowsPerPage));

  useEffect(() => {
    const controller = new AbortController();
    const fetchFaults = async () => {
      try {
        setLoading(true);
        setError('');

        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const statusParam = STATUS_TABS.find((t) => t.key === activeTab)?.statusParam ?? -1;
        const url = `https://qbits.quickestimate.co/api/v1/faults?plant_id=&inverter_id=&status=${statusParam}`;

        const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to load fault records');
        }

        const data = await response.json();
        const rows =
          data?.data?.faults?.data ||
          data?.data?.faults ||
          data?.data ||
          data?.faults ||
          [];

        setFaults(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setFaults([]);
        setError(err.message || 'Something went wrong while fetching faults.');
      } finally {
        setLoading(false);
      }
    };

    fetchFaults();
    return () => controller.abort();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortedFaults.length]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="fault-info-page">
      <div className="fault-card">
        <div className="fault-card-header">
          <h5 className="fault-title">Fault Info</h5>
          <div className="fault-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`fault-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="fault-card-body">
          {loading ? (
            <div className="fault-empty">Loading faults...</div>
          ) : error ? (
            <div className="fault-empty error-text">{error}</div>
          ) : sortedFaults.length === 0 ? (
            <div className="fault-empty">No fault records found</div>
          ) : (
            <div className="fault-table-wrapper">
              <table className="fault-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Station Name</th>
                    <th>Device</th>
                    <th>Serial</th>
                    <th>Fault Info</th>
                    <th>Start</th>
                    <th>End</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFaults.map((fault) => {
                    const statusMeta = getStatusMeta(fault?.status);
                    const faultMessage = Array.isArray(fault?.message_en)
                      ? fault.message_en.join(', ')
                      : fault?.message_en || fault?.fault_name || 'N/A';
                    const deviceModel =
                      fault?.model ||
                      fault?.device_model ||
                      fault?.inverter_model ||
                      fault?.inverter?.model ||
                      'N/A';

                    return (
                      <tr key={fault?.id || `${fault?.plant_name}-${fault?.stime}`}>
                        <td>
                          <span className={`status-badge ${statusMeta.className}`}>{statusMeta.label}</span>
                        </td>
                        <td>{fault?.atun || fault?.plant_name || fault?.station_name || 'N/A'}</td>
                        <td>{deviceModel}</td>
                        <td>{fault?.serial_no || fault?.sn || 'N/A'}</td>
                        <td>{faultMessage}</td>
                        <td>{formatDateTime(fault?.stime)}</td>
                        <td>{formatDateTime(fault?.etime)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="fault-pagination-container">
                  <button
                    className="fault-pagination-arrow"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`fault-pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="fault-pagination-arrow"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
