'use client';

import './Admins.css';
import { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL_USER_LIST || process.env.NEXT_PUBLIC_API_URL;

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

export default function AllUsers() {
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
  const [sortField, setSortField] = useState("id_asc");
  const [tablePage, setTablePage] = useState(1);
  const rowsPerPage = 25;

  // Fetch users from API
  const fetchUsers = async () => {
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
    }
  };

  // Fetch users when page or search changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);
  
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

  const sortData = (data) => {
    const sorted = [...data];
    switch (sortField) {
      case "id_asc":
        sorted.sort((a, b) => Number(a.id) - Number(b.id));
        break;
      case "username_asc":
        sorted.sort((a, b) =>
          (a.username || "").localeCompare(b.username || "")
        );
        break;
      case "created_desc": {
        const toTime = (value) => new Date(value ?? "").getTime() || 0;
        sorted.sort((a, b) => toTime(b.created_at) - toTime(a.created_at));
        break;
      }
      case "updated_desc": {
        const toTime = (value) => new Date(value ?? "").getTime() || 0;
        sorted.sort((a, b) => toTime(b.updated_at) - toTime(a.updated_at));
        break;
      }
      default:
        break;
    }
    return sorted;
  };

  const filteredUsers = normalizedSearchTerm
    ? users.filter((user) => {
        const usernameValue = (user.username ?? "").toLowerCase();
        const phoneValue = (user.phone ?? "").toLowerCase();
        const emailValue = (user.email ?? "").toLowerCase();
        const companyCodeValue = (user.company_code ?? "").toLowerCase();

        return [
          usernameValue,
          phoneValue,
          emailValue,
          companyCodeValue,
        ].some((field) => field.includes(normalizedSearchTerm));
      })
    : users;

  const sortedUsers = sortData(filteredUsers);
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

  return (
    <div className="user-list-page-company">
      <div className="ul-container">
        <div className="ul-card">
          <div className="ul-header">
            <div className="ul-header-text">
              <h5 className="ul-title">Company</h5>
              <p className="ul-subtitle">All users management and listing.</p>
            </div>
            <form onSubmit={handleSearchSubmit} className="ul-search">
              <div className="ul-search-input">
                <span className="ul-search-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85Zm-5.242.656a5 5 0 1 1 0-10.001 5 5 0 0 1 0 10Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="ul-input"
                  placeholder="Search by username, company code, phone, email..."
                  value={searchInput}
                  onChange={handleSearchChange}
                />
              </div>
            </form>
          </div>
          <div className="ul-body">
            {loading ? (
              <div className="ul-empty">
                <p className="ul-muted">Loading users...</p>
              </div>
            ) : error ? (
              <div className="ul-error" role="alert">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="ul-empty">
                <p className="ul-muted">No users found.</p>
              </div>
            ) : (
              <>
                <div className="table-scroll-container">
                  <div className="table-inner-force-allusers">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th className="sticky-col col-no">No.</th>
                          <th
                            className="sticky-col col-id sortable"
                            onClick={() => setSortField("id_asc")}
                          >
                            ID ↑
                          </th>
                          <th>Code</th>
                          <th
                            className="sticky-col col-username sortable"
                            onClick={() => setSortField("username_asc")}
                          >
                            Username A→Z
                          </th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Password</th>
                          <th
                            className="sortable"
                            onClick={() => setSortField("created_desc")}
                          >
                            Created At ↓
                          </th>
                          <th
                            className="sortable sticky-col sticky-col-right col-updated"
                            onClick={() => setSortField("updated_desc")}
                          >
                            Updated At ↓
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers && paginatedUsers.length > 0 ? (
                          paginatedUsers.map((u, index) => (
                            <tr key={u.id ?? index}>
                              <td className="sticky-col col-no">
                                {rowStartIndex + index + 1}
                              </td>
                              <td className="sticky-col col-id">{u.id ?? "N/A"}</td>
                              <td>{u.company_code ?? "N/A"}</td>
                              <td className="sticky-col col-username">
                                {u.username ?? "N/A"}
                              </td>
                              <td>{u.phone ?? "N/A"}</td>
                              <td>{u.email ?? "N/A"}</td>
                              <td>{u.password ?? "N/A"}</td>
                              <td>{formatDate(u.created_at)}</td>
                              <td className="sticky-col sticky-col-right col-updated">
                                {formatDate(u.updated_at)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", padding: "16px" }}>
                              No matching users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {page < totalPages && (
                  <div className="ul-load-more-container">
                    <button
                      className="ul-btn ul-btn-primary"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={loading}
                    >
                      Load More
                    </button>
                  </div>
                )}

                <div className="ul-pagination">
                  <button
                    type="button"
                    className="ul-btn"
                    onClick={handleTablePrevious}
                    disabled={tablePage === 1}
                  >
                    Previous
                  </button>
                  <div className="ul-pagination-info">
                    Showing
                    <span className="ul-strong">
                      {sortedUsers.length === 0
                        ? 0
                        : `${rowStartIndex + 1}–${Math.min(
                            rowStartIndex + paginatedUsers.length,
                            sortedUsers.length
                          )}`}
                    </span>{" "}
                    of <span className="ul-strong">{sortedUsers.length}</span>{" "}
                    users • Page <span className="ul-strong">{tablePage}</span> of{" "}
                    <span className="ul-strong">{totalTablePages}</span>
                  </div>
                  <button
                    type="button"
                    className="ul-btn"
                    onClick={handleTableNext}
                    disabled={tablePage === totalTablePages}
                  >
                    Next
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

