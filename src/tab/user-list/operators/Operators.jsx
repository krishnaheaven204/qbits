'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const getStateMeta = (state) => {
  const code = Number(state);
  if (code === 1) return { label: 'Normal', className: 'state-online' };
  if (code === 4 || code === 5) return { label: 'Fault', className: 'state-fault' };
  return { label: 'Offline', className: 'state-offline' };
};

export default function Operators() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredRecords = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return records;

    const normalize = (value) => (value ?? '').toString().toLowerCase();

    return records.filter((row) => {
      const stateMeta = getStateMeta(row?.plant?.plantstate ?? row?.plantstate ?? row?.state ?? row?.status);
      const fields = [
        normalize(row?.id),
        normalize(row?.collector_address),
        normalize(row?.plant?.plant_name ?? row?.plant_name ?? row?.plantName),
        normalize(row?.model),
        normalize(stateMeta.label)
      ];

      return fields.some((field) => field.includes(term));
    });
  }, [records, searchQuery]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const aTime = new Date(a?.record_time || a?.updated_at || 0).getTime();
      const bTime = new Date(b?.record_time || b?.updated_at || 0).getTime();
      return bTime - aTime;
    });
  }, [filteredRecords]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleRowClick = (row) => {
    const inverterId = row?.id;
    if (!inverterId) return;
    const plantNo = row?.plant_no ?? row?.plant?.plant_no ?? row?.plantNo ?? row?.plant?.plantNo;
    const query = plantNo ? `?plant_no=${encodeURIComponent(plantNo)}` : '';
    router.push(`/inverters/${inverterId}/summary${query}`);
  };

  return (
    <div className="operators-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header op-header">
            <h5>Inverters</h5>
            <div className="op-search">
              <input
                type="text"
                className="op-search-input"
                placeholder="Search by ID, Collector, Plant Name, Model, State"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search inverters"
              />
            </div>
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
                        <th>Plant Name</th>
                        <th>Model</th>
                        <th>Record Time</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasRecords ? (
                        paginatedRecords.map((row) => {
                          const stateMeta = getStateMeta(row?.plant?.plantstate ?? row?.plantstate ?? row?.state ?? row?.status);
                          return (
                            <tr
                              key={row?.id ?? `${row?.collector_address}-${row?.record_time}`}
                              className="op-row-clickable"
                              onClick={() => handleRowClick(row)}
                              style={{ cursor: row?.id ? 'pointer' : 'default' }}
                            >
                              
                              <td>{row?.id ?? '—'}</td>
              
                              <td>{row?.collector_address ?? '—'}</td> 
                              <td>{row?.plant?.plant_name ?? row?.plant_name ?? row?.plantName ?? '—'}</td>
                              <td>{row?.model ?? '—'}</td>
                              <td>{formatDate(row?.record_time)}</td>
                              <td>{formatDateTime(row?.created_at)}</td>
                              <td>{formatDateTime(row?.updated_at)}</td>
                              <td>
                                <span className={`op-state-badge ${stateMeta.className}`}>{stateMeta.label}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="op-empty-row" colSpan={8}>No inverter records found</td>
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

