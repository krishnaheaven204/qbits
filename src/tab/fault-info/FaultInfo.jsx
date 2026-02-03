'use client';

import { useEffect, useMemo, useState } from 'react';
import './FaultInfo.css';

const STATUS_TABS = [
  { key: 'all', label: 'All', statusParam: -1 },
  { key: 'going', label: 'Going', statusParam: 0 },
  { key: 'recovered', label: 'Recovered', statusParam: 1 }
];

const buildPageList = (total, current) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // Always show first three when near the start
  if (current <= 3) {
    return [1, 2, 3, 'ellipsis', total];
  }

  // Always show last three when near the end
  if (current >= total - 2) {
    return [1, 'ellipsis', total - 2, total - 1, total];
  }

  // Middle range: show current flanked by neighbors, plus first/last with ellipses
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
};

const getStatusMeta = (status) => {
  if (status === 1) return { label: 'Recovered', className: 'badge-recovered' };
  if (status === 2) return { label: 'Unknown', className: 'badge-unknown' };
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
  const [totalPages, setTotalPages] = useState(1);

  const sortedFaults = useMemo(() => {
    const safeDate = (value) => parseDate(value)?.getTime() || 0;
    const sortKey = (fault) => safeDate(fault?.stime);
    // Newest start time first
    return [...faults].sort((a, b) => sortKey(b) - sortKey(a));
  }, [faults]);

  const hasFaults = sortedFaults.length > 0;
  const pageList = useMemo(() => buildPageList(totalPages, currentPage), [totalPages, currentPage]);

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
        const url = `https://qbits.quickestimate.co/api/v1/faults?plant_id=&inverter_id=&status=${statusParam}&page=${currentPage}`;

        const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to load fault records');
        }

        const data = await response.json();
        const faultsContainer = data?.data?.faults ?? data?.faults ?? data?.data ?? {};
        const rows =
          (Array.isArray(faultsContainer?.data) && faultsContainer.data) ||
          (Array.isArray(faultsContainer) && faultsContainer) ||
          (Array.isArray(data?.data) && data.data) ||
          (Array.isArray(data?.faults) && data.faults) ||
          [];

        const paginationMeta =
          faultsContainer?.meta ||
          faultsContainer?.pagination ||
          faultsContainer;

        const lastPageRaw =
          paginationMeta?.last_page ??
          paginationMeta?.lastPage ??
          paginationMeta?.total_pages ??
          paginationMeta?.totalPages ??
          paginationMeta?.pages ??
          paginationMeta?.last ??
          paginationMeta?.page_count;

        const nextPageUrl = paginationMeta?.next_page_url ?? faultsContainer?.next_page_url ?? data?.next_page_url;
        const hasNext = Boolean(nextPageUrl);

        const perPage = (paginationMeta?.per_page ?? paginationMeta?.perPage ?? paginationMeta?.page_size) || rows.length || 1;
        const totalCount = paginationMeta?.total ?? paginationMeta?.total_count ?? paginationMeta?.count;

        const derivedLastPage = perPage && totalCount ? Math.ceil(Number(totalCount) / Number(perPage)) : undefined;

        let lastPage = [derivedLastPage, lastPageRaw]
          .map((v) => Number(v))
          .find((v) => Number.isFinite(v) && v > 0) || 1;

        // If API indicates more pages but doesn't provide last_page/total, allow advancing by one
        if (hasNext && lastPage <= currentPage) {
          lastPage = currentPage + 1;
        }

        // If no next page and we received a short page, clamp to current
        if (!hasNext && rows.length < perPage) {
          lastPage = Math.min(lastPage, currentPage);
        }

        setTotalPages(Math.max(1, lastPage));
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
  }, [activeTab, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

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
          ) : (
            <>
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
                    {hasFaults ? (
                      sortedFaults.map((fault) => {
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
                      })
                    ) : (
                      <tr>
                        <td className="fault-empty" colSpan={7}>No fault records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="fault-pagination-container">
                <button
                  className="fault-pagination-arrow"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>
                {pageList.map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="fault-pagination-ellipsis">…</span>
                  ) : (
                    <button
                      key={page}
                      className={`fault-pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  className="fault-pagination-arrow"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
