'use client';

import { useEffect, useMemo, useState } from 'react';
import './Operators.css';

const API_URL = 'https://qbits.quickestimate.co/api/v1/inverter/all_latest_data';

const buildPageList = (total, current) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const candidates = new Set([
    1,
    total,
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2
  ].filter((p) => p >= 1 && p <= total));

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

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getStateMeta = (state) => {
  const code = Number(state);
  if (code === 1) return { label: 'Normal', className: 'state-online' };
  if (code === 4 || code === 5) return { label: 'Fault', className: 'state-fault' };
  return { label: 'Offline', className: 'state-offline' };
};

export default function Operators() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(API_URL, { method: 'GET', headers, signal: controller.signal });
        if (!response.ok) throw new Error('Failed to load inverter data');

        const data = await response.json();

        const candidates = [
          data?.data?.data,
          data?.data?.records,
          data?.data?.list,
          data?.data?.inverters,
          data?.data,
          data?.list,
          data?.records,
          data?.inverters,
          data
        ];

        const firstArray = candidates.find((c) => Array.isArray(c));
        if (firstArray) {
          setRecords(firstArray);
        } else if (candidates.find((c) => c && typeof c === 'object')) {
          // If single object, wrap it for table rendering
          const single = candidates.find((c) => c && typeof c === 'object');
          setRecords([single]);
        } else {
          setRecords([]);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setRecords([]);
        setError(err.message || 'Could not fetch inverter data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aTime = new Date(a?.record_time || a?.updated_at || 0).getTime();
      const bTime = new Date(b?.record_time || b?.updated_at || 0).getTime();
      return bTime - aTime;
    });
  }, [records]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage));
  const hasRecords = sortedRecords.length > 0;
  const pageList = useMemo(() => buildPageList(totalPages, currentPage), [totalPages, currentPage]);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRecords.slice(start, start + rowsPerPage);
  }, [sortedRecords, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [records.length]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="operators-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header">
            <h5>Inverters</h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="op-empty">Loading...</div>
            ) : error ? (
              <div className="op-empty op-error">{error}</div>
            ) : (
              <>
                <div className="op-table-wrapper">
                  <table className="op-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Collector Address</th>
                        <th>Model</th>
                        <th>Record Time</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                        <th>State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasRecords ? (
                        paginatedRecords.map((row) => {
                          const stateMeta = getStateMeta(row?.plant?.plantstate ?? row?.plantstate ?? row?.state ?? row?.status);
                          return (
                            <tr key={row?.id ?? `${row?.collector_address}-${row?.record_time}`}>
                              <td>{row?.id ?? '—'}</td>
                              <td>{row?.collector_address ?? '—'}</td>
                              <td>{row?.model ?? '—'}</td>
                              <td>{formatDate(row?.record_time)}</td>
                              <td>{formatDate(row?.created_at)}</td>
                              <td>{formatDate(row?.updated_at)}</td>
                              <td>
                                <span className={`op-state-badge ${stateMeta.className}`}>{stateMeta.label}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="op-empty-row" colSpan={7}>No inverter records found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="op-pagination">
                  <button
                    className="op-page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  {pageList.map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="op-pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={page}
                        className={`op-page-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    className="op-page-btn"
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
    </div>
  );
}

