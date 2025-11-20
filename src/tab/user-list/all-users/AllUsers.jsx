"use client";

import { useState, useEffect } from "react";
import "./AllUsers.css";

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
  const [search, setSearch] = useState("");
  const [sortBy] = useState("username");
  const [sortOrder] = useState("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");

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

      const url = `${API_BASE_ROOT}/client/index?${params.toString()}`;

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

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setUsers([]);
    setPage(1);
    setSearch(searchInput);
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
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

  return (
    <div className="user-list-page">
      <div className="ul-container">
        <div className="ul-card">
          <div className="ul-header">
            <div className="ul-header-text">
              <h5 className="ul-title">User List – All Users</h5>
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
                  placeholder="Search by username..."
                  value={searchInput}
                  onChange={handleSearchChange}
                />
              </div>
              <button type="submit" className="ul-btn ul-btn-primary">
                Search
              </button>
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
                  <div className="table-inner-force">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>ID</th>
                          <th>Company Code</th>
                          <th>Username</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Plant Name</th>
                          <th>Inverter Type</th>
                          <th>City</th>
                          <th>Collector</th>
                          <th>Longitude</th>
                          <th>Latitude</th>
                          <th>GMT</th>
                          <th>Plant Type</th>
                          <th>Iserial</th>
                          <th>WhatsApp Flag</th>
                          <th>Inverter Fault</th>
                          <th>Daily Gen</th>
                          <th>Weekly Gen</th>
                          <th>Monthly Gen</th>
                          <th>Created At</th>
                          <th>Updated At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users && users.length > 0 ? (
                          users.map((u, index) => (
                            <tr key={u.id ?? index}>
                              <td>{index + 1}</td>
                              <td>{u.id ?? "N/A"}</td>
                              <td>{u.company_code?? "N/A"}</td>
                              <td>{u.username ?? "N/A"}</td>
                              <td>{u.phone ?? "N/A"}</td>
                              <td>{u.email ?? "N/A"}</td>
                              <td>{u.plant_name ?? "N/A"}</td>
                              <td>{u.inverter_type ?? "N/A"}</td>
                              <td>{u.city_name ?? "N/A"}</td>
                              <td>{u.collector ?? "N/A"}</td>
                              <td>{u.longitude ?? "N/A"}</td>
                              <td>{u.latitude ?? "N/A"}</td>
                              <td>{u.gmt ?? "N/A"}</td>
                              <td>{u.plant_type ?? "N/A"}</td>
                              <td>{u.iserial ?? "N/A"}</td>
                              <td className="flag-toggle-cell">
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={u.whatsapp_notification_flag == 1}
                                    onChange={(e) =>
                                      handleFlagToggle(u.id, "whatsapp_notification_flag", e.target.checked)
                                    }
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                              <td className="flag-toggle-cell">
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={u.inverter_fault_flag == 1}
                                    disabled={u.whatsapp_notification_flag != 1}
                                    onChange={(e) =>
                                      handleFlagToggle(u.id, "inverter_fault_flag", e.target.checked)
                                    }
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                              <td className="flag-toggle-cell">
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={u.daily_generation_report_flag == 1}
                                    disabled={u.whatsapp_notification_flag != 1}
                                    onChange={(e) =>
                                      handleFlagToggle(u.id, "daily_generation_report_flag", e.target.checked)
                                    }
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                              <td className="flag-toggle-cell">
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={u.weekly_generation_report_flag == 1}
                                    disabled={u.whatsapp_notification_flag != 1}
                                    onChange={(e) =>
                                      handleFlagToggle(u.id, "weekly_generation_report_flag", e.target.checked)
                                    }
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td>
                              <td className="flag-toggle-cell">
                                <label className="toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={u.monthly_generation_report_flag == 1}
                                    disabled={u.whatsapp_notification_flag != 1}
                                    onChange={(e) =>
                                      handleFlagToggle(u.id, "monthly_generation_report_flag", e.target.checked)
                                    }
                                  />
                                  <span className="toggle-slider"></span>
                                </label>
                              </td> 
                              <td>{u.created_at ?? "N/A"}</td>
                              <td>{u.updated_at ?? "N/A"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={21} style={{ textAlign: "center", padding: "16px" }}>
                              No users found
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
                  <div className="ul-pagination-info">
                    Showing <span className="ul-strong">{users.length}</span>{" "}
                    users • Page <span className="ul-strong">{page}</span> of{" "}
                    <span className="ul-strong">{totalPages}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
