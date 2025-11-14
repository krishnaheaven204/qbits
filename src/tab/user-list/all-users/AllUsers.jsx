"use client";

import { useMemo, useState, useEffect } from "react";
import "./AllUsers.css";
import { DataGrid } from "@mui/x-data-grid";
import muiColumns from "./table/muiColumns";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL_USER_LIST || process.env.NEXT_PUBLIC_API_URL;

// Derive the Laravel origin (where /sanctum/csrf-cookie lives)
// If API_BASE_URL is like http://IP/api or http://IP/api/v1 → backend origin is http://IP
const LARAVEL_ORIGIN = (() => {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    // Fallback: strip known /api prefixes
    return API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, "");
  }
})();

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(30);
  const [search, setSearch] = useState("");
  const [sortBy] = useState("username");
  const [sortOrder] = useState("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const gridMinWidth = useMemo(
    () =>
      muiColumns.reduce(
        (sum, col) => sum + (typeof col.width === "number" ? col.width : 150),
        0
      ),
    []
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflowX;
    document.body.style.overflowX = "auto";

    const logDimensions = () => {
      const wrap = document.querySelector(".ul-table-wrap");
      if (wrap) {
        console.info(
          "[AllUsers] scrollWidth:",
          wrap.scrollWidth,
          "clientWidth:",
          wrap.clientWidth,
          "gridMinWidth:",
          gridMinWidth
        );
      }
    };

    logDimensions();
    window.addEventListener("resize", logDimensions);

    return () => {
      document.body.style.overflowX = previousOverflow;
      window.removeEventListener("resize", logDimensions);
    };
  }, [gridMinWidth, users.length]);

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

      const url = `${API_BASE_URL.replace(
        /\/$/,
        ""
      )}/client/index?${params.toString()}`;

      // IMPORTANT for Laravel Sanctum on cross-origin:
      // 1) Get CSRF cookie from backend origin before making stateful requests
      //    This sets XSRF-TOKEN cookie which the browser will include
      try {
        await fetch(`${LARAVEL_ORIGIN}/sanctum/csrf-cookie`, {
          method: "GET",
          credentials: "include",
          mode: "cors",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
      } catch (e) {
        // Non-blocking; if this fails we'll still attempt the primary request
      }

      const response = await fetch(url, {
        method: "GET",
        // credentials: 'include', // Laravel Sanctum cookies
        mode: "cors",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
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
      } else if (Array.isArray(data.data)) {
        list = data.data;
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

      setUsers(list);
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
    setSearch(searchInput);
    setPage(1); // Reset to first page on new search
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
                <div className="ul-table-wrap">
                  <div
                    className="ul-data-grid"
                    style={{ minWidth: gridMinWidth, height: 600 }}
                  >
                    <DataGrid
                      rows={users.map((u, i) => ({ id: u.id ?? i, ...u }))}
                      columns={muiColumns}
                      disableRowSelectionOnClick
                      paginationModel={{ pageSize: perPage, page: page - 1 }}
                      pageSizeOptions={[perPage]}
                      hideFooter
                      sx={{
                        minWidth: gridMinWidth,
                        "& .MuiDataGrid-main": {
                          overflowX: "auto !important",
                          overflowY: "hidden !important",
                        },
                        "& .MuiDataGrid-virtualScroller": {
                          overflowX: "auto !important",
                        },
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: "#f8fafc"
                        },
                        scrollbarWidth: "thin",
                        "&::-webkit-scrollbar": {
                          height: "10px"
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "#f1f5f9",
                          borderRadius: "9999px"
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "#cbd5e1",
                          borderRadius: "9999px"
                        },
                        "&::-webkit-scrollbar-thumb:hover": {
                          background: "#94a3b8"
                        }
                      }}
                      
                    />
                  </div>
                </div>

                <div className="ul-pagination">
                  <div className="ul-pagination-info">
                    Showing <span className="ul-strong">{users.length}</span>{" "}
                    users • Page <span className="ul-strong">{page}</span> of{" "}
                    <span className="ul-strong">{totalPages}</span>
                  </div>
                  <div className="ul-pagination-actions">
                    <button
                      className="ul-btn ul-btn-ghost"
                      onClick={handlePrevious}
                      disabled={page === 1 || loading}
                    >
                      ‹ Previous
                    </button>
                    <button
                      className="ul-btn ul-btn-primary"
                      onClick={handleNext}
                      disabled={page >= totalPages || loading}
                    >
                      Next ›
                    </button>
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
