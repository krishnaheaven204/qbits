'use client';

import './Company.css';
import { useState, useEffect } from "react";

const API_BASE_URL =process.env.NEXT_PUBLIC_API_URL;

const normalizeApiBase = (input) => {
  if (!input) return "";
  let base = input.trim();
  const queryIndex = base.indexOf("?");
  if (queryIndex !== -1) {
    base = base.substring(0, queryIndex);
  }
  base = base.replace(/\/client\/index\/?$/i, "");
  base = base.replace(/\/client\/?$/i, "");
  base = base.replace(/\/$/, "");
  return base;
};

const API_BASE_ROOT = normalizeApiBase(API_BASE_URL);
let companyFetchLock = false;

export default function Company() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(150);
  const [search] = useState("");
  const [sortBy] = useState("username");
  const [sortOrder] = useState("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const rowsPerPage = 25;
  const [companySortConfig, setCompanySortConfig] = useState({
    field: "id",
    direction: "desc"
  });

  // Fetch users from API
  const fetchUsers = async () => {
    if (companyFetchLock) {
      return;
    }
    
    companyFetchLock = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (!API_BASE_ROOT) {
        throw new Error("API base URL is not configured");
      }

      const url = `${API_BASE_ROOT}/dealer/index?${params.toString()}`;

      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Normalize common Laravel shapes
      let list = [];
      let lastPage = 1;
      let total = 0;

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.data.clients)) {
        list = data.data.clients;
        if (data.meta) {
          lastPage = Number(data.meta.last_page) || lastPage;
          total = Number(data.meta.total) || total;
        } else if (typeof data.last_page !== "undefined") {
          lastPage = Number(data.last_page) || lastPage;
        }
      } else if (data.data && Array.isArray(data.data.data)) {
        list = data.data.data;
        lastPage = Number(data.data.last_page) || lastPage;
        total = Number(data.data.total) || total;
      } else if (Array.isArray(data.items)) {
        list = data.items;
        if (data.meta) {
          lastPage = Number(data.meta.last_page) || lastPage;
          total = Number(data.meta.total) || total;
        }
      }

      if (page === 1) {
        setUsers(list);
      } else {
        setUsers((prev) => [...prev, ...list]);
      }
      if (!Number.isFinite(lastPage) || lastPage < 1) {
        lastPage = Math.max(1, Math.ceil((total || list.length) / perPage));
      }
      setTotalPages(lastPage);
    } catch (err) {
      setError(err.message || "Failed to fetch users. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
      setTimeout(() => { companyFetchLock = false; }, 200);
    }
  };

  // Fetch users when page changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
  
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
  
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
  
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
  
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const formattedHours = String(hours).padStart(2, "0");
  
    return `${day} ${month} ${year}  ${formattedHours}:${minutes} ${ampm}`;
  };

  // Date helper for sorting
  const toDate = (value) => {
    if (!value) return 0;
    return new Date(value).getTime();
  };

  // Sort handler for company table
  const handleCompanySort = (field) => {
    setCompanySortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc"
        };
      }

      // default directions per column
      if (field === "id" || field === "username") {
        return { field, direction: "asc" };
      }

      if (field === "created_at" || field === "updated_at") {
        return { field, direction: "desc" };
      }

      return { field, direction: "asc" };
    });
  };

  // Sort company data function
  const sortCompanyData = (list) => {
    const { field, direction } = companySortConfig;
    const sorted = [...list];

    const dir = direction === "asc" ? 1 : -1;

    sorted.sort((a, b) => {

      // ID SORTING
      if (field === "id") {
        return (Number(a.id) - Number(b.id)) * dir;
      }

      // USERNAME SORTING (A→Z then numbers in ascending, Z→A then numbers in descending)
      if (field === "username") {
        const A = (a.username || "").trim().toLowerCase();
        const B = (b.username || "").trim().toLowerCase();

        const AisNum = /^\d/.test(A);
        const BisNum = /^\d/.test(B);

        if (!AisNum && BisNum) return direction === "asc" ? -1 : 1;
        if (AisNum && !BisNum) return direction === "asc" ? 1 : -1;

        const cmp = A.localeCompare(B);
        return direction === "asc" ? cmp : -cmp;
      }

      // CODE SORTING (string comparison)
      if (field === "company_code") {
        const va = (a.company_code || "").toLowerCase();
        const vb = (b.company_code || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // EMAIL SORTING (string comparison)
      if (field === "email") {
        const va = (a.email || "").toLowerCase();
        const vb = (b.email || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // PASSWORD SORTING (string comparison)
      if (field === "password") {
        const va = (a.password || "").toLowerCase();
        const vb = (b.password || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // CREATED_AT DATE SORT
      if (field === "created_at") {
        const da = toDate(a.created_at);
        const db = toDate(b.created_at);
        return direction === "asc" ? da - db : db - da;
      }

      // UPDATED_AT DATE SORT
      if (field === "updated_at") {
        const da = toDate(a.updated_at);
        const db = toDate(b.updated_at);
        return direction === "asc" ? da - db : db - da;
      }

      return 0;
    });

    return sorted;
  };
  
  // Handle search input with debounce
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleFlagToggle = async (userId, field, isEnabled) => {
    const targetUser = users.find((u) => u.id === userId);

    if (!targetUser) {
      return;
    }

    const previousSnapshot = { ...targetUser };
    const nextFlags = {
      whatsapp_notification_flag: targetUser.whatsapp_notification_flag ?? 0,
      inverter_fault_flag: targetUser.inverter_fault_flag ?? 0,
      daily_generation_report_flag:
        targetUser.daily_generation_report_flag ?? 0,
      weekly_generation_report_flag:
        targetUser.weekly_generation_report_flag ?? 0,
      monthly_generation_report_flag:
        targetUser.monthly_generation_report_flag ?? 0,
    };

    if (field === "whatsapp_notification_flag") {
      nextFlags.whatsapp_notification_flag = isEnabled ? 1 : 0;
      if (!isEnabled) {
        nextFlags.inverter_fault_flag = 1;
        nextFlags.daily_generation_report_flag = 0;
        nextFlags.weekly_generation_report_flag = 1;
        nextFlags.monthly_generation_report_flag = 1;
      }
    } else {
      nextFlags[field] = isEnabled ? 1 : 0;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...nextFlags } : u))
    );

    try {
      await updateFlagsAPI(userId, nextFlags);
    } catch (err) {
      console.error("[Flags Update] Failed to sync with API", err);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? previousSnapshot : u))
      );
    }
  };

const updateFlagsAPI = async (userId, values) => {
  const normalizedValues = {
    whatsapp_notification_flag: values.whatsapp_notification_flag ? 1 : 0,
    inverter_fault_flag: values.inverter_fault_flag ? 1 : 0,
    daily_generation_report_flag: values.daily_generation_report_flag ? 1 : 0,
    weekly_generation_report_flag: values.weekly_generation_report_flag ? 1 : 0,
    monthly_generation_report_flag: values.monthly_generation_report_flag ? 1 : 0,
  };

  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!API_BASE_ROOT) {
    throw new Error("API base URL is not configured");
  }

  const url = `${API_BASE_ROOT}/client/whatsapp-notification-update`;

  const payload = {
    id: userId,
    ...normalizedValues,
  };

  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetails = "";
    try {
      const errorText = await response.text();
      errorDetails = errorText || `HTTP ${response.status}`;
    } catch {
      errorDetails = `HTTP ${response.status}`;
    }
    throw new Error(`Failed to update flags: ${errorDetails}`);
  }

  return response.json().catch(() => null);
};

  useEffect(() => {
    const normalizedInput = searchInput.trim();
    const handler = setTimeout(() => {
      if (normalizedInput === clientSearchTerm) return;
      setClientSearchTerm(normalizedInput);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, clientSearchTerm]);

  useEffect(() => {
    setTablePage(1);
  }, [clientSearchTerm, users]);

  const normalizedSearchTerm = clientSearchTerm.trim().toLowerCase();

  const filteredUsers = normalizedSearchTerm
    ? users.filter((user) => {
        const idValue = String(user.id ?? "").toLowerCase();
        const usernameValue = (user.username ?? "").toLowerCase();
        const emailValue = (user.email ?? "").toLowerCase();
        const companyCodeValue = (user.company_code ?? "").toLowerCase();

        return [
          idValue,
          usernameValue,
          emailValue,
          companyCodeValue,
        ].some((field) => field.includes(normalizedSearchTerm));
      })
    : users;

  const sortedUsers = sortCompanyData(filteredUsers);
  const totalTablePages = Math.max(1, Math.ceil(sortedUsers.length / rowsPerPage));
  const rowStartIndex = (tablePage - 1) * rowsPerPage;
  const paginatedUsers = sortedUsers.slice(
    rowStartIndex,
    rowStartIndex + rowsPerPage
  );

  useEffect(() => {
    setTablePage((prev) => Math.min(prev, totalTablePages));
  }, [totalTablePages]);

  const handleTablePrevious = () => {
    setTablePage((prev) => Math.max(1, prev - 1));
  };

  const handleTableNext = () => {
    setTablePage((prev) => Math.min(totalTablePages, prev + 1));
  };

  // Helper function to generate page numbers for pagination
  const getPageNumbers = (currentPage, totalPages) => {
    const maxVisible = 5;
    const pages = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if near the beginning
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      }

      // Adjust if near the end
      if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Reusable sortable header component
  function SortableHeader({ label, field }) {
    const isActive = companySortConfig.field === field;
    const direction = isActive ? companySortConfig.direction : null;

    return (
      <button
        type="button"
        className={`th-sortable ${isActive ? "th-sortable-active" : ""}`}
        onClick={() => handleCompanySort(field)}
      >
        <span className="th-label">{label}</span>
        <span className={`th-icon ${direction === "asc" ? "asc" : direction === "desc" ? "desc" : ""}`}>
          ▲
        </span>
      </button>
    );
  }

  return (
    <div className="company-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header company-header">
            <h5>Company</h5>
            <form onSubmit={handleSearchSubmit} className="company-search" role="search">
              <input
                type="text"
                className="company-search-input"
                placeholder="Search by username, company code, email..."
                value={searchInput}
                onChange={handleSearchChange}
              />
            </form>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="company-empty">Loading users...</div>
            ) : error ? (
              <div className="company-error" role="alert">{error}</div>
            ) : users.length === 0 ? (
              <div className="company-empty">No users found.</div>
            ) : (
              <>
                <div className="company-table-wrapper">
                  <table className="company-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>
                          <SortableHeader label="ID" field="id" />
                        </th>
                        <th>
                          <SortableHeader label="Code" field="company_code" />
                        </th>
                        <th>
                          <SortableHeader label="Username" field="username" />
                        </th>
                        <th>
                          <SortableHeader label="Email" field="email" />
                        </th>
                        <th>
                          <SortableHeader label="Password" field="password" />
                        </th>
                        <th>
                          <SortableHeader label="Created At" field="created_at" />
                        </th>
                        <th>
                          <SortableHeader label="Updated At" field="updated_at" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers && paginatedUsers.length > 0 ? (
                        paginatedUsers.map((u, index) => (
                          <tr key={u.id ?? index}>
                            <td>{rowStartIndex + index + 1}</td>
                            <td>{u.id ?? "N/A"}</td>
                            <td>{u.company_code ?? "N/A"}</td>
                            <td>{u.username ?? "N/A"}</td>
                            <td>{u.email ?? "N/A"}</td>
                            <td>{u.password ?? "N/A"}</td>
                            <td>{formatDate(u.created_at)}</td>
                            <td>{formatDate(u.updated_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="company-empty">No matching users found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="company-pagination">
                  <button
                    type="button"
                    className="company-page-btn"
                    onClick={handleTablePrevious}
                    disabled={tablePage === 1}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {getPageNumbers(tablePage, totalTablePages).map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="company-pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={pageNum}
                        type="button"
                        className={`company-page-btn ${tablePage === pageNum ? 'active' : ''}`}
                        onClick={() => setTablePage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                  <button
                    type="button"
                    className="company-page-btn"
                    onClick={handleTableNext}
                    disabled={tablePage === totalTablePages}
                    aria-label="Next page"
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

