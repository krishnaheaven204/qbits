"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./PlantDetails.css";

// Placeholder data
const plantData = {
  performance: {
    percentage: 36,
    keepLivePower: 1.79,
    capacity: 5.0,
  },
  production: [
    { title: "Day Production", value: 1.98, unit: "kWh" },
    { title: "Month Production", value: 171.25, unit: "kWh" },
    { title: "Year Production", value: 1834.67, unit: "kWh" },
    { title: "Total Production", value: 1948, unit: "kWh" },
    { title: "Keep-live power", value: 1.79, unit: "kW" },
    { title: "Capacity", value: 5.0, unit: "kWp" },
  ],
  plantInfo: {
    plantName: "Solar Plant Alpha",
    city: "Surat",
    phone: "9016001693",
    stationType: "Solar Station",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e938d440220?w=200&h=200&fit=crop",
  },
  errors: {
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
  },
};

// Water wave circle component
function WaterWaveCircle({ percentage }) {
  return (
    <div className="water-wave-container">
      <svg className="water-wave-svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#159f6c", stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: "#0d7a52", stopOpacity: 0.7 }} />
          </linearGradient>
          <clipPath id="circleClip">
            <circle cx="100" cy="100" r="85" />
          </clipPath>
        </defs>

        {/* Background circle */}
        <circle cx="100" cy="100" r="85" fill="#f0f4f8" />

        {/* Water fill */}
        <g clipPath="url(#circleClip)">
          <rect
            x="0"
            y={200 - (percentage / 100) * 200}
            width="200"
            height={(percentage / 100) * 200}
            fill="url(#waveGradient)"
          />
          <path
            className="wave-animation"
            d={`M0,${100 + (100 - (percentage / 100) * 100)} Q50,${95 + (100 - (percentage / 100) * 100)} 100,${100 + (100 - (percentage / 100) * 100)} T200,${100 + (100 - (percentage / 100) * 100)}`}
            fill="rgba(21, 159, 108, 0.4)"
          />
        </g>

        {/* Border circle */}
        <circle cx="100" cy="100" r="85" fill="none" stroke="#159f6c" strokeWidth="2" />
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
  const [activeTab, setActiveTab] = useState("all");
  const [errors, setErrors] = useState(plantData.errors.all);

  useEffect(() => {
    if (activeTab === "all") {
      setErrors(plantData.errors.all);
    } else if (activeTab === "going") {
      setErrors(plantData.errors.going);
    } else if (activeTab === "recovered") {
      setErrors(plantData.errors.recovered);
    }
  }, [activeTab]);

  return (
    <div className="plant-details-page">
      <div className="page-header">
        <button className="back-button" onClick={() => router.back()}>
          <span className="back-arrow">‹</span>
          <span className="back-text">Back</span>
        </button>
        <h1 className="page-title">Plant Details</h1>
      </div>

      {/* Top Layout: Two Cards */}
      <div className="top-cards-layout">
        {/* Card 1: Production Summary */}
        <div className="card card-1">
          <div className="card-header">
            <h3 className="card-title">Production Summary</h3>
          </div>
          <div className="card-content">
            <div className="circle-section">
              <WaterWaveCircle percentage={plantData.performance.percentage} />
              
            </div>
            <div className="stats-grid">
              {plantData.production.map((stat, idx) => (
                <StatBox key={idx} title={stat.title} value={stat.value} unit={stat.unit} />
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Inverter / Basic Info */}
        <div className="card card-2">
          <div className="card-header">
            <h3 className="card-title">Plant Information</h3>
          </div>
          <div className="card-content">
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
                  <span className="info-value">{plantData.plantInfo.plantName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">City</span>
                  <span className="info-value">{plantData.plantInfo.city}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{plantData.plantInfo.phone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Type of Plant</span>
                  <span className="info-value">{plantData.plantInfo.stationType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
