"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import "./UserPlants.css";


function renderStatusIcon(code) {
  if (code === 1) {
    return (
      <div className="status normal" title="Normal">
        <span className="green-dot"></span>
        <span className="status-text">Normal</span>
      </div>
    );
  }

  if (code === 4 || code === 5) {
    return (
      <div className="status fault" title="Fault">
        <span className="fault-icon">▲</span>
        <span className="status-text">Fault</span>
      </div>
    );
  }

  if (code === 0 || code === 2 || code === 7) {
    return (
      <div className="status offline" title="Offline">
        <span className="offline-icon">⚠</span>
        <span className="status-text">Offline</span>
      </div>
    );
  }

  return "Unknown";
}

export default function UserPlants() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plants, setPlants] = useState([]);
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateStateOpen, setIsCreateStateOpen] = useState(false);
  const [createStateLoading, setCreateStateLoading] = useState(false);
  const [createStateError, setCreateStateError] = useState("");
  const [isAddCollectorOpen, setIsAddCollectorOpen] = useState(false);
  const [addCollectorLoading, setAddCollectorLoading] = useState(false);
  const [addCollectorError, setAddCollectorError] = useState("");
  const [createdPlantPid, setCreatedPlantPid] = useState(null);
  const [collectorSerial, setCollectorSerial] = useState("");
  const [createdPlantAuth, setCreatedPlantAuth] = useState({ userName: "", password: "" });
  const [form, setForm] = useState({
    userName: "",
    password: "",
    plantName: "",
    city: "",
    longitude: "",
    latitude: "",
    stationtype: "",
    capacity: "",
    batterycapacity: "",
  });

  const closeCreateState = () => {
    setIsCreateStateOpen(false);
    setCreateStateLoading(false);
    setCreateStateError("");
  };

  const closeAddCollector = () => {
    setIsAddCollectorOpen(false);
    setAddCollectorLoading(false);
    setAddCollectorError("");
    setCreatedPlantPid(null);
    setCollectorSerial("");
    setCreatedPlantAuth({ userName: "", password: "" });
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitCreateState = async (e) => {
    e.preventDefault();
    if (createStateLoading) return;

    setCreateStateError("");

    const payload = {
      userName: form.userName.trim(),
      password: form.password,
      plantName: form.plantName.trim(),
      city: form.city.trim(),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      latitude: form.latitude === "" ? null : Number(form.latitude),
      stationtype: form.stationtype.trim(),
      capacity: form.capacity === "" ? null : Number(form.capacity),
      batterycapacity: form.batterycapacity === "" ? null : Number(form.batterycapacity),
    };

    if (!payload.userName || !payload.password || !payload.plantName) {
      setCreateStateError("Please fill User Name, Password, and Plant Name.");
      return;
    }

    try {
      setCreateStateLoading(true);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch("/api/create-plant", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = resp.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const result = isJson ? await resp.json() : await resp.text();

      if (!resp.ok) {
        const message =
          (typeof result === "object" && result && (result.message || result.error))
            ? result.message || result.error
            : typeof result === "string"
              ? result
              : resp.statusText;
        throw new Error(message || "Request failed");
      }

      const message =
        typeof result === "object" && result
          ? result?.data?.message || result?.message
          : "Plant created successfully.";
      const pid = typeof result === "object" && result ? result?.data?.pid : null;

      closeCreateState();
      alert(pid ? `${message} (PID: ${pid})` : message);

      if (pid) {
        setCreatedPlantPid(pid);
        setCreatedPlantAuth({ userName: payload.userName, password: payload.password });
        setIsAddCollectorOpen(true);
      }
    } catch (err) {
      setCreateStateError(err?.message || "Failed to create plant");
    } finally {
      setCreateStateLoading(false);
    }
  };

  const submitAddCollector = async (e) => {
    e.preventDefault();
    if (addCollectorLoading) return;

    setAddCollectorError("");

    const serial = collectorSerial.trim();
    if (!serial) {
      setAddCollectorError("Please enter Serial Number.");
      return;
    }

    try {
      setAddCollectorLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const payload = {
        userName: createdPlantAuth.userName,
        password: createdPlantAuth.password,
        plantId: createdPlantPid,
        serial,
        type: "WiFi-USB",
      };

      const resp = await fetch("/api/add-collector", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = resp.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const result = isJson ? await resp.json() : await resp.text();

      if (!resp.ok) {
        const message =
          (typeof result === "object" && result && (result.message || result.error))
            ? result.message || result.error
            : typeof result === "string"
              ? result
              : resp.statusText;
        throw new Error(message || "Request failed");
      }

      const message =
        typeof result === "object" && result
          ? result?.data?.message || result?.message || "Collector added successfully."
          : "Collector added successfully.";

      closeAddCollector();
      alert(message);
    } catch (err) {
      setAddCollectorError(err?.message || "Failed to add collector");
    } finally {
      setAddCollectorLoading(false);
    }
  };

  // Get username from URL query parameter
  useEffect(() => {
    const usernameParam = searchParams.get("username");
    if (usernameParam) {
      setUserName(decodeURIComponent(usernameParam));
      // Remove query parameter from URL
      router.replace(`/user-plants/${id}`, { shallow: true });
    }
  }, [searchParams, id, router]);

  useEffect(() => {
    const fetchPlants = async () => {
      if (!id) {
        setError("User ID not found");
        setLoading(false);
        return;
      }

      setLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const apiUrl = `https://qbits.quickestimate.co/api/v1/plants/${id}?page=1&limit=20`;

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Plant API failed", response.status);
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        
        // Handle different response structures
        let plantsData = [];
        
        if (Array.isArray(json)) {
          plantsData = json;
        } else if (Array.isArray(json.data)) {
          plantsData = json.data;
        } else if (json.data && typeof json.data === 'object') {
          // If data is an object with a data property that's an array
          if (Array.isArray(json.data.data)) {
            plantsData = json.data.data;
          } else if (json.data.records && Array.isArray(json.data.records)) {
            plantsData = json.data.records;
          } else if (json.data.plants && Array.isArray(json.data.plants)) {
            plantsData = json.data.plants;
          } else if (json.data.plants && typeof json.data.plants === 'object' && !Array.isArray(json.data.plants)) {
            // json.data.plants is a single plant object
            plantsData = [json.data.plants];
          } else if (json.data.list && Array.isArray(json.data.list)) {
            plantsData = json.data.list;
          } else if (json.data.plant_no || json.data.plant_name) {
            // json.data is a single plant object
            plantsData = [json.data];
          }
        }
        
        // Ensure plantsData is always an array
        if (!Array.isArray(plantsData)) {
          plantsData = [];
        }
        setPlants(plantsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching plants:", err);
        setError("Failed to load plants");
        setPlants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";

    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const getLatestInverterTime = (plant) => {
    if (!plant) return null;
    
    // Check if plant has inverters array
    if (Array.isArray(plant.inverters) && plant.inverters.length > 0) {
      // Get the inverter with the latest stime
      const latestInverter = plant.inverters.reduce((latest, current) => {
        if (!latest) return current;
        const latestTime = new Date(latest.stime || 0).getTime();
        const currentTime = new Date(current.stime || 0).getTime();
        return currentTime > latestTime ? current : latest;
      });
      return latestInverter.stime;
    }
    
    // Check if plant has stime directly
    if (plant.stime) return plant.stime;
    
    // Fallback to other timestamp fields
    return plant.created_at || plant.updated_at || plant.date || null;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    hours = String(hours).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Time";

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, "0");

    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    return num.toFixed(2);
  };

  const formatCapacity = (value) => {
    if (!value && value !== 0) return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    return `${num.toFixed(2)} `;
  };

  const capitalizeText = (text) => {
    if (!text) return "N/A";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <div className="user-plants-page">
      <div className="user-plants-container">
        <div className="breadcrumb-nav">
          <button className="breadcrumb-item" onClick={() => router.back()}>
            <span className="breadcrumb-icon">◀</span>
            <span className="breadcrumb-text">Back</span>
          </button>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item active">Plant List</span>
        </div>

        <div className="up-card">
        <div className="up-header">
          <div className="up-header-text">
            <h5 className="up-title">Plant List</h5>
          </div>
          <div className="up-header-actions">
            <button
              type="button"
              className="up-create-state-btn"
              onClick={() => setIsCreateStateOpen(true)}
            >
              Create State
            </button>
          </div>
           
        </div>

        <div className="up-body">
          {loading ? (
            <div className="up-empty">
              <p className="up-muted">Loading plants...</p>
            </div>
          ) : error ? (
            <div className="up-error" role="alert">
              {error}
            </div>
          ) : !Array.isArray(plants) || plants.length === 0 ? (
            <div className="up-empty">
              <p className="up-muted">No plants found for this user.</p>
            </div>
          ) : (
            <div className="table-scroll-container user-plants-table">
              <div className="table-inner-force-allusers">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th className="sticky-col left-col">Status</th>
                      <th>Plant No</th>
                      <th>Plant Name</th>
                      <th>Capacity (Kw)</th>
                      <th>Kpi</th>
                      <th>Day Production</th>
                      <th>Total Production</th>
                      <th>Month Production</th>
                      <th>Year Production</th>
                      <th>City</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(plants) && plants.map((p, idx) => (
                      <tr
                        key={idx}
                        onClick={() => router.push(`/plant-details/${p.plant_no}`)}
                        style={{ cursor: "pointer", transition: "background-color 0.2s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="sticky-col left-col">
                          {renderStatusIcon(p.plantstate)}
                        </td>
                        <td>
                          <span className="fw-semibold text-secondary">
                            {capitalizeText(String(p.plant_no))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(p.plant_name)}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(formatCapacity(p.capacity))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(formatNumber(p.kpi))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(formatNumber(p.eday))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(formatNumber(p.etot))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(formatNumber(p.month_power))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(formatNumber(p.year_power))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {capitalizeText(p.remark1)}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary" style={{ fontSize: "14px" }}>
                            {formatDateTime(getLatestInverterTime(p))}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary" style={{ fontSize: "14px" }}>
                            {formatTime(getLatestInverterTime(p))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {isCreateStateOpen ? (
        <div className="up-modal-overlay" role="dialog" aria-modal="true">
          <div className="up-modal">
            <div className="up-modal-header">
              <h5>Create State</h5>
              <button
                type="button"
                className="up-modal-close"
                onClick={closeCreateState}
              >
                ×
              </button>
            </div>

            <form className="up-modal-body" onSubmit={submitCreateState}>
              {createStateError ? (
                <div className="up-modal-error">{createStateError}</div>
              ) : null}

              <div className="up-form-grid">
                <div className="up-form-field">
                  <label>User Name *</label>
                  <input
                    value={form.userName}
                    onChange={(e) =>
                      handleFormChange("userName", e.target.value)
                    }
                  />
                </div>
                <div className="up-form-field">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      handleFormChange("password", e.target.value)
                    }
                  />
                </div>
                <div className="up-form-field">
                  <label>Plant Name *</label>
                  <input
                    value={form.plantName}
                    onChange={(e) =>
                      handleFormChange("plantName", e.target.value)
                    }
                  />
                </div>
                <div className="up-form-field">
                  <label>City</label>
                  <input
                    value={form.city}
                    onChange={(e) => handleFormChange("city", e.target.value)}
                  />
                </div>
                <div className="up-form-field">
                  <label>Longitude</label>
                  <input
                    value={form.longitude}
                    onChange={(e) =>
                      handleFormChange("longitude", e.target.value)
                    }
                  />
                </div>
                <div className="up-form-field">
                  <label>Latitude</label>
                  <input
                    value={form.latitude}
                    onChange={(e) =>
                      handleFormChange("latitude", e.target.value)
                    }
                  />
                </div>
                <div className="up-form-field">
                  <label>Station Type</label>
                  <input
                    value={form.stationtype}
                    onChange={(e) =>
                      handleFormChange("stationtype", e.target.value)
                    }
                  />
                </div>
                <div className="up-form-field">
                  <label>Capacity</label>
                  <input
                    value={form.capacity}
                    onChange={(e) =>
                      handleFormChange("capacity", e.target.value)
                    }
                  />
                </div>
                <div className="up-form-field">
                  <label>Battery Capacity</label>
                  <input
                    value={form.batterycapacity}
                    onChange={(e) =>
                      handleFormChange("batterycapacity", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="up-modal-actions">
                <button
                  type="button"
                  className="up-modal-cancel"
                  onClick={closeCreateState}
                  disabled={createStateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="up-modal-submit"
                  disabled={createStateLoading}
                >
                  {createStateLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isAddCollectorOpen ? (
        <div className="up-modal-overlay" role="dialog" aria-modal="true">
          <div className="up-modal">
            <div className="up-modal-header">
              <h5>Add Collector</h5>
              <button
                type="button"
                className="up-modal-close"
                onClick={closeAddCollector}
              >
                ×
              </button>
            </div>

            <form className="up-modal-body" onSubmit={submitAddCollector}>
              {addCollectorError ? (
                <div className="up-modal-error">{addCollectorError}</div>
              ) : null}

              <div className="up-form-grid">
                <div className="up-form-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Serial Number *</label>
                  <input
                    value={collectorSerial}
                    onChange={(e) => setCollectorSerial(e.target.value)}
                  />
                </div>
              </div>

              <div className="up-modal-actions">
                <button
                  type="button"
                  className="up-modal-cancel"
                  onClick={closeAddCollector}
                  disabled={addCollectorLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="up-modal-submit"
                  disabled={addCollectorLoading}
                >
                  {addCollectorLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
