'use client';

import { useEffect, useMemo, useState } from 'react';
import './FaultInfo.css';

const STATUS_TABS = [
  { key: 'all', label: 'All', statusParam: -1 },
  { key: 'going', label: 'Going', statusParam: 0 },
  { key: 'recovered', label: 'Recovered', statusParam: 1 }
];

// Build page list with first, last, current window, and ellipsis
const buildPageList = (total, current) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const candidates = new Set(
    [1, total, current - 2, current - 1, current, current + 1, current + 2].filter(
      (p) => p >= 1 && p <= total
    )
  );

  const sorted = Array.from(candidates).sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && page - prev > 1) {
      result.push('ellipsis');
    }
    result.push(page);
  }

  return result;
};

// Extract page number from a URL with ?page=
const extractPageFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://placeholder');
    const pageParam = parsed.searchParams.get('page');
    const n = Number(pageParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
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
        const headerTotalCount = Number(
          response.headers.get('X-Total-Count') ??
          response.headers.get('X-Total') ??
          response.headers.get('X-Pagination-Total')
        );

        const headerTotalPages = Number(
          response.headers.get('X-Total-Pages') ??
          response.headers.get('X-Page-Count') ??
          response.headers.get('X-Pagination-Page-Count')
        );
        const linkHeader = response.headers.get('Link');
        const headerLinkLast = (() => {
          if (!linkHeader) return null;
          const parts = linkHeader.split(',');
          const lastPart = parts.find((p) => p.includes('rel="last"') || p.includes("rel='last'"));
          if (!lastPart) return null;
          const match = lastPart.match(/<([^>]+)>/);
          return match ? extractPageFromUrl(match[1]) : null;
        })();
        const faultsContainer = data?.data?.faults ?? data?.faults ?? data?.data ?? {};

        const rows =
          (Array.isArray(faultsContainer?.data) && faultsContainer.data) ||
          (Array.isArray(faultsContainer) && faultsContainer) ||
          (Array.isArray(data?.data) && data.data) ||
          (Array.isArray(data?.faults) && data.faults) ||
          [];

        const meta =
          faultsContainer?.meta ||
          faultsContainer?.pagination ||
          faultsContainer?.data?.meta ||
          faultsContainer?.data?.pagination ||
          data?.data?.faults?.meta ||
          data?.data?.faults?.pagination ||
          data?.data?.meta ||
          data?.data?.pagination ||
          data?.meta ||
          data?.pagination ||
          faultsContainer;

        const linksArray = Array.isArray(meta?.links)
          ? meta?.links
          : Array.isArray(faultsContainer?.links)
            ? faultsContainer?.links
            : Array.isArray(faultsContainer?.data?.links)
              ? faultsContainer?.data?.links
              : Array.isArray(data?.links)
                ? data?.links
                : Array.isArray(data?.data?.links)
                  ? data?.data?.links
                  : [];

        const linksMaxFromUrls = (() => {
          const nums = linksArray
            .map((link) => extractPageFromUrl(link?.url))
            .filter((n) => Number.isFinite(n) && n > 0);
          return nums.length ? Math.max(...nums) : null;
        })();

        const perPage = (
          meta?.per_page ??
          meta?.perPage ??
          meta?.page_size ??
          meta?.pageSize ??
          faultsContainer?.per_page ??
          faultsContainer?.page_size ??
          faultsContainer?.data?.per_page ??
          faultsContainer?.data?.page_size ??
          data?.per_page ??
          data?.page_size ??
          data?.data?.per_page ??
          data?.data?.page_size ??
          rows.length
        ) || 1;

        const totalCount =
          meta?.total ??
          meta?.total_count ??
          meta?.count ??
          meta?.totalRecords ??
          faultsContainer?.total ??
          faultsContainer?.total_count ??
          faultsContainer?.count ??
          faultsContainer?.data?.total ??
          faultsContainer?.data?.total_count ??
          faultsContainer?.data?.count ??
          data?.total ??
          data?.total_count ??
          data?.count ??
          data?.data?.total ??
          data?.data?.total_count ??
          data?.data?.count ??
          headerTotalCount;

        const lastFromTotal = perPage && totalCount ? Math.ceil(Number(totalCount) / Number(perPage)) : undefined;

        const lastFromMeta =
          meta?.last_page ??
          meta?.lastPage ??
          meta?.total_pages ??
          meta?.totalPages ??
          meta?.pages ??
          meta?.page_count ??
          faultsContainer?.last_page ??
          faultsContainer?.total_pages ??
          faultsContainer?.pages ??
          faultsContainer?.page_count ??
          faultsContainer?.data?.last_page ??
          faultsContainer?.data?.total_pages ??
          faultsContainer?.data?.pages ??
          faultsContainer?.data?.page_count ??
          data?.data?.last_page ??
          data?.data?.total_pages ??
          data?.data?.pages ??
          data?.data?.page_count ??
          headerTotalPages ??
          headerTotalCount;

        const lastFromLinks = extractPageFromUrl(
          meta?.last_page_url ||
          meta?.lastPageUrl ||
          meta?.links?.last ||
          faultsContainer?.last_page_url ||
          faultsContainer?.links?.last ||
          faultsContainer?.data?.last_page_url ||
          faultsContainer?.data?.links?.last ||
          data?.links?.last ||
          data?.data?.links?.last ||
          headerLinkLast ||
          data?.last_page_url ||
          data?.data?.last_page_url
        );

        const nextPageUrl =
          meta?.next_page_url || meta?.nextPageUrl || meta?.links?.next ||
          faultsContainer?.next_page_url || faultsContainer?.links?.next || faultsContainer?.data?.next_page_url ||
          data?.next_page_url || data?.data?.next_page_url;
        const hasNext = Boolean(nextPageUrl);

        const candidateLast = [
          lastFromTotal,
          lastFromMeta,
          lastFromLinks,
          linksMaxFromUrls,
          headerTotalPages,
          headerLinkLast,
          data?.last_page,
          data?.total_pages,
          data?.page_count,
          data?.data?.last_page,
          data?.data?.total_pages,
          data?.data?.page_count,
        ]
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v) && v > 0);

        let maxLast = candidateLast.length ? Math.max(...candidateLast) : lastFromTotal || 1;

        // If API hints there is a next page but no total, show a small window forward
        if (hasNext && maxLast <= currentPage + 1) {
          maxLast = currentPage + 6;
        }

        // If we got a full page and still no total hints, assume at least a few pages exist
        if (!candidateLast.length && rows.length >= perPage) {
          maxLast = Math.max(maxLast, currentPage + 4);
        }

        setTotalPages(Math.max(1, maxLast));
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
                      <th>Plant Name</th>
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
