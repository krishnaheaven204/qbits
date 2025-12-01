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
  // Popup states
  const [showCompanyPopup, setShowCompanyPopup] = useState(false);
  const [popupUserId, setPopupUserId] = useState("");
  const [popupCompanyCode, setPopupCompanyCode] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [companyCodeInput, setCompanyCodeInput] = useState("");
  const [companyModalLoading, setCompanyModalLoading] = useState(false);

  // Qbits company code modal states
  const [showQbitsModal, setShowQbitsModal] = useState(false);
  const [selectedQbitsUserId, setSelectedQbitsUserId] = useState(null);
  const [qbitsCodeInput, setQbitsCodeInput] = useState("");
  const [qbitsModalLoading, setQbitsModalLoading] = useState(false);
  // Status filter UI state
  const [selectedStatus, setSelectedStatus] = useState(null);
  // ADD THIS HERE
  const [inverterTotals, setInverterTotals] = useState({
    total_all_plant: 0,
    total_normal_plant: 0,
    total_alarm_plant: 0,
    total_offline_plant: 0,
  });

  // Refresh button states
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
// Last refreshed time
  const [lastRefreshedAt, setLastRefreshedAt] = useState("");
  
  const [groupedClients, setGroupedClients] = useState({
    all_plant: [],
    normal_plant: [],
    alarm_plant: [],
    offline_plant: [],
  });

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
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

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

      let list = [];
      let lastPage = 1;
      let total = 0;

      if (Array.isArray(data)) {
        list = data;
      } else if (data.data && Array.isArray(data.data.clients)) {
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

  // 👉 PASTE HERE
  const fetchInverterTotals = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      if (!token) {
        console.log("No token found");
        return;
      }

      if (!API_BASE_ROOT) {
        console.log("API base URL missing");
        return;
      }

      const response = await fetch(`${API_BASE_ROOT}/client/inverter/totals`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Totals API error", response.status);
        return;
      }

      const json = await response.json();

      if (json.success && json.data) {
        setInverterTotals(json.data);
      } else {
        console.log("Invalid totals API structure", json);
      }
    } catch (err) {
      console.log("Error fetching inverter totals", err);
    }
  };

  const fetchGroupedClients = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      if (!token) {
        console.log("No token for grouped clients");
        return;
      }

      if (!API_BASE_ROOT) {
        console.log("API base URL missing for grouped clients");
        return;
      }

      const url = `${API_BASE_ROOT}/client/grouped-clients?search=&per_page=20&page_all=1&page_normal=1&page_alarm=1&page_offline=1`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Grouped clients API error", response.status);
        return;
      }

      const json = await response.json();

      if (json.success && json.data) {
        setGroupedClients({
          all_plant: json.data.all_plant?.data || [],
          normal_plant: json.data.normal_plant?.data || [],
          alarm_plant: json.data.alarm_plant?.data || [],
          offline_plant: json.data.offline_plant?.data || [],
        });
      } else {
        console.log("Invalid grouped clients structure", json);
      }
    } catch (err) {
      console.log("Error fetching grouped clients", err);
    }
  };

  // Call Refresh/Sync API
  const runInverterCommand = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      if (!token) {
        alert("No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_ROOT}/run-inverter-command`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to run refresh command");
      }

      // Refresh all tables
      fetchUsers();
      fetchInverterTotals();
      fetchGroupedClients();

      // Disable the button for 15 minutes (900 seconds)
      setRefreshDisabled(true);
      setCooldownTime(900);
      localStorage.setItem("refreshCooldownUntil", Date.now() + 900000);

      alert("Sync started successfully!");
    } catch (err) {
      alert("Refresh failed: " + err.message);
    }
  };

  // Fetch users when page or search changes
  useEffect(() => {
    fetchUsers();
    fetchInverterTotals();
    fetchGroupedClients();

    // Refresh button countdown timer
     

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

// Refresh button countdown timer
useEffect(() => {
  const savedTimestamp = localStorage.getItem("refreshCooldownUntil");

  if (savedTimestamp) {
    const remaining = Math.floor((savedTimestamp - Date.now()) / 1000);

    if (remaining > 0) {
      setRefreshDisabled(true);
      setCooldownTime(remaining);
    }
  }

  const interval = setInterval(() => {
    setCooldownTime(prev => {
      if (prev <= 1) {
        setRefreshDisabled(false);
        localStorage.removeItem("refreshCooldownUntil");
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, []);



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

  // Format time for "last refreshed at"
const getFormattedTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
};

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
    const targetUser =
      displayedUsers.find((u) => u.id === userId) ||
      users.find((u) => u.id === userId);
  
    if (!targetUser) return;
  
    const previousSnapshot = { ...targetUser };
  
    const nextFlags = {
      whatsapp_notification_flag: targetUser.whatsapp_notification_flag ?? 0,
      inverter_fault_flag: targetUser.inverter_fault_flag ?? 0,
      daily_generation_report_flag: targetUser.daily_generation_report_flag ?? 0,
      weekly_generation_report_flag: targetUser.weekly_generation_report_flag ?? 0,
      monthly_generation_report_flag: targetUser.monthly_generation_report_flag ?? 0,
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
  
    // Update groupedClients for instant UI
    setGroupedClients(prev => {
      const updateList = (list) =>
        list.map(item => item.id === userId ? { ...item, ...nextFlags } : item);
  
      return {
        all_plant: updateList(prev.all_plant || []),
        normal_plant: updateList(prev.normal_plant || []),
        alarm_plant: updateList(prev.alarm_plant || []),
        offline_plant: updateList(prev.offline_plant || []),
      };
    });
  
    // Update users state
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...nextFlags } : u))
    );
  
    try {
      await updateFlagsAPI(userId, nextFlags);
    } catch (err) {
      console.error("Failed to update API", err);
  
      // Rollback UI
      setGroupedClients(prev => {
        const rollback = (list) =>
          list.map(item => item.id === userId ? previousSnapshot : item);
  
        return {
          all_plant: rollback(prev.all_plant),
          normal_plant: rollback(prev.normal_plant),
          alarm_plant: rollback(prev.alarm_plant),
          offline_plant: rollback(prev.offline_plant),
        };
      });
  
      setUsers(prev =>
        prev.map(u => (u.id === userId ? previousSnapshot : u))
      );
    }
  };
  
  
  

  const updateFlagsAPI = async (userId, values) => {
    const normalizedValues = {
      whatsapp_notification_flag: values.whatsapp_notification_flag ? 1 : 0,
      inverter_fault_flag: values.inverter_fault_flag ? 1 : 0,
      daily_generation_report_flag: values.daily_generation_report_flag ? 1 : 0,
      weekly_generation_report_flag: values.weekly_generation_report_flag
        ? 1
        : 0,
      monthly_generation_report_flag: values.monthly_generation_report_flag
        ? 1
        : 0,
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

  // POST API: set company code (Assign Code popup)
  const updateCompanyCode = async (userId, companyCode) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    if (!token) {
      alert("No authentication token found");
      return;
    }

    const url = `${API_BASE_ROOT}/client/company-code`;
    let finalCompanyCode = companyCode;

    // If admin left blank, set NULL
    if (
      companyCode === "" ||
      companyCode === " " ||
      companyCode === null ||
      companyCode === undefined
    ) {
      finalCompanyCode = null;
    }

    const payload = {
      id: userId,
      company_code: finalCompanyCode,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update company code");
      }

      alert("Company code updated successfully");
      // Update UI immediately
      setUsers((prev) =>
        prev.map((user) =>
          user.id == userId ? { ...user, company_code: finalCompanyCode } : user
        )
      );

      setShowCompanyPopup(false);
      setPopupUserId("");
      setPopupCompanyCode("");
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
  };

  const openCompanyCodeModal = (user) => {
    if (!user || !user.id) return;
    setSelectedUserId(user.id);
    setCompanyCodeInput(user.company_code ?? "");
    setShowCompanyModal(true);
  };

  // Qbits modal opener
  const openQbitsCodeModal = (user) => {
    if (!user || !user.id) return;
    setSelectedQbitsUserId(user.id);
    setQbitsCodeInput(user.qbits_company_code ?? "");
    setShowQbitsModal(true);
  };

  const sendQbitsCodeUpdate = async (rawValue) => {
    if (!selectedQbitsUserId) return false;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    if (!token) {
      alert("No authentication token found");
      return false;
    }

    const finalValue = rawValue === null || rawValue === "" ? null : rawValue;

    // backend expects company_code, so send that
    const payload = {
      id: selectedQbitsUserId,
      company_code: finalValue, // FIXED HERE
    };

    setQbitsModalLoading(true);

    try {
      const response = await fetch(`${API_BASE_ROOT}/client/set-company-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || `HTTP ${response.status}`);
      }

      // Update frontend
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedQbitsUserId
            ? { ...user, qbits_company_code: finalValue }
            : user
        )
      );

      return true;
    } catch (err) {
      alert("Failed to update Qbits code: " + err.message);
      return false;
    } finally {
      setQbitsModalLoading(false);
    }
  };

  const submitQbitsCode = async () => {
    const success = await sendQbitsCodeUpdate(qbitsCodeInput);
    if (success) closeQbitsModal();
  };

  const clearQbitsCode = async () => {
    const success = await sendQbitsCodeUpdate(null);
    if (success) closeQbitsModal();
  };

  const closeQbitsModal = () => {
    setShowQbitsModal(false);
    setSelectedQbitsUserId(null);
    setQbitsCodeInput("");
  };

  const closeCompanyCodeModal = () => {
    setShowCompanyModal(false);
    setSelectedUserId(null);
    setCompanyCodeInput("");
  };

  const sendCompanyCodeUpdate = async (rawValue) => {
    if (!selectedUserId) {
      return false;
    }

    if (!API_BASE_ROOT) {
      alert("API base URL is not configured");
      return false;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    if (!token) {
      alert("No authentication token found");
      return false;
    }

    const finalValue = rawValue === null || rawValue === "" ? null : rawValue;

    const payload = {
      id: selectedUserId,
      company_code: finalValue,
    };

    setCompanyModalLoading(true);
    try {
      const response = await fetch(`${API_BASE_ROOT}/client/set-company-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let responseBody = null;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }

      if (!response.ok) {
        const message =
          (responseBody && responseBody.message) || `HTTP ${response.status}`;
        throw new Error(message);
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUserId
            ? { ...user, company_code: finalValue }
            : user
        )
      );
      return true;
    } catch (err) {
      alert("Failed to update: " + err.message);
      return false;
    } finally {
      setCompanyModalLoading(false);
    }
  };

  const submitCompanyCode = async () => {
    const success = await sendCompanyCodeUpdate(companyCodeInput);
    if (success) {
      closeCompanyCodeModal();
    }
  };

  const clearCompanyCode = async () => {
    const success = await sendCompanyCodeUpdate(null);
    if (success) {
      closeCompanyCodeModal();
    }
  };

  // Decide which grouped list to show in the table
  let displayedUsers = [];

  // Here we map your tab names to API keys
  // standby = Total, normal = Normal, warning = Fault, fault = Offline

  if (selectedStatus === "normal") {
    displayedUsers = groupedClients.normal_plant;
  } else if (selectedStatus === "warning") {
    displayedUsers = groupedClients.alarm_plant;
  } else if (selectedStatus === "fault") {
    displayedUsers = groupedClients.offline_plant;
  } else {
    // Default and when Total is clicked (standby)
    displayedUsers = groupedClients.all_plant;
  }

  return (
    <div className="user-list-page-alluser">
      <div className="ul-card-allusers">
        <div className="ul-header">
          <div className="ul-header-text">
            <h5 className="ul-title">User List – All Users</h5>
            <p className="ul-subtitle">All users management and listing.</p>
            <button
              className="refresh-btn"
              onClick={runInverterCommand}
              disabled={refreshDisabled}
            >
              {refreshDisabled
                ? `⟳ Refresh in ${Math.floor(cooldownTime / 60)}:${(
                    cooldownTime % 60
                  )
                    .toString()
                    .padStart(2, "0")}`
                : "⟳ Refresh"}
            </button>
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
              <div className="status-box-container">
                {/* 1. TOTAL */}
                <div
                  className={`status-card standby ${
                    selectedStatus === "standby" ? "active" : ""
                  }`}
                  onClick={() => setSelectedStatus("standby")}
                >
                  <div className="status-left">
                    <div className="status-icon">✔</div>
                    <div>
                      <div className="status-title">Total</div>
                      <div className="status-sub">Live Update</div>
                    </div>
                  </div>
                  <div className="status-percent">
                    {inverterTotals.total_all_plant}
                  </div>
                </div>

                {/* 2. NORMAL */}
                <div
                  className={`status-card normal ${
                    selectedStatus === "normal" ? "active" : ""
                  }`}
                  onClick={() => setSelectedStatus("normal")}
                >
                  <div className="status-left">
                    <div className="status-icon">●</div>
                    <div className="status-title">Normal</div>
                  </div>
                  <div className="status-percent">
                    {inverterTotals.total_normal_plant}
                  </div>
                </div>

                {/* 3. FAULT */}
                <div
                  className={`status-card warning ${
                    selectedStatus === "warning" ? "active" : ""
                  }`}
                  onClick={() => setSelectedStatus("warning")}
                >
                  <div className="status-left">
                    <div className="status-icon">▲</div>
                    <div>
                      <div className="status-title">Fault</div>
                      <div className="status-sub">Live Update</div>
                    </div>
                  </div>
                  <div className="status-percent">
                    {inverterTotals.total_alarm_plant}
                  </div>
                </div>

                {/* 4. OFFLINE */}
                <div
                  className={`status-card fault ${
                    selectedStatus === "fault" ? "active" : ""
                  }`}
                  onClick={() => setSelectedStatus("fault")}
                >
                  <div className="status-left">
                    <div className="status-icon">⚠</div>
                    <div>
                      <div className="status-title">Offline</div>
                      <div className="status-sub">Live Update</div>
                    </div>
                  </div>
                  <div className="status-percent">
                    {inverterTotals.total_offline_plant}
                  </div>
                </div>
              </div>

              <div className="table-scroll-container">
                <div className="table-inner-force-allusers">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>ID</th>
                        {/*<th>Company Code</th> */}
                        <th>Company code</th>
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
                      {displayedUsers && displayedUsers.length > 0 ? (
                        displayedUsers.map((u, index) => (
                          <tr key={u.id ?? index}>
                            <td>{index + 1}</td>
                            <td>{u.id ?? "N/A"}</td>
                            {/* <td
                                onClick={() => openCompanyCodeModal(u)}
                                className="company-code-cell"
                              >
                                {u.company_code ?? "N/A"}
                              </td>*/}

                            <td
                              onClick={() => openQbitsCodeModal(u)}
                              className="company-code-cell"
                            >
                              {u.qbits_company_code ?? "N/A"}
                            </td>
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
                                    handleFlagToggle(
                                      u.id,
                                      "whatsapp_notification_flag",
                                      e.target.checked
                                    )
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
                                    handleFlagToggle(
                                      u.id,
                                      "inverter_fault_flag",
                                      e.target.checked
                                    )
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
                                    handleFlagToggle(
                                      u.id,
                                      "daily_generation_report_flag",
                                      e.target.checked
                                    )
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
                                    handleFlagToggle(
                                      u.id,
                                      "weekly_generation_report_flag",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            </td>
                            <td className="flag-toggle-cell">
                              <label className="toggle-switch">
                                <input
                                  type="checkbox"
                                  checked={
                                    u.monthly_generation_report_flag == 1
                                  }
                                  disabled={u.whatsapp_notification_flag != 1}
                                  onChange={(e) =>
                                    handleFlagToggle(
                                      u.id,
                                      "monthly_generation_report_flag",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            </td>
                            <td>{formatDate(u.created_at)}</td>
                            <td>{formatDate(u.updated_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={21}
                            style={{ textAlign: "center", padding: "16px" }}
                          >
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


      {showQbitsModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!qbitsModalLoading) closeQbitsModal();
          }}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Update Qbits Company Code</h3>
            <input
              type="text"
              className="modal-input"
              value={qbitsCodeInput}
              onChange={(e) => setQbitsCodeInput(e.target.value)}
              placeholder="Enter Qbits company code"
              disabled={qbitsModalLoading}
            />

            <div className="modal-buttons">
              <button
                type="button"
                className="save-btn"
                onClick={submitQbitsCode}
                disabled={qbitsModalLoading}
              >
                Save
              </button>

              <button
                type="button"
                className="close-btn"
                onClick={closeQbitsModal}
                disabled={qbitsModalLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
