'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './FaultInfo.css';

const STATUS_TABS = [
  { key: 'all', label: 'All', statusParam: -1 },
  { key: 'going', label: 'Going', statusParam: 0 },
  { key: 'recovered', label: 'Recovered', statusParam: 1 }
];

const FAULTS_PER_PAGE = 25;

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
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const maxTotalPagesRef = useRef(1);
  const [plantFilter, setPlantFilter] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');

  const [isPlantFilterOpen, setIsPlantFilterOpen] = useState(false);
  const [plantFilterMenuPos, setPlantFilterMenuPos] = useState({ top: 0, left: 0 });
  const [plantMenuSearch, setPlantMenuSearch] = useState('');
  const plantFilterButtonRef = useRef(null);
  const plantFilterMenuRef = useRef(null);

  const sortedFaults = useMemo(() => {
    const safeDate = (value) => parseDate(value)?.getTime() || 0;
    const sortKey = (fault) => safeDate(fault?.stime);
    // Newest start time first
    return [...faults].sort((a, b) => sortKey(b) - sortKey(a));
  }, [faults]);

  const filteredFaults = useMemo(() => {
    const term = plantFilter.trim().toLowerCase();
    const selected = selectedPlant.trim().toLowerCase();
    if (!term && !selected) return sortedFaults;
    const normalize = (v) => (v ?? '').toString().toLowerCase();

    return sortedFaults.filter((fault) => {
      const plantName =
        fault?.atun ||
        fault?.plant_name ||
        fault?.station_name ||
        fault?.plant?.plant_name ||
        fault?.plant?.plantName;
      const normalized = normalize(plantName);
      const selectedOk = selected ? normalized === selected : true;
      const termOk = term ? normalized.includes(term) : true;
      return selectedOk && termOk;
    });
  }, [sortedFaults, plantFilter, selectedPlant]);

  const plantOptions = useMemo(() => {
    const normalizeLabel = (v) => (v ?? '').toString().trim();
    const all = sortedFaults
      .map((fault) =>
        normalizeLabel(
          fault?.atun ||
          fault?.plant_name ||
          fault?.station_name ||
          fault?.plant?.plant_name ||
          fault?.plant?.plantName
        )
      )
      .filter(Boolean);
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
  }, [sortedFaults]);

  const filteredPlantOptions = useMemo(() => {
    const term = plantMenuSearch.trim().toLowerCase();
    if (!term) return plantOptions;
    return plantOptions.filter((p) => p.toLowerCase().includes(term));
  }, [plantOptions, plantMenuSearch]);

  const hasFaults = filteredFaults.length > 0;
  const isPlantFilterActive = Boolean(plantFilter.trim() || selectedPlant.trim());
  const plantSearchTerm = (selectedPlant || plantFilter).trim();
  const pageList = useMemo(() => buildPageList(totalPages, currentPage), [totalPages, currentPage]);

  const updatePlantFilterMenuPosition = useCallback(() => {
    if (typeof window === 'undefined' || !plantFilterButtonRef.current) return;
    const rect = plantFilterButtonRef.current.getBoundingClientRect();
    setPlantFilterMenuPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  }, []);

  const closePlantFilterMenu = useCallback(() => {
    setIsPlantFilterOpen(false);
    setPlantMenuSearch('');
  }, []);

  const handlePlantFilterIconClick = () => {
    if (isPlantFilterOpen) {
      closePlantFilterMenu();
    } else {
      updatePlantFilterMenuPosition();
      setIsPlantFilterOpen(true);
    }
  };

  const handlePlantFilterSelect = (value) => {
    setSelectedPlant(value);
    setPlantFilter('');
    setCurrentPage(1);
    closePlantFilterMenu();
  };

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
        const searchParam = plantSearchTerm ? `&search=${encodeURIComponent(plantSearchTerm)}` : '';
        const baseUrl = `https://qbits.quickestimate.co/api/v1/faults?plant_id=&inverter_id=&status=${statusParam}&limit=${FAULTS_PER_PAGE}&per_page=${FAULTS_PER_PAGE}&page_size=${FAULTS_PER_PAGE}${searchParam}`;

        const parseResponse = async (response, pageNumber) => {
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
            FAULTS_PER_PAGE
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

          // Heuristics when API doesn't provide reliable total pages
          if (hasNext && maxLast <= (pageNumber || 1) + 1) {
            maxLast = (pageNumber || 1) + 6;
          }

          if (!candidateLast.length && rows.length >= (perPage || FAULTS_PER_PAGE)) {
            maxLast = Math.max(maxLast, (pageNumber || 1) + 4);
          }

          return { rows, maxLast, perPage, hasNext, nextPageUrl };
        };

        // If searching, load ALL matching pages and show in one single page
        if (plantSearchTerm) {
          const firstUrl = `${baseUrl}&page=1`;
          const firstResponse = await fetch(firstUrl, { method: 'GET', headers, signal: controller.signal });
          if (!firstResponse.ok) throw new Error('Failed to load fault records');
          const firstParsed = await parseResponse(firstResponse, 1);

          const allRows = [...firstParsed.rows];
          let p = 1;
          let hasNext = firstParsed.hasNext;

          // Safety caps to avoid infinite loops / huge memory usage
          const MAX_PAGES_TO_FETCH = 300;
          const MAX_ROWS_TO_RENDER = 10000;

          while (hasNext && p < MAX_PAGES_TO_FETCH && allRows.length < MAX_ROWS_TO_RENDER) {
            const nextPage = p + 1;
            const pageUrl = `${baseUrl}&page=${nextPage}`;
            const resp = await fetch(pageUrl, { method: 'GET', headers, signal: controller.signal });
            if (!resp.ok) break;
            const parsed = await parseResponse(resp, nextPage);
            if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) break;
            allRows.push(...parsed.rows);
            p = nextPage;
            hasNext = Boolean(parsed.hasNext);
          }

          setCurrentPage(1);
          setTotalPages(1);
          setFaults(allRows);
          return;
        }

        // Normal mode: fetch the selected page only
        const url = `${baseUrl}&page=${currentPage}`;
        const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to load fault records');
        }
        const parsed = await parseResponse(response, currentPage);
        const nextTotalPages = Math.max(1, parsed.maxLast || 1);
        maxTotalPagesRef.current = Math.max(maxTotalPagesRef.current, nextTotalPages);
        setTotalPages(maxTotalPagesRef.current);
        setFaults(Array.isArray(parsed.rows) ? parsed.rows : []);
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
  }, [activeTab, currentPage, plantSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [plantFilter, selectedPlant]);

  useEffect(() => {
    if (!isPlantFilterOpen) return;
    const handleClickOutside = (event) => {
      if (
        plantFilterButtonRef.current?.contains(event.target) ||
        plantFilterMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      closePlantFilterMenu();
    };

    const handleViewportChange = () => {
      updatePlantFilterMenuPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isPlantFilterOpen, closePlantFilterMenu, updatePlantFilterMenuPosition]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const faultRowsWithKeys = useMemo(() => {
    const makeBaseKey = (fault) => {
      const idPart = fault?.id ?? '';
      const plantPart = fault?.plant_id ?? fault?.plant_no ?? fault?.plant_name ?? fault?.station_name ?? '';
      const invPart = fault?.inverter_id ?? fault?.inverter_no ?? fault?.sn ?? fault?.serial_no ?? '';
      const startPart = fault?.stime ?? '';
      const endPart = fault?.etime ?? '';
      const msgPart = Array.isArray(fault?.message_en) ? fault.message_en.join('|') : fault?.message_en ?? '';
      return [idPart, plantPart, invPart, startPart, endPart, msgPart].filter(Boolean).join('::') || 'fault';
    };

    const counts = new Map();
    return filteredFaults.map((fault) => {
      const base = makeBaseKey(fault);
      const nextCount = (counts.get(base) ?? 0) + 1;
      counts.set(base, nextCount);
      const key = nextCount === 1 ? base : `${base}::${nextCount}`;
      return { fault, key };
    });
  }, [filteredFaults]);

  const plantFilterMenu =
    hasMounted && isPlantFilterOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={plantFilterMenuRef}
            className="fault-filter-menu"
            style={{ top: plantFilterMenuPos.top, left: plantFilterMenuPos.left }}
          >
            <div className="fault-filter-menu-header">Plant Name</div>
            <div className="fault-filter-search-wrapper">
              <input
                type="text"
                className="fault-filter-search"
                placeholder="Search plants..."
                value={plantMenuSearch}
                onChange={(e) => {
                  const next = e.target.value;
                  setPlantMenuSearch(next);
                  setPlantFilter(next);
                }}
                autoFocus
              />
            </div>
            <button
              type="button"
              className={`fault-filter-option ${selectedPlant === '' ? 'active' : ''}`}
              onClick={() => handlePlantFilterSelect('')}
            >
              Show All
            </button>
            <div className="fault-filter-divider" />
            {filteredPlantOptions.map((plant) => (
              <button
                key={plant}
                type="button"
                className={`fault-filter-option ${selectedPlant === plant ? 'active' : ''}`}
                onClick={() => handlePlantFilterSelect(plant)}
              >
                {plant}
                {selectedPlant === plant && <span className="fault-filter-check">✓</span>}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className="fault-info-page">
      <div className="fault-card">
        <div className="fault-card-header">
          <h5 className="fault-title">Fault Information</h5>
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
                      <th>
                        <div className="fault-plant-header">
                          <span>Plant Name</span>
                          <button
                            ref={plantFilterButtonRef}
                            type="button"
                            className={`fault-filter-trigger ${isPlantFilterOpen ? 'active' : ''} ${selectedPlant ? 'has-selection' : ''}`}
                            aria-label="Filter plant name"
                            aria-expanded={isPlantFilterOpen}
                            onClick={handlePlantFilterIconClick}
                          >
                            ≡
                          </button>
                        </div>
                      </th>
                      <th>Device</th>
                      <th>Serial</th>
                      <th>Fault Info</th>
                      <th>Start</th>
                      <th>End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasFaults ? (
                      faultRowsWithKeys.map(({ fault, key }) => {
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
                          <tr key={key}>
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
              {hasMounted && !plantSearchTerm && (
                <div className="fault-pagination-container">
                  <button
                    className="fault-pagination-arrow"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>

                  {pageList.map((page, idx) =>
                    typeof page !== 'number'
                      ? (
                          <span className="fault-pagination-ellipsis" key={`ellipsis-${idx}`}>
                            …
                          </span>
                        )
                      : (
                          <button
                            key={`page-${page}`}
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
              )}
              {plantFilterMenu}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
