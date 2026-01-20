'use client';

import { useEffect, useMemo, useState } from 'react';
import './FaultInfo.css';

const STATUS_TABS = [
  { key: 'all', label: 'All', statusParam: -1 },
  { key: 'going', label: 'Going', statusParam: 0 },
  { key: 'recovered', label: 'Recovered', statusParam: 1 }
];

const FALLBACK_TOTAL_PAGES = 33; // allow navigation when API doesn't return pagination info

const buildPageList = (total, current) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const candidatePages = new Set([
    1,
    total,
    current - 1,
    current,
    current + 1,
    current - 2,
    current + 2
  ].filter((p) => p >= 1 && p <= total));

  const sortedPages = Array.from(candidatePages).sort((a, b) => a - b);
  const pageList = [];

  for (let i = 0; i < sortedPages.length; i += 1) {
    const page = sortedPages[i];
    const prevPage = sortedPages[i - 1];
    if (i > 0 && page - prevPage > 1) {
      pageList.push('ellipsis');
    }
    pageList.push(page);
  }

  return pageList;
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
    return [...faults].sort((a, b) => safeDate(b?.stime) - safeDate(a?.stime));
  }, [faults]);

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

        const perPage = paginationMeta?.per_page ?? paginationMeta?.perPage ?? paginationMeta?.page_size;
        const totalCount = paginationMeta?.total ?? paginationMeta?.total_count ?? paginationMeta?.count;

        const derivedLastPage = perPage && totalCount ? Math.ceil(Number(totalCount) / Number(perPage)) : undefined;

        const lastPage = [lastPageRaw, derivedLastPage, FALLBACK_TOTAL_PAGES]
          .map((v) => Number(v))
          .find((v) => Number.isFinite(v) && v > 0) || 1;

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
                  {sortedFaults.map((fault) => {
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

              {totalPages > 1 || sortedFaults.length > 0 ? (
                <div className="fault-pagination-container">
                  <button
                    className="fault-pagination-arrow"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  {buildPageList(totalPages, currentPage).map((page, idx) =>
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
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
