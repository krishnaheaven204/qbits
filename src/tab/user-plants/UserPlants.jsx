"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import "./UserPlants.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

function getPlantStateName(code) {
  if (code === 1) return "Normal";
  if (code === 4 || code === 5) return "Fault";
  if (code === 0 || code === 2 || code === 7) return "Offline";
  return "Unknown";
}

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
        console.log("API Response structure:", {
          isArray: Array.isArray(json),
          hasData: !!json.data,
          dataType: typeof json.data,
          dataIsArray: Array.isArray(json.data),
          dataKeys: json.data ? Object.keys(json.data).slice(0, 10) : null,
        });
        
        // Handle different response structures
        let plantsData = [];
        
        if (Array.isArray(json)) {
          plantsData = json;
          console.log("Using json as array");
        } else if (Array.isArray(json.data)) {
          plantsData = json.data;
          console.log("Using json.data as array");
        } else if (json.data && typeof json.data === 'object') {
          // If data is an object with a data property that's an array
          if (Array.isArray(json.data.data)) {
            plantsData = json.data.data;
            console.log("Using json.data.data as array");
          } else if (json.data.records && Array.isArray(json.data.records)) {
            plantsData = json.data.records;
            console.log("Using json.data.records as array");
          } else if (json.data.plants && Array.isArray(json.data.plants)) {
            plantsData = json.data.plants;
            console.log("Using json.data.plants as array");
          } else if (json.data.plants && typeof json.data.plants === 'object' && !Array.isArray(json.data.plants)) {
            // json.data.plants is a single plant object
            plantsData = [json.data.plants];
            console.log("json.data.plants is single plant, wrapping in array");
          } else if (json.data.list && Array.isArray(json.data.list)) {
            plantsData = json.data.list;
            console.log("Using json.data.list as array");
          } else if (json.data.plant_no || json.data.plant_name) {
            // json.data is a single plant object
            plantsData = [json.data];
            console.log("json.data is single plant, wrapping in array");
          } else {
            console.log("Could not extract plants, json.data keys:", Object.keys(json.data));
          }
        } else {
          console.log("Unexpected response structure");
        }
        
        // Ensure plantsData is always an array
        if (!Array.isArray(plantsData)) {
          console.log("plantsData is not array, converting:", plantsData);
          plantsData = [];
        }
        
        console.log("Final plants count:", plantsData.length);
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

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";

    const date = new Date(timeString);
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

  const formatProduction = (value) => {
    if (!value && value !== 0) return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    return `${num.toFixed(2)} kWh`;
  };

  const capitalizeText = (text) => {
    if (!text) return "N/A";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <div className="user-plants-page">
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
          {userName && (
            <div className="up-user-info">
              <p className="up-user-name">Username :- <strong>{userName}</strong></p>
            </div>
          )}
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
            <div className="table-scroll-container">
              <div className="table-inner-force">
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
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="sticky-col left-col">
                          {renderStatusIcon(p.plantstate)}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#646566ff' }}>
                            {capitalizeText(String(p.plant_no))}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 400, color: '#646566ff' }}>
                            {capitalizeText(p.plant_name)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontWeight: 400 }}>
                            {capitalizeText(formatCapacity(p.capacity))}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontWeight: 400 }}>
                            {capitalizeText(formatNumber(p.kpi))}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontWeight: 400 }}>
                            {capitalizeText(formatNumber(p.eday))}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontWeight: 400 }}>
                            {capitalizeText(formatNumber(p.etot))}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontWeight: 400 }}>
                            {capitalizeText(formatNumber(p.month_power))}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontWeight: 400 }}>
                            {capitalizeText(formatNumber(p.year_power))}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontWeight: 400 }}>
                            {capitalizeText(p.remark1)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontSize: '14px', fontWeight: 400 }}>
                            {capitalizeText(formatDate(p.date))}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#646566ff', fontSize: '14px', fontWeight: 400 }}>
                            {capitalizeText(formatTime(p.time))}
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
  );
}
