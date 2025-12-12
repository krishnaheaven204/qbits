"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import "./PlantDetails.css";

// Helper functions
const safeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const formatValue = (value, decimals = 2) => {
  if (value === null || value === undefined) return "--";
  const num = safeNumber(value);
  if (num === null) return "--";
  return num.toFixed(decimals);
};

const mapPlantState = (state) => {
  const stateMap = {
    0: "Solar System",
    1: "Battery Storage",
    2: "Solar With Limitation",
  };
  if (stateMap[state] !== undefined) return stateMap[state];
  return `Unknown (${state})`;
};

// Placeholder data for errors (keeping as-is since API doesn't provide this)
const plantDataErrors = {
  all: [
    {
      id: 1,
      status: "Recovered",
      inverterModel: "QB-5KTLD",
      errorText: "Low output power",
      startTime: "2025-12-07 17:53:23.555",
      endTime: "2025-12-08 07:06:17.431",
    },
    {
      id: 2,
      status: "Fault",
      inverterModel: "QB-3.6KTLS",
      errorText: "Grid voltage high",
      startTime: "2025-12-08 09:15:42.123",
      endTime: "2025-12-08 10:30:15.789",
    },
    {
      id: 3,
      status: "Recovered",
      inverterModel: "QB-4KTLS",
      errorText: "Temperature warning",
      startTime: "2025-12-06 14:22:10.456",
      endTime: "2025-12-06 16:45:33.890",
    },
  ],
  going: [
    {
      id: 2,
      status: "Fault",
      inverterModel: "QB-3.6KTLS",
      errorText: "Grid voltage high",
      startTime: "2025-12-08 09:15:42.123",
      endTime: "2025-12-08 10:30:15.789",
    },
  ],
  recovered: [
    {
      id: 1,
      status: "Recovered",
      inverterModel: "QB-5KTLD",
      errorText: "Low output power",
      startTime: "2025-12-07 17:53:23.555",
      endTime: "2025-12-08 07:06:17.431",
    },
    {
      id: 3,
      status: "Recovered",
      inverterModel: "QB-4KTLS",
      errorText: "Temperature warning",
      startTime: "2025-12-06 14:22:10.456",
      endTime: "2025-12-06 16:45:33.890",
    },
  ],
};

// Water wave circle component with real sine wave animation
function WaterWaveCircle({ percentage }) {
  const [wave1Path, setWave1Path] = React.useState("");
  const [wave2Path, setWave2Path] = React.useState("");
  const [offset1, setOffset1] = React.useState(0);
  const [offset2, setOffset2] = React.useState(50);

  React.useEffect(() => {
    const generateWave = (offset = 0) => {
      const width = 400;
      const amplitude = 12;
      const waveY = 200 - (percentage * 2);
      let path = "";
      for (let x = 0; x <= width; x++) {
        let y = waveY + Math.sin((x + offset) * 0.03) * amplitude;
        path += `${x === 0 ? 'M' : 'L'} ${x},${y} `;
      }
      path += `L ${width},200 L 0,200 Z`;
      return path;
    };

    setWave1Path(generateWave(offset1));
    //setWave2Path(generateWave(offset2));
  }, [percentage, offset1, offset2]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setOffset1(prev => (prev + 2) % 400);
      setOffset2(prev => (prev + 3) % 400);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="water-wave-container">
      <svg className="water-wave-svg" viewBox="0 0 200 200">
        <defs>
          <clipPath id="circleClip">
            <circle cx="100" cy="100" r="98" />
          </clipPath>
        </defs>

        {/* Background circle */}
        <circle cx="100" cy="100" r="98" fill="white" stroke="#159f6c" strokeWidth="2" />

        {/* Wave group with clipping */}
        <g clipPath="url(#circleClip)" id="waveGroup">
          {/* Bottom (dark) wave */}
          <g className="wave2">
            <path d={wave2Path} fill="#159f6c" />
          </g>

          {/* Top (light) wave */}
          <g className="wave1">
            <path d={wave1Path} fill="#159f6c" />
          </g>
        </g>
      </svg>

      {/* Percentage text */}
      <div className="percentage-text">
        <span className="percentage-value">{percentage}%</span>
      </div>
    </div>
  );
}

// Status icon component
function StatusIcon({ status }) {
  const statusConfig = {
    Normal: { color: "#10b981", symbol: "●" },
    Fault: { color: "#ef4444", symbol: "⚠" },
    Offline: { color: "#6b7280", symbol: "○" },
  };
  const config = statusConfig[status] || statusConfig.Normal;
  return (
    <span className="status-icon" style={{ color: config.color }}>
      {config.symbol}
    </span>
  );
}

// Production stat box component
function StatBox({ title, value, unit }) {
  return (
    <div className="stat-box">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {unit && <div className="stat-unit">{unit}</div>}
    </div>
  );
}

// Error card component
function ErrorCard({ error, index }) {
  const isRecovered = error.status === "Recovered";
  const isFault = error.status === "Fault";

  return (
    <div className={`error-card ${isRecovered ? "recovered" : isFault ? "fault" : "offline"}`}>
      <div className="error-header">
        <span className={`error-status ${isRecovered ? "recovered" : isFault ? "fault" : "offline"}`}>
          {error.status}
        </span>
        <span className="error-index">#{index}</span>
      </div>

      <div className="error-body">
        <div className="error-model">{error.inverterModel}</div>
        <div className="error-text">{error.errorText}</div>
      </div>

      <div className="error-footer">
        <span className="error-time">{error.startTime}</span>
        <span className="error-time">{error.endTime}</span>
      </div>
    </div>
  );
}

export default function PlantDetails() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [errors, setErrors] = useState(plantDataErrors.all);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Get plant number from route params or query params
  const getPlantNo = () => {
    if (params?.plantNo) return params.plantNo;
    if (searchParams?.get("plant_no")) return searchParams.get("plant_no");
    return null;
  };

  const plantNo = getPlantNo();

  // Fetch plant data from API
  useEffect(() => {
    if (!plantNo) {
      setError("Plant number not found. Please provide a valid plant_no.");
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchPlantData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== "undefined" 
          ? localStorage.getItem("authToken") 
          : null;

        const headers = {
          Accept: "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        let plantData = null;
        let response;

        // Try the show endpoint first
        try {
          response = await fetch(
            `https://qbits.quickestimate.co/api/v1/plants/show/${plantNo}`,
            {
              method: "GET",
              headers,
              signal: abortController.signal,
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            // API structure: {success: true, data: {plants: {...}}, message: '...'}
            // The plants object contains the actual plant data
            if (data?.data?.plants) {
              plantData = data.data.plants;
            } else if (data?.success === true) {
              // If success is true but no plants in expected location, try other paths
              if (data?.data && typeof data.data === 'object') {
                plantData = data.data;
              }
            }
          }
        } catch (e) {
          // Silently fail and try alternative
        }

        // If show endpoint didn't work, try direct plant endpoint
        if (!plantData) {
          try {
            response = await fetch(
              `https://qbits.quickestimate.co/api/v1/plants/${plantNo}`,
              {
                method: "GET",
                headers,
                signal: abortController.signal,
              }
            );

            if (response.ok) {
              const data = await response.json();
              
              // Try to find the plant data in various structures
              if (Array.isArray(data)) {
                plantData = data.find(p => String(p.plant_no) === String(plantNo)) || data[0];
              } else if (data?.data) {
                if (Array.isArray(data.data)) {
                  plantData = data.data.find(p => String(p.plant_no) === String(plantNo)) || data.data[0];
                } else if (typeof data.data === 'object' && !Array.isArray(data.data)) {
                  plantData = data.data;
                }
              } else if (typeof data === 'object' && (data.plant_name || data.eday || data.plant_no)) {
                plantData = data;
              }
            }
          } catch (e) {
            // Silently fail
          }
        }

        if (plantData) {
          setPlant(plantData);
          setError(null);
        } else {
          setError("Could not fetch plant details. Please try again.");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to fetch plant data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlantData();

    return () => abortController.abort();
  }, [plantNo]);

  // Sample production data for chart - Y values extracted from polyline points
  // Polyline: 0,250 50,240 100,220 150,200 200,180 250,160 300,140 350,120 400,100 450,80 500,60 550,50 600,40 650,35 700,30 750,25 800,20 850,15 900,10 950,5 1000,0
  const chartData = [
    { time: "07:24:51", x: 0, y: 250 },
    { time: "07:44:45", x: 50, y: 240 },
    { time: "07:59:49", x: 100, y: 220 },
    { time: "08:19:45", x: 150, y: 200 },
    { time: "08:34:49", x: 200, y: 180 },
    { time: "08:54:45", x: 250, y: 160 },
    { time: "09:09:49", x: 300, y: 140 },
    { time: "09:29:45", x: 350, y: 120 },
    { time: "09:44:49", x: 400, y: 100 },
    { time: "10:04:45", x: 450, y: 80 },
    { time: "10:19:48", x: 500, y: 60 },
    { time: "10:39:45", x: 550, y: 50 },
    { time: "10:54:49", x: 600, y: 40 },
    { time: "11:14:45", x: 650, y: 35 },
    { time: "11:29:45", x: 700, y: 30 },
    { time: "11:49:00", x: 750, y: 25 },
    { time: "12:09:00", x: 800, y: 20 },
    { time: "12:29:00", x: 850, y: 15 },
    { time: "12:49:00", x: 900, y: 10 },
    { time: "13:09:00", x: 950, y: 5 },
    { time: "13:29:00", x: 1000, y: 0 },
  ];

  const handleChartHover = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate which data point is closest to the mouse position
    const chartWidth = rect.width;
    const pointIndex = Math.round((x / chartWidth) * (chartData.length - 1));
    
    if (pointIndex >= 0 && pointIndex < chartData.length) {
      setHoveredPoint(pointIndex);
      setTooltipPos({ x, y });
    }
  };

  const handleChartLeave = () => {
    setHoveredPoint(null);
  };

  useEffect(() => {
    if (activeTab === "all") {
      setErrors(plantDataErrors.all);
    } else if (activeTab === "going") {
      setErrors(plantDataErrors.going);
    } else if (activeTab === "recovered") {
      setErrors(plantDataErrors.recovered);
    }
  }, [activeTab]);

  // Calculate performance percentage based on acpower and capacity
  const getPercentage = () => {
    if (!plant) return 0;
    const acpower = safeNumber(plant.acpower);
    const capacity = safeNumber(plant.capacity);
    if (acpower === null || capacity === null || capacity === 0) return 0;
    return Math.min(100, Math.round((acpower / capacity) * 100));
  };

  // Build production data from API
  const getProductionData = () => {
    if (!plant) return [];
    return [
      { title: "Day Production", value: formatValue(plant.eday, 2), unit: "kWh" },
      { title: "Month Production", value: formatValue(plant.month_power, 2), unit: "kWh" },
      { title: "Year Production", value: formatValue(plant.year_power, 2), unit: "kWh" },
      { title: "Total Production", value: formatValue(plant.etot, 2), unit: "kWh" },
      { title: "Keep-live power", value: formatValue(plant.acpower, 2), unit: "kW" },
      { title: "Capacity", value: formatValue(plant.capacity, 2), unit: "kWp" },
    ];
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Trigger re-fetch by updating plantNo dependency
    window.location.reload();
  };

  return (
    <div className="plant-details-page">
      <div className="page-header">
        <h1 className="page-title">Plant Details</h1>
        <div className="breadcrumb-inline">
          <button className="breadcrumb-item-inline" onClick={() => router.back()}>
            <span className="breadcrumb-icon">◀</span>
            <span className="breadcrumb-text">Back</span>
          </button>
          <span className="breadcrumb-separator-inline">›</span>
          <span className="breadcrumb-item-inline active">
            {loading ? "Loading..." : plant?.plant_name || "Plant"}
          </span>
          <span className="breadcrumb-separator-inline">›</span>
          <span className="breadcrumb-item-inline">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Top Layout: Two Cards */}
      <div className="top-cards-layout">
        {/* Card 1: Production Summary */}
        <div className="card card-1">
          <div className="card-header">
            <h3 className="card-title">Production Summary</h3>
          </div>
          <div className="card-content">
            {error ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ color: "#ef4444", marginBottom: "12px", fontSize: "14px" }}>
                  {error}
                </div>
                <button
                  onClick={handleRetry}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#159f6c",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                Loading...
              </div>
            ) : (
              <>
                <div className="circle-section">
                  <WaterWaveCircle percentage={getPercentage()} />
                </div>
                <div className="stats-grid">
                  {getProductionData().map((stat, idx) => (
                    <StatBox key={idx} title={stat.title} value={stat.value} unit={stat.unit} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Inverter / Basic Info */}
        <div className="card card-2">
          <div className="card-header">
            <h3 className="card-title">Plant Information</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>
                Loading...
              </div>
            ) : (
              <div className="info-layout">
                <div className="info-image-box">
                  <img 
                    src="https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop" 
                    alt="Solar Panel Installation"
                    className="solar-panel-image"
                    onError={(e) => {
                      e.target.src = "https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop";
                    }}
                  />
                </div>
                <div className="info-text-section">
                  <div className="info-row">
                    <span className="info-label">Plant Name</span>
                    <span className="info-value">{plant?.plant_name || "--"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">City</span>
                    <span className="info-value">{plant?.remark1 || "--"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{plant?.plant_user || "none"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Type of Plant</span>
                    <span className="info-value">{mapPlantState(plant?.plantstate)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Cards Layout: Alarm and Production Overview */}
      <div className="bottom-cards-layout">
        {/* Error Log Section */}
        <div className="card error-log-card">
          <div className="error-log-header">
            <h3 className="card-title">Alarm</h3>
            <div className="error-tabs">
              <button
                className={`tab-button ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All
              </button>
              <button
                className={`tab-button ${activeTab === "going" ? "active" : ""}`}
                onClick={() => setActiveTab("going")}
              >
                Going
              </button>
              <button
                className={`tab-button ${activeTab === "recovered" ? "active" : ""}`}
                onClick={() => setActiveTab("recovered")}
              >
                Recovered
              </button>
            </div>
          </div>

          <div className="error-log-content">
            {errors.length > 0 ? (
              errors.map((error, idx) => <ErrorCard key={error.id} error={error} index={idx + 1} />)
            ) : (
              <div className="no-errors">No errors in this category</div>
            )}
          </div>
        </div>

        {/* Production Overview Card */}
        <div className="card production-overview-card">
          <div className="production-header">
            <div className="production-title-section">
              <h3 className="card-title">Production Overview</h3>
              <span className="production-value">7.2 kWh</span>
            </div>
            <div className="production-controls">
              <button className="time-filter-btn active">Day</button>
              <button className="time-filter-btn">Month</button>
              <button className="time-filter-btn">Year</button>
              <button className="time-filter-btn">Total</button>
              <span className="production-date">2025-12-12</span>
            </div>
          </div>
          <div className="production-chart-container">
            <div className="chart-wrapper" onMouseMove={handleChartHover} onMouseLeave={handleChartLeave}>
              <svg className="production-chart" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#159f6c", stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: "#159f6c", stopOpacity: 0.05 }} />
                  </linearGradient>
                </defs>
                <polyline
                  points="0,250 50,240 100,220 150,200 200,180 250,160 300,140 350,120 400,100 450,80 500,60 550,50 600,40 650,35 700,30 750,25 800,20 850,15 900,10 950,5 1000,0"
                  fill="none"
                  stroke="#159f6c"
                  strokeWidth="2"
                />
                <polygon
                  points="0,250 50,240 100,220 150,200 200,180 250,160 300,140 350,120 400,100 450,80 500,60 550,50 600,40 650,35 700,30 750,25 800,20 850,15 900,10 950,5 1000,0 1000,300 0,300"
                  fill="url(#chartGradient)"
                />
                <line x1="0" y1="300" x2="1000" y2="300" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* Hover line and point */}
                {hoveredPoint !== null && (
                  <>
                    <line 
                      x1={chartData[hoveredPoint].x} 
                      y1="0" 
                      x2={chartData[hoveredPoint].x} 
                      y2="300" 
                      stroke="#159f6c" 
                      strokeWidth="2" 
                      opacity="0.5"
                      strokeDasharray="5,5"
                    />
                    <circle 
                      cx={chartData[hoveredPoint].x} 
                      cy={chartData[hoveredPoint].y} 
                      r="5" 
                      fill="#159f6c"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
              
              {/* Tooltip */}
              {hoveredPoint !== null && (
                <div 
                  className="chart-tooltip" 
                  style={{
                    left: `calc(${(chartData[hoveredPoint].x / 1000) * 100}% - 60px)`,
                    top: `${Math.max(10, chartData[hoveredPoint].y - 50)}px`
                  }}
                >
                  <div className="tooltip-time">{chartData[hoveredPoint].time}</div>
                  <div className="tooltip-value">
                    <span className="tooltip-dot">●</span>
                    Solar: {((250 - chartData[hoveredPoint].y) / 250 * 4.2).toFixed(2)} kW
                  </div>
                </div>
              )}
            </div>
            <div className="chart-labels">
              <span>07:08</span>
              <span>08:19</span>
              <span>09:29</span>
              <span>10:39</span>
              <span>11:49</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
