"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import "./AllUsers.css";

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
const GROUPED_CLIENTS_PER_PAGE = 200;
let inverterTotalsLock = false;

export default function AllUsers() {
  const router = useRouter();
  const fetchLock = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   
   
  const [tablePage, setTablePage] = useState(1);
  const rowsPerPage = 25;
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Inverter type filter states
  const inverterTypes = [
    "QB-2KTLS",
    "QB-2.7KTLS",
    "QB-3KTLS",
    "QB-3.3KTLS",
    "QB-3.6KTLS",
    "QB-4KTLS",
    "QB-4.2KTLD",
    "QB-5KTLD",
    "QB-5.3KTLD",
    "QB-6KTLC",
    "QB-6KTLD",
    "QB-8KTLC",
    "QB-10KTLC",
    "QB-12KTLC",
    "QB-15KTLC",
    "QB-17KTLC",
    "QB-20KTLC",
    "QB-25KTLC",
    "QB-28KTLC",
    "QB-30KTLC",
  ];

  const [selectedInverter, setSelectedInverter] = useState("");
  const [inverterSearch, setInverterSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMenuPos, setFilterMenuPos] = useState({ top: 0, left: 0 });

  // City filter states
  const [selectedCity, setSelectedCity] = useState("");
  const [cityList, setCityList] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [isCityFilterOpen, setIsCityFilterOpen] = useState(false);
  const [cityFilterMenuPos, setCityFilterMenuPos] = useState({ top: 0, left: 0 });
  const cityFilterButtonRef = useRef(null);
  const cityFilterMenuRef = useRef(null);

  // Plant type filter states
  const [selectedPlantType, setSelectedPlantType] = useState("");
  const [isPlantTypeFilterOpen, setIsPlantTypeFilterOpen] = useState(false);
  const [plantTypeFilterMenuPos, setPlantTypeFilterMenuPos] = useState({ top: 0, left: 0 });
  const plantTypeFilterButtonRef = useRef(null);
  const plantTypeFilterMenuRef = useRef(null);

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
  // Status filter UI state (default to Total tab "standby"), persisted across reloads
  const [selectedStatus, setSelectedStatus] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userListSelectedStatus") || "standby";
    }
    return "standby";
  });
  const [sortConfig, setSortConfig] = useState({
    field: "id",
    direction: "desc",
  });
  // ADD THIS HERE
  const [inverterTotals, setInverterTotals] = useState({
    total_all_plant: 0,
    total_normal_plant: 0,
    total_alarm_plant: 0,
    total_offline_plant: 0,
  });

  // Refresh button states
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [groupedClients, setGroupedClients] = useState({
    all_plant: [],
    normal_plant: [],
    alarm_plant: [],
    offline_plant: [],
  });
  const filterButtonRef = useRef(null);
  const filterMenuRef = useRef(null);
  const [isFlagMenuOpen, setIsFlagMenuOpen] = useState(false);
  const flagMenuRef = useRef(null);
  const flagMenuButtonRef = useRef(null);
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());
  const [flagMenuPos, setFlagMenuPos] = useState({ top: 0, left: 0 });
  const selectAllRef = useRef(null);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const updateFlagMenuPosition = useCallback(() => {
    if (typeof window === "undefined" || !flagMenuButtonRef.current) return;
    const rect = flagMenuButtonRef.current.getBoundingClientRect();
    setFlagMenuPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  }, []);

  const updateFilterMenuPosition = useCallback(() => {
    if (typeof window === "undefined" || !filterButtonRef.current) return;
    const rect = filterButtonRef.current.getBoundingClientRect();
    setFilterMenuPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  }, []);

  const closeFilterMenu = useCallback(() => {
    setIsFilterOpen(false);
    setInverterSearch("");
  }, []);

  const handleFilterIconClick = () => {
    if (isFilterOpen) {
      closeFilterMenu();
    } else {
      updateFilterMenuPosition();
      setIsFilterOpen(true);
    }
  };

  const handleInverterFilterSelect = (value) => {
    setSelectedInverter(value);
    setTablePage(1);
    closeFilterMenu();
  };

  // Plant type label helper
  function getPlantTypeLabel(v) {
    if (v == 0) return "Solar System";
    if (v == 1) return "Battery Storage";
    if (v == 2) return "Solar with Limitation";
    return "N/A";
  }

  // City filter handlers
  const updateCityFilterMenuPosition = useCallback(() => {
    if (typeof window === "undefined" || !cityFilterButtonRef.current) return;
    const rect = cityFilterButtonRef.current.getBoundingClientRect();
    setCityFilterMenuPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  }, []);

  const closeCityFilterMenu = useCallback(() => {
    setIsCityFilterOpen(false);
    setCitySearch("");
  }, []);

  const handleCityFilterIconClick = () => {
    if (isCityFilterOpen) {
      closeCityFilterMenu();
    } else {
      updateCityFilterMenuPosition();
      setIsCityFilterOpen(true);
    }
  };

  const handleCityFilterSelect = (value) => {
    setSelectedCity(value);
    setTablePage(1);
    closeCityFilterMenu();
  };

  // Plant type filter handlers
  const updatePlantTypeFilterMenuPosition = useCallback(() => {
    if (typeof window === "undefined" || !plantTypeFilterButtonRef.current) return;
    const rect = plantTypeFilterButtonRef.current.getBoundingClientRect();
    setPlantTypeFilterMenuPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  }, []);

  const closeFlagMenu = useCallback(() => {
    setIsFlagMenuOpen(false);
  }, []);

  const handleFlagMenuToggle = () => {
    if (isFlagMenuOpen) {
      closeFlagMenu();
    } else {
      updateFlagMenuPosition();
      setIsFlagMenuOpen(true);
    }
  };

  useEffect(() => {
    if (!isFlagMenuOpen) return;

    const handleClickOutside = (event) => {
      if (
        flagMenuButtonRef.current?.contains(event.target) ||
        flagMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      closeFlagMenu();
    };

    const handleViewportChange = () => {
      updateFlagMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [isFlagMenuOpen, closeFlagMenu, updateFlagMenuPosition]);

  const handleRowCheckboxChange = (userId, checked) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handleSelectAllChange = (checked, visibleUsers) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      visibleUsers.forEach((u) => {
        if (checked) {
          next.add(u.id);
        } else {
          next.delete(u.id);
        }
      });
      return next;
    });
  };

  const closePlantTypeFilterMenu = useCallback(() => {
    setIsPlantTypeFilterOpen(false);
  }, []);

  const handlePlantTypeFilterIconClick = () => {
    if (isPlantTypeFilterOpen) {
      closePlantTypeFilterMenu();
    } else {
      updatePlantTypeFilterMenuPosition();
      setIsPlantTypeFilterOpen(true);
    }
  };

  const handlePlantTypeFilterSelect = (value) => {
    setSelectedPlantType(value);
    setTablePage(1);
    closePlantTypeFilterMenu();
  };

  // Username sort key helper: groups letters, then digits, then others
  const getUsernameSortKey = (rawName) => {
    const name = (rawName || "").trim();
    if (!name) {
      return { group: 2, value: "" };
    }

    const first = name[0].toLowerCase();

    // group 0: letters (a-z)
    if (first >= "a" && first <= "z") {
      return { group: 0, value: name.toLowerCase() };
    }

    // group 1: digits (0-9)
    if (first >= "0" && first <= "9") {
      return { group: 1, value: name.toLowerCase() };
    }

    // group 2: others (symbols, etc.)
    return { group: 2, value: name.toLowerCase() };
  };

  // Sort handler: toggle direction if same column, else set new column with default direction
  const handleSort = (field) => {
    setTablePage(1);
    setSortConfig((prev) => {
      if (prev.field === field) {
        const nextDirection = prev.direction === "asc" ? "desc" : "asc";
        return { field, direction: nextDirection };
      }

      // Default to ascending for most fields
      return { field, direction: "asc" };
    });
  };

  // Helper: convert date string to timestamp
  const toDate = (value) => {
    if (!value) return 0;
    return new Date(value).getTime();
  };

  // Sort data function: applies sorting based on sortConfig
  const sortData = (data) => {
    const sorted = [...data];

    if (!sortConfig.field) return sorted;

    const { field, direction } = sortConfig;

    sorted.sort((a, b) => {
      // ID: simple numeric
      if (field === "id") {
        const va = Number(a.id) || 0;
        const vb = Number(b.id) || 0;
        return direction === "asc" ? va - vb : vb - va;
      }

      // Username: A-Z then numbers ordering
      if (field === "username") {
        const ka = getUsernameSortKey(a.username);
        const kb = getUsernameSortKey(b.username);

        if (ka.group !== kb.group) {
          return direction === "asc" ? ka.group - kb.group : kb.group - ka.group;
        }

        const cmp = ka.value.localeCompare(kb.value);
        return direction === "asc" ? cmp : -cmp;
      }

      // Password: string comparison
      if (field === "password") {
        const va = (a.password || "").toLowerCase();
        const vb = (b.password || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Company code: string comparison
      if (field === "company_code") {
        const va = (a.company_code || "").toLowerCase();
        const vb = (b.company_code || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Email: string comparison
      if (field === "email") {
        const va = (a.email || "").toLowerCase();
        const vb = (b.email || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Plant name: string comparison
      if (field === "plant_name") {
        const va = (a.plant_name || "").toLowerCase();
        const vb = (b.plant_name || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // City name: string comparison
      if (field === "city_name") {
        const va = (a.city_name || "").toLowerCase();
        const vb = (b.city_name || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Collector: string comparison
      if (field === "collector") {
        const va = (a.collector || "").toLowerCase();
        const vb = (b.collector || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Longitude: numeric
      if (field === "longitude") {
        const va = parseFloat(a.longitude) || 0;
        const vb = parseFloat(b.longitude) || 0;
        return direction === "asc" ? va - vb : vb - va;
      }

      // Latitude: numeric
      if (field === "latitude") {
        const va = parseFloat(a.latitude) || 0;
        const vb = parseFloat(b.latitude) || 0;
        return direction === "asc" ? va - vb : vb - va;
      }

      // Power (Keep live power): numeric
      if (field === "power") {
        const va = parseFloat(a.power) || 0;
        const vb = parseFloat(b.power) || 0;
        return direction === "asc" ? va - vb : vb - va;
      }

      // Capacity: numeric
      if (field === "capacity") {
        const va = parseFloat(a.capacity) || 0;
        const vb = parseFloat(b.capacity) || 0;
        return direction === "asc" ? va - vb : vb - va;
      }

      // Day production numeric
      if (field === "day_power") {
        const va = parseFloat(a.day_power) || 0;
        const vb = parseFloat(b.day_power) || 0;
        return direction === "asc" ? va - vb : vb - va;
      }

      // Total production numeric
      if (field === "total_power") {
        const va = parseFloat(a.total_power) || 0;
        const vb = parseFloat(b.total_power) || 0;
        return direction === "asc" ? va - vb : vb - va;
      }

      // Created at: date comparison
      if (field === "created_at") {
        const da = toDate(a.created_at);
        const db = toDate(b.created_at);
        return direction === "asc" ? da - db : db - da;
      }

      // Updated at: date comparison
      if (field === "updated_at") {
        const da = toDate(a.updated_at);
        const db = toDate(b.updated_at);
        return direction === "asc" ? da - db : db - da;
      }

      // GMT: string comparison
      if (field === "gmt") {
        const va = (a.gmt || "").toLowerCase();
        const vb = (b.gmt || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Plant Type: string comparison
      if (field === "plant_type") {
        const va = (a.plant_type || "").toLowerCase();
        const vb = (b.plant_type || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Iserial: string comparison
      if (field === "iserial") {
        const va = (a.iserial || "").toLowerCase();
        const vb = (b.iserial || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      // Inverter Type: string comparison
      if (field === "inverter_type") {
        const va = (a.inverter_type || "").toLowerCase();
        const vb = (b.inverter_type || "").toLowerCase();
        const cmp = va.localeCompare(vb);
        return direction === "asc" ? cmp : -cmp;
      }

      return 0;
    });

    return sorted;
  };

  // Fetch users from API
   

  // 👉 PASTE HERE
  const fetchInverterTotals = async () => {
    if (inverterTotalsLock) {
      return;
    }
    
    inverterTotalsLock = true;
    
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
    } finally {
      setTimeout(() => { inverterTotalsLock = false; }, 200);
    }
  };

  const fetchGroupedClients = async () => {
    if (fetchLock.current) {
      return;
    }
    
    fetchLock.current = true;
    setLoading(true);
    setError(null);
  
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
  
      if (!token) {
        setError("No authentication token");
        setLoading(false);
        return;
      }
  
      const url = `${API_BASE_ROOT}/client/grouped-clients?search=${search}&per_page=${GROUPED_CLIENTS_PER_PAGE}&page_all=1&page_normal=1&page_alarm=1&page_offline=1`;
  
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
  
      const json = await response.json();
  
      setGroupedClients({
        all_plant: json.data?.all_plant?.data || [],
        normal_plant: json.data?.normal_plant?.data || [],
        alarm_plant: json.data?.alarm_plant?.data || [],
        offline_plant: json.data?.offline_plant?.data || [],
      });
    } catch (err) {
      setError("Failed to load user list");
    } finally {
      setLoading(false);
      setTimeout(() => { fetchLock.current = false; }, 150);
    }
  };
  

  // Call Refresh/Sync API
  const runInverterCommand = async () => {
    if (isRefreshing) return;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      if (!token) {
        alert("No authentication token found");
        return;
      }

      setIsRefreshing(true);

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
      
      fetchInverterTotals();
      fetchGroupedClients();

      console.info("Sync command triggered successfully.");
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch users when page or search changes
  useEffect(() => {
    fetchInverterTotals();
    fetchGroupedClients();
  
  

    // Refresh button countdown timer

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
      hour12: true,
    });
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    const normalizedInput = searchInput.trim();

    const handler = setTimeout(() => {
      if (normalizedInput === search) return;
      
      setSearch(normalizedInput);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, search]);

  const handleTablePrevious = () => {
    setTablePage((prev) => Math.max(1, prev - 1));
  };

  const handleTableNext = (totalTablePages) => {
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

  

  const handleFlagToggle = async (userId, field, isEnabled) => {
    const targetUser = displayedUsers.find((u) => u.id === userId);


    if (!targetUser) return;

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

    // Update groupedClients for instant UI
    setGroupedClients((prev) => {
      const updateList = (list) =>
        list.map((item) =>
          item.id === userId ? { ...item, ...nextFlags } : item
        );

      return {
        all_plant: updateList(prev.all_plant || []),
        normal_plant: updateList(prev.normal_plant || []),
        alarm_plant: updateList(prev.alarm_plant || []),
        offline_plant: updateList(prev.offline_plant || []),
      };
    });

    // Update users state
     

    try {
      await updateFlagsAPI(userId, nextFlags);
    } catch (err) {
      console.error("Failed to update API", err);

      // Rollback UI
      setGroupedClients((prev) => {
        const rollback = (list) =>
          list.map((item) => (item.id === userId ? previousSnapshot : item));

        return {
          all_plant: rollback(prev.all_plant),
          normal_plant: rollback(prev.normal_plant),
          alarm_plant: rollback(prev.alarm_plant),
          offline_plant: rollback(prev.offline_plant),
        };
      });

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

  useEffect(() => {
    if (!isFilterOpen) return;

    const handleClickOutside = (event) => {
      if (
        filterButtonRef.current?.contains(event.target) ||
        filterMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      closeFilterMenu();
    };

    const handleViewportChange = () => {
      updateFilterMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [isFilterOpen, closeFilterMenu, updateFilterMenuPosition]);

  // City filter menu event listeners
  useEffect(() => {
    if (!isCityFilterOpen) return;

    const handleClickOutside = (event) => {
      if (
        cityFilterButtonRef.current?.contains(event.target) ||
        cityFilterMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      closeCityFilterMenu();
    };

    const handleViewportChange = () => {
      updateCityFilterMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [isCityFilterOpen, closeCityFilterMenu, updateCityFilterMenuPosition]);

  // Plant type filter menu event listeners
  useEffect(() => {
    if (!isPlantTypeFilterOpen) return;

    const handleClickOutside = (event) => {
      if (
        plantTypeFilterButtonRef.current?.contains(event.target) ||
        plantTypeFilterMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      closePlantTypeFilterMenu();
    };

    const handleViewportChange = () => {
      updatePlantTypeFilterMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [isPlantTypeFilterOpen, closePlantTypeFilterMenu, updatePlantTypeFilterMenuPosition]);

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

  const normalizedSearchTerm = searchInput.trim().toLowerCase();

  const filteredUsersRaw = normalizedSearchTerm
    ? displayedUsers.filter((user) => {
        const idValue = String(user.id ?? "").toLowerCase();
        const usernameValue = (user.username ?? "").toLowerCase();
        const phoneValue = (user.phone ?? "").toLowerCase();
        const emailValue = (user.email ?? "").toLowerCase();
        const companyCodeValue = (user.company_code ?? "").toLowerCase();
        const collectorValue = (user.collector ?? "").toLowerCase();
        return [
          idValue,
          usernameValue,
          phoneValue,
          emailValue,
          companyCodeValue,
          collectorValue,
        ].some((field) => field.includes(normalizedSearchTerm));
      })
    : displayedUsers;

  const filteredUsers = sortData(filteredUsersRaw);

  // Apply city filter
  const cityFilteredUsers = selectedCity
    ? filteredUsers.filter(u => u.city_name === selectedCity)
    : filteredUsers;

  // Apply plant type filter
  const plantTypeFilteredUsers = selectedPlantType !== ""
    ? cityFilteredUsers.filter(u => String(u.plant_type) === String(selectedPlantType))
    : cityFilteredUsers;

  // Apply inverter filter to paginated results
  const inverterFilteredUsers = selectedInverter
    ? plantTypeFilteredUsers.filter((u) => u.inverter_type === selectedInverter)
    : plantTypeFilteredUsers;

  // Check if any filter is active (only non-empty selections count as filters)
  const hasFilter =
    (selectedInverter && selectedInverter.trim() !== "") ||
    (selectedCity && selectedCity.trim() !== "") ||
    (selectedPlantType !== null &&
     selectedPlantType !== undefined &&
     selectedPlantType !== "");

  // Debug logging
  console.log("CHECK FILTER STATE", {
    inverter: selectedInverter,
    city: selectedCity,
    plantType: selectedPlantType,
    hasFilter
  });

  // Determine effective rows per page based on filter mode
  const effectiveRowsPerPage = hasFilter ? inverterFilteredUsers.length : rowsPerPage;
  const totalTablePages = Math.max(1, Math.ceil(inverterFilteredUsers.length / effectiveRowsPerPage));
  const rowStartIndex = (tablePage - 1) * effectiveRowsPerPage;
  const paginatedUsers = inverterFilteredUsers.slice(
    rowStartIndex,
    rowStartIndex + effectiveRowsPerPage
  );


  useEffect(() => {
    setTablePage(1);
  }, [selectedStatus, search, searchInput, groupedClients, selectedInverter, selectedCity, selectedPlantType]);

  useEffect(() => {
    if (hasFilter && tablePage !== 1) {
      setTablePage(1);
    }
  }, [hasFilter, tablePage]);

  useEffect(() => {
    const visibleIds = paginatedUsers.map((u) => u.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedUserIds.has(id));
    const someSelected =
      visibleIds.some((id) => selectedUserIds.has(id)) && !allSelected;
    setSelectAllChecked(allSelected);
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [paginatedUsers, selectedUserIds]);

  useEffect(() => {
    if (typeof window !== "undefined" && selectedStatus) {
      localStorage.setItem("userListSelectedStatus", selectedStatus);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedInverter = localStorage.getItem("userListSelectedInverter");
    if (savedInverter !== null) {
      setSelectedInverter(savedInverter);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userListSelectedInverter", selectedInverter);
    }
  }, [selectedInverter]);

  // Generate unique city list from displayed users
  useEffect(() => {
    const all = displayedUsers.map(u => u.city_name).filter(Boolean);
    const unique = [...new Set(all)].sort();
    setCityList(unique);
  }, [displayedUsers]);

  const filteredInverterList = inverterTypes.filter(type =>
    type.toLowerCase().includes(inverterSearch.toLowerCase())
  );

  const filterMenu =
    isFilterOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={filterMenuRef}
            className="inverter-filter-menu"
            style={{
              top: filterMenuPos.top,
              left: filterMenuPos.left,
            }}
          >
            <div className="filter-menu-header">Inverter Type</div>
            <div className="city-search-input-wrapper">
              <input
                type="text"
                className="city-search-input"
                placeholder="Search inverters..."
                value={inverterSearch}
                onChange={(e) => setInverterSearch(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="button"
              className={`filter-menu-option ${
                selectedInverter === "" ? "active" : ""
              }`}
              onClick={() => handleInverterFilterSelect("")}
            >
              Show All
            </button>
            <div className="filter-menu-divider" />
            {filteredInverterList.map((type) => (
              <button
                key={type}
                type="button"
                className={`filter-menu-option ${
                  selectedInverter === type ? "active" : ""
                }`}
                onClick={() => handleInverterFilterSelect(type)}
              >
                {type}
                {selectedInverter === type && (
                  <span className="filter-menu-check">✓</span>
                )}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  // City filter menu
  const filteredCityList = cityList.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const cityFilterMenu =
    isCityFilterOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={cityFilterMenuRef}
            className="inverter-filter-menu"
            style={{
              top: cityFilterMenuPos.top,
              left: cityFilterMenuPos.left,
            }}
          >
            <div className="filter-menu-header">City</div>
            <div className="city-search-input-wrapper">
              <input
                type="text"
                className="city-search-input"
                placeholder="Search cities..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="button"
              className={`filter-menu-option ${
                selectedCity === "" ? "active" : ""
              }`}
              onClick={() => handleCityFilterSelect("")}
            >
              Show All
            </button>
            <div className="filter-menu-divider" />
            {filteredCityList.map((city) => (
              <button
                key={city}
                type="button"
                className={`filter-menu-option ${
                  selectedCity === city ? "active" : ""
                }`}
                onClick={() => handleCityFilterSelect(city)}
              >
                {city}
                {selectedCity === city && (
                  <span className="filter-menu-check">✓</span>
                )}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  // Plant type filter menu
  const plantTypeFilterMenu =
    isPlantTypeFilterOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={plantTypeFilterMenuRef}
            className="inverter-filter-menu"
            style={{
              top: plantTypeFilterMenuPos.top,
              left: plantTypeFilterMenuPos.left,
            }}
          >
            <div className="filter-menu-header">Plant Type</div>
            <button
              type="button"
              className={`filter-menu-option ${
                selectedPlantType === "" ? "active" : ""
              }`}
              onClick={() => handlePlantTypeFilterSelect("")}
            >
              Show All
            </button>
            <div className="filter-menu-divider" />
            {[
              { label: "Solar System", value: "0" },
              { label: "Battery Storage", value: "1" },
              { label: "Solar with Limitation", value: "2" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                className={`filter-menu-option ${
                  selectedPlantType === type.value ? "active" : ""
                }`}
                onClick={() => handlePlantTypeFilterSelect(type.value)}
              >
                {type.label}
                {selectedPlantType === type.value && (
                  <span className="filter-menu-check">✓</span>
                )}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  const flagActionOptions = [
    { key: "whatsapp_notification_flag", label: "Whatsapp Flag" },
    { key: "inverter_fault_flag", label: "Inverter Fault" },
    { key: "daily_generation_report_flag", label: "Daily Gen" },
    { key: "weekly_generation_report_flag", label: "Weekly Gen" },
    { key: "monthly_generation_report_flag", label: "Monthly Gen" },
  ];

  const bulkToggleFlag = async (flagKey, enabled) => {
    const ids = Array.from(selectedUserIds);
    if (!ids.length) {
      alert("Select at least one user first.");
      return;
    }
    for (const id of ids) {
      await handleFlagToggle(id, flagKey, enabled);
    }
  };

  const flagMenu =
    isFlagMenuOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={flagMenuRef}
            className="flag-menu"
            style={{
              top: flagMenuPos.top,
              left: flagMenuPos.left,
            }}
          >
            <div className="filter-menu-header">Flags – apply to selected users</div>
            <div className="flag-menu-body">
              {flagActionOptions.map((opt) => (
                <div key={opt.key} className="flag-menu-row">
                  <span className="flag-menu-label">{opt.label}</span>
                  <div className="flag-menu-actions">
                    <button
                      type="button"
                      className="flag-menu-action-btn on"
                      onClick={() => bulkToggleFlag(opt.key, true)}
                    >
                      On
                    </button>
                    <button
                      type="button"
                      className="flag-menu-action-btn off"
                      onClick={() => bulkToggleFlag(opt.key, false)}
                    >
                      Off
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  // Reusable sortable header component
  function SortableHeader({ label, field }) {
    const isActive = sortConfig.field === field;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <button
        type="button"
        className={`th-sortable ${isActive ? "th-sortable-active" : ""}`}
        onClick={() => handleSort(field)}
      >
        <span className="th-label">{label}</span>
        <span className={`th-icon ${direction === "asc" ? "asc" : direction === "desc" ? "desc" : ""}`}>
          ▲
        </span>
      </button>
    );
  }

  // Auto-detect most likely ID field for the plant API
  function getPlantApiId(user) {
    if (user.user_id) return user.user_id;
    if (user.plant_no) return user.plant_no;
    if (user.qbits_user_id) return user.qbits_user_id;
    if (user.client_id) return user.client_id;
    if (user.uid) return user.uid;
    return user.id;
  }

  return (
    <div className="user-list-page-alluser">
      <div className="ul-card-allusers">
        <div className="ul-header">
          <div className="ul-header-text">
            <h5 className="ul-title">User List – All Users</h5>
             
            <button
              className="refresh-btn"
              onClick={runInverterCommand}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing…" : "⟳ Refresh"}
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
                placeholder="Search by username, company code, collector..."
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
          </form>
        </div>
        <div className="ul-body">
          <div className="table-actions flag-actions">
            <button
              type="button"
              ref={flagMenuButtonRef}
              className={`column-visibility-btn ${isFlagMenuOpen ? "active" : ""}`}
              aria-label="Toggle flag columns"
              aria-expanded={isFlagMenuOpen}
              onClick={handleFlagMenuToggle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6H20" />
                <path d="M4 12H14" />
                <path d="M4 18H10" />
              </svg>
            </button>
            <span className="flag-actions-label"></span>
          </div>
          {loading ? (
            <div className="ul-empty">
              <p className="ul-muted">Loading users...</p>
            </div>
          ) : error ? (
            <div className="ul-error" role="alert">
              {error}
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
                        <th className="sticky-col col-check">
                          <label className="row-checkbox">
                            <input
                              ref={selectAllRef}
                              type="checkbox"
                              checked={selectAllChecked}
                              onChange={(e) =>
                                handleSelectAllChange(e.target.checked, paginatedUsers)
                              }
                              aria-label="Select all rows"
                            />
                          </label>
                        </th>
                        <th className="sticky-col col-id">
                          <SortableHeader label="User ID" field="id" />
                        </th>
                        <th className="sticky-col col-username">
                          <SortableHeader label="Username" field="username" />
                        </th>
                        {/*<th>Company Code</th> */}
                        <th>
                          <SortableHeader label="Password" field="password" />
                        </th>
                        <th>
                          <SortableHeader label="Company code" field="company_code" />
                        </th>
                        <th>
                          <SortableHeader label="Phone" field="phone" />
                        </th>
                        <th>
                          <SortableHeader label="Email" field="email" />
                        </th>
                        <th className="relative col-inverter-type">
                          <div className="inverter-header">
                            <SortableHeader label="Inverter Type" field="inverter_type" />

                            <button
                              type="button"
                              ref={filterButtonRef}
                              className={`inverter-filter-trigger ${
                                isFilterOpen ? "active" : ""
                              } ${selectedInverter ? "has-selection" : ""}`}
                              aria-label="Filter inverter type"
                              aria-expanded={isFilterOpen}
                              onClick={handleFilterIconClick}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M4 5H20M7 12H17M10 19H14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            {selectedInverter && (
                              <span className="inverter-filter-chip">{selectedInverter}</span>
                            )}
                          </div>
                        </th>
                        <th>
                          <SortableHeader label="Plant Name" field="plant_name" />
                        </th>

                        <th className="relative col-city">
                          <div className="inverter-header">
                            <SortableHeader label="City" field="city_name" />

                            <button
                              type="button"
                              ref={cityFilterButtonRef}
                              className={`inverter-filter-trigger ${
                                isCityFilterOpen ? "active" : ""
                              } ${selectedCity ? "has-selection" : ""}`}
                              aria-label="Filter city"
                              aria-expanded={isCityFilterOpen}
                              onClick={handleCityFilterIconClick}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M4 5H20M7 12H17M10 19H14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            {selectedCity && (
                              <span className="inverter-filter-chip">{selectedCity}</span>
                            )}
                          </div>
                        </th>
                        <th>
                          <SortableHeader label="Collector" field="collector" />
                        </th>
                        <th>
                          <SortableHeader label="Longitude" field="longitude" />
                        </th>
                        <th>
                          <SortableHeader label="Latitude" field="latitude" />
                        </th>
                        <th>
                          <SortableHeader label="GMT" field="gmt" />
                        </th>
                        <th className="relative col-plant-type">
                          <div className="inverter-header">
                            <SortableHeader label="Plant Type" field="plant_type" />

                            <button
                              type="button"
                              ref={plantTypeFilterButtonRef}
                              className={`inverter-filter-trigger ${
                                isPlantTypeFilterOpen ? "active" : ""
                              } ${selectedPlantType ? "has-selection" : ""}`}
                              aria-label="Filter plant type"
                              aria-expanded={isPlantTypeFilterOpen}
                              onClick={handlePlantTypeFilterIconClick}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M4 5H20M7 12H17M10 19H14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            {selectedPlantType && (
                              <span className="inverter-filter-chip">{getPlantTypeLabel(parseInt(selectedPlantType))}</span>
                            )}
                          </div>
                        </th>
                        <th>
                          <SortableHeader label="Iserial" field="iserial" />
                        </th>
                        <th>
                          <SortableHeader label="Keep Live Power" field="power" />
                        </th>
                        <th>
                          <SortableHeader label="Capacity (Kw)" field="capacity" />
                        </th>
                        <th>
                          <SortableHeader label="Day Production (Kwh)" field="day_power" />
                        </th>
                        <th>
                          <SortableHeader label="Total Production (Kwh)" field="total_power" />
                        </th>
                        <th>WhatsApp Flag</th>
                        <th>Inverter Fault</th>
                        <th>Daily Gen</th>
                        <th>Weekly Gen</th>
                        <th>Monthly Gen</th>
                        <th>
                          <SortableHeader label="Created At" field="created_at" />
                        </th>
                        <th className="sticky-col sticky-col-right col-updated">
                          <SortableHeader label="Updated At" field="updated_at" />
                        </th>
                        <th className="sticky-col sticky-col-right col-view"></th>
                        {/* <th className="action-col">Action</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers && paginatedUsers.length > 0
                         
                          ? paginatedUsers.map((u, index) => (
                            
                            <tr key={u.id ?? index}>
                              {console.log("USER OBJECT", u)}
                              <td className="sticky-col col-check">
                                <label className="row-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={selectedUserIds.has(u.id)}
                                    onChange={(e) =>
                                      handleRowCheckboxChange(u.id, e.target.checked)
                                    }
                                    aria-label={`Select user ${u.username ?? u.id}`}
                                  />
                                </label>
                              </td>
                              <td className="sticky-col col-id">
                                {u.id ?? "N/A"}
                              </td>
                              <td className="sticky-col col-username">
                                {u.username ?? "N/A"}
                              </td>
                              {/* <td
                                  onClick={() => openCompanyCodeModal(u)}
                                  className="company-code-cell"
                                >
                                  {u.company_code ?? "N/A"}
                                </td>*/}

                              <td>{u.password ?? "N/A"}</td>
                              <td
                                onClick={() => u.user_flag !== 1 && openQbitsCodeModal(u)}
                                className={`company-code-cell ${u.user_flag === 1 ? 'disabled' : ''}`}
                              >
                                {u.qbits_company_code ?? "N/A"}
                              </td>
                              <td>{u.phone ?? "N/A"}</td>
                              <td>{u.email ?? "N/A"}</td>
                              <td>{u.inverter_type ?? "N/A"}</td>
                              <td>{u.plant_name ?? "N/A"}</td>

                              <td>{u.city_name ?? "N/A"}</td>
                              <td>{u.collector ?? "N/A"}</td>
                              <td>{u.longitude ?? "N/A"}</td>
                              <td>{u.latitude ?? "N/A"}</td>
                              <td>{u.gmt ?? "N/A"}</td>
                              <td>{getPlantTypeLabel(u.plant_type)}</td>
                              <td>{u.iserial ?? "N/A"}</td>
                              <td>{u.capacity ?? "N/A"}</td>
                              <td>{u.day_power ?? "N/A"}</td>
                              <td>{u.total_power ?? "N/A"}</td>
                              <td>{u.power ?? "N/A"}</td>
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
                                    checked={
                                      u.daily_generation_report_flag == 1
                                    }
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
                                    checked={
                                      u.weekly_generation_report_flag == 1
                                    }
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
                              <td className="sticky-col sticky-col-right col-updated">
                                {formatDate(u.updated_at)}
                              </td>
                              <td className="sticky-col sticky-col-right col-view">
                                <button
                                  className="view-btn"
                                  onClick={() => {
                                    const pid = getPlantApiId(u);
                                    const username = u.username || u.name || "User";
                                    router.push(`/user-plants/${pid}?username=${encodeURIComponent(username)}`);
                                  }}
                                  title="View plants"
                                >
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                </button>
                              </td>
                              {/* <td className="action-col">
                                <div className="action-buttons">
                                  <button className="action-btn edit-btn">Edit</button>
                                </div>
                              </td> */}
                            </tr>
                          ))
                        : null}
                    </tbody>
                  </table>
                </div>
              </div>

               
              <div className="ul-pagination">
                <div className="pagination-info">
                  {hasFilter ? (
                    <>Showing 1 to {inverterFilteredUsers.length} of {inverterFilteredUsers.length} entries</>
                  ) : (
                    <>Showing {Math.min(rowStartIndex + 1, filteredUsers.length)} to {Math.min(rowStartIndex + rowsPerPage, filteredUsers.length)} of {filteredUsers.length} entries</>
                  )}
                </div>
                {!hasFilter && (
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-arrow-btn"
                      onClick={handleTablePrevious}
                      disabled={tablePage === 1}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>
                    <div className="pagination-numbers">
                      {getPageNumbers(tablePage, totalTablePages).map((pageNum, idx) => (
                        pageNum === '...' ? (
                          <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                            {pageNum}
                          </span>
                        ) : (
                          <button
                            key={pageNum}
                            type="button"
                            className={`pagination-number ${
                              tablePage === pageNum ? 'active' : ''
                            }`}
                            onClick={() => setTablePage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        )
                      ))}
                    </div>
                    <button
                      type="button"
                      className="pagination-arrow-btn"
                      onClick={() => handleTableNext(totalTablePages)}
                      disabled={tablePage === totalTablePages}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                  </div>
                )}
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
            <h3>Update Company Code</h3>
            <input
              type="text"
              className="modal-input"
              value={qbitsCodeInput}
              onChange={(e) => setQbitsCodeInput(e.target.value)}
              placeholder="Enter company code"
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
      {filterMenu}
      {cityFilterMenu}
      {plantTypeFilterMenu}
      {flagMenu}
    </div>
  );
}
