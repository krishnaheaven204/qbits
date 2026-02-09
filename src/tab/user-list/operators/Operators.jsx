'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, left: 0 });
  const statusFilterButtonRef = useRef(null);
  const statusFilterMenuRef = useRef(null);
  const rowsPerPage = 10;

  const statusOptions = useMemo(() => ['Normal', 'Fault', 'Offline'], []);

  const updateStatusMenuPosition = useCallback(() => {
    if (typeof window === 'undefined' || !statusFilterButtonRef.current) return;
    const rect = statusFilterButtonRef.current.getBoundingClientRect();
    setStatusMenuPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  }, []);

  const closeStatusMenu = useCallback(() => {
    setIsStatusFilterOpen(false);
  }, []);

  const toggleStatusMenu = () => {
    if (isStatusFilterOpen) {
      closeStatusMenu();
    } else {
      updateStatusMenuPosition();
      setIsStatusFilterOpen(true);
    }
  };

  const handleStatusSelect = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
    closeStatusMenu();
  };

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
    const selected = selectedStatus.trim().toLowerCase();

    if (!term && !selected) return records;

    const normalize = (value) => (value ?? '').toString().toLowerCase();

    return records.filter((row) => {
      const stateMeta = getStateMeta(row?.plant?.plantstate ?? row?.plantstate ?? row?.state ?? row?.status);

      const statusOk = selected ? normalize(stateMeta.label) === selected : true;
      const fields = [
        normalize(row?.id),
        normalize(row?.collector_address),
        normalize(row?.plant?.plant_name ?? row?.plant_name ?? row?.plantName),
        normalize(row?.model),
        normalize(stateMeta.label)
      ];

      const termOk = term ? fields.some((field) => field.includes(term)) : true;
      return statusOk && termOk;
    });
  }, [records, searchQuery, selectedStatus]);

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
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    if (!isStatusFilterOpen) return;

    const handleClickOutside = (event) => {
      if (
        statusFilterButtonRef.current?.contains(event.target) ||
        statusFilterMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      closeStatusMenu();
    };

    const handleViewportChange = () => {
      updateStatusMenuPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isStatusFilterOpen, closeStatusMenu, updateStatusMenuPosition]);

  const statusFilterMenu =
    isStatusFilterOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={statusFilterMenuRef}
            className="op-filter-menu"
            style={{ top: statusMenuPos.top, left: statusMenuPos.left }}
          >
            <div className="op-filter-menu-header">Status</div>
            <button
              type="button"
              className={`op-filter-option ${selectedStatus === '' ? 'active' : ''}`}
              onClick={() => handleStatusSelect('')}
            >
              Show All
            </button>
            <div className="op-filter-divider" />
            {statusOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`op-filter-option ${selectedStatus === opt ? 'active' : ''}`}
                onClick={() => handleStatusSelect(opt)}
              >
                {opt}
                {selectedStatus === opt && <span className="op-filter-check">✓</span>}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

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
                        <th>
                          <div className="op-status-header">
                            <span>Status</span>
                            <button
                              ref={statusFilterButtonRef}
                              type="button"
                              className={`op-filter-trigger ${isStatusFilterOpen ? 'active' : ''} ${selectedStatus ? 'has-selection' : ''}`}
                              aria-label="Filter status"
                              aria-expanded={isStatusFilterOpen}
                              onClick={toggleStatusMenu}
                            >
                              ≡
                            </button>
                          </div>
                        </th>
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
                {statusFilterMenu}
                <div className="op-pagination">
                  <button
                    className="op-page-btn op-pagination-arrow op-pagination-arrow-left"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &gt;
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
                    className="op-page-btn op-pagination-arrow"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
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

