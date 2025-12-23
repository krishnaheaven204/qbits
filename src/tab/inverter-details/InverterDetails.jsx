'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './InverterDetails.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value}</span>
  </div>
);

// Alarm card component (mirrors PlantDetails)
function AlarmCard({ alarm, index }) {
  const statusLabel = alarm.status === 1 ? 'Recovered' : alarm.status === 0 ? 'Fault' : 'Unknown';
  const statusClass = alarm.status === 1 ? 'recovered' : alarm.status === 0 ? 'fault' : 'offline';
  const messages =
    Array.isArray(alarm.message_en) && alarm.message_en.length > 0
      ? alarm.message_en
      : typeof alarm.message_en === 'string' && alarm.message_en.trim() !== ''
        ? [alarm.message_en]
        : ['No message'];

  const formatAlarmDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className={`error-card ${statusClass}`}>
      <div className="error-header">
        <span className={`error-status ${statusClass}`}>{statusLabel}</span>
        <span className="error-index">#{index}</span>
      </div>

      <div className="error-body">
        <div className="error-model">{alarm.inverter_id || 'N/A'}</div>
        <div className="error-text">
          {messages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
        <div className="error-datetime">
          <div className="datetime-item">
            <span className="datetime-label">Start</span>
            <span>{formatAlarmDateTime(alarm.stime)}</span>
          </div>
          <div className="datetime-item">
            <span className="datetime-label">End</span>
            <span>{formatAlarmDateTime(alarm.etime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const safeNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const formatValue = (value, decimals = 2) => {
  if (value === null || value === undefined) return '--';
  const num = safeNumber(value);
  if (num === null) return '--';
  return num.toFixed(decimals);
};

// Water wave circle (from plant details)
function WaterWaveCircle({ percentage }) {
  const [wave1Path, setWave1Path] = React.useState('');
  const [wave2Path, setWave2Path] = React.useState('');
  const [offset1, setOffset1] = React.useState(0);
  const [offset2, setOffset2] = React.useState(50);

  React.useEffect(() => {
    const generateWave = (offset = 0) => {
      const width = 400;
      const amplitude = 12;
      const waveY = 200 - percentage * 2;
      let path = '';
      for (let x = 0; x <= width; x++) {
        const y = waveY + Math.sin((x + offset) * 0.03) * amplitude;
        path += `${x === 0 ? 'M' : 'L'} ${x},${y} `;
      }
      path += `L ${width},200 L 0,200 Z`;
      return path;
    };

    setWave1Path(generateWave(offset1));
    setWave2Path(generateWave(offset2));
  }, [percentage, offset1, offset2]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setOffset1((prev) => (prev + 2) % 400);
      setOffset2((prev) => (prev + 3) % 400);
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

        <circle cx="100" cy="100" r="98" fill="white" stroke="#159f6c" strokeWidth="2" />

        <g clipPath="url(#circleClip)" id="waveGroup">
          <g className="wave2">
            <path d={wave2Path} fill="#159f6c" />
          </g>
          <g className="wave1">
            <path d={wave1Path} fill="#159f6c" />
          </g>
        </g>
      </svg>

      <div className="percentage-text">
        <span className="percentage-value">{percentage}%</span>
      </div>
    </div>
  );
}

function StatBox({ title, value, unit }) {
  return (
    <div className="stat-box">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {unit && <div className="stat-unit">{unit}</div>}
    </div>
  );
}

export default function InverterDetails({ inverterId, plantNo }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('inverterAlarmActiveTab') || 'all';
    }
    return 'all';
  });
  const [alarms, setAlarms] = useState([]);
  const [loadingAlarms, setLoadingAlarms] = useState(false);
  const [alarmCurrentPage, setAlarmCurrentPage] = useState(1);
  const alarmsPerPage = 3;

  const basicInfo = useMemo(
    () => ([
      { label: 'Device', value: 'QB-4KTLD' },
      { label: 'No.', value: inverterId || '—' },
      { label: 'RS485 ID', value: '1' },
      { label: 'Collector', value: '250908024' },
      { label: 'Record Time', value: '2025-08-12' },
      { label: 'Serial', value: '250908024' },
      { label: 'Time-zone', value: '55' },
      { label: 'Panel', value: '330 W' },
      { label: 'Panel Qty.', value: '17 Pieces' },
    ]),
    [inverterId]
  );

  const getPercentage = () => 45;

  const getProductionData = () => ([
    { title: 'Keep-live power', value: formatValue(2.5, 2), unit: 'kW' },
    { title: 'Capacity', value: formatValue(5.6, 1), unit: 'kWp' },
    { title: 'Day Production', value: formatValue(3.3, 1), unit: 'kWh' },
    { title: 'Month Production', value: formatValue(112.4, 1), unit: 'kWh' },
    { title: 'Year Production', value: formatValue(1265.7, 1), unit: 'kWh' },
    { title: 'Total Production', value: formatValue(2126, 1), unit: 'kWh' },
    { title: 'KPI', value: formatValue(0.6, 1) },
    { title: 'Work Time', value: '41:44:04' },
  ]);

  const acInfo = [
    { label: 'Aphase', value: '246.2V / 9.32A' },
    { label: 'Frequency', value: '50.07Hz' },
    { label: 'Power', value: '2.5 kW' },
    { label: 'Temperature (IGBT)', value: '45.4°C' },
  ];

  const dcInfo = [
    { label: 'PV1 Voltage', value: '237.4V' },
    { label: 'PV1 Current', value: '5.25A' },
    { label: 'PV1 Power', value: '1240W' },
    { label: 'PV2 Voltage', value: '233V' },
    { label: 'PV2 Current', value: '4.56A' },
    { label: 'PV2 Power', value: '1302W' },
  ];

  const chartData = useMemo(() => {
    const labels = [
      '07:05',
      '07:35',
      '08:05',
      '08:35',
      '09:05',
      '09:35',
      '10:05',
      '10:35',
      '11:05',
      '11:35',
      '12:05',
      '12:35',
      '13:05',
      '13:35',
      '14:05',
    ];
    const values = [0, 0.2, 0.35, 0.5, 0.8, 1.1, 1.4, 1.65, 2.1, 1.9, 2.3, 2.6, 2.4, 2.1, 1.8];
    return {
      labels,
      datasets: [
        {
          label: 'Power',
          data: values,
          fill: true,
          tension: 0.4,
          borderColor: '#159f6c',
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, 'rgba(21, 159, 108, 0.25)');
            gradient.addColorStop(1, 'rgba(21, 159, 108, 0.02)');
            return gradient;
          },
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.82)',
        borderColor: '#159f6c',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toFixed(2)} kW`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11, family: "'Nunito', sans-serif" } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 11, family: "'Nunito', sans-serif" } },
        grid: { color: 'rgba(0,0,0,0.05)' },
        beginAtZero: true,
      },
    },
  };

  // Fetch alarms from API (same as PlantDetails, scoped to inverter)
  useEffect(() => {
    if (!plantNo && !inverterId) {
      setAlarms([]);
      return;
    }

    const abortController = new AbortController();

    const fetchAlarms = async () => {
      try {
        setLoadingAlarms(true);

        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers = { Accept: 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const statusParam = activeTab === 'all' ? -1 : activeTab === 'going' ? 0 : 1;
        const url = `https://qbits.quickestimate.co/api/v1/faults?plant_id=${plantNo ?? ''}&inverter_id=${inverterId ?? ''}&status=${statusParam}`;

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: abortController.signal,
        });

        if (response.ok) {
          const data = await response.json();
          const alarmData = data?.data?.faults?.data || [];
          setAlarms(Array.isArray(alarmData) ? alarmData : []);
        } else {
          setAlarms([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setAlarms([]);
        }
      } finally {
        setLoadingAlarms(false);
      }
    };

    fetchAlarms();
    return () => abortController.abort();
  }, [plantNo, inverterId, activeTab]);

  useEffect(() => {
    setAlarmCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('inverterAlarmActiveTab', activeTab);
    }
  }, [activeTab]);

  const getPaginatedAlarms = () => {
    const startIndex = (alarmCurrentPage - 1) * alarmsPerPage;
    const endIndex = startIndex + alarmsPerPage;
    return alarms.slice(startIndex, endIndex);
  };

  const getTotalAlarmPages = () => Math.ceil(alarms.length / alarmsPerPage);

  const handleAlarmPageChange = (page) => {
    if (page < 1 || page > getTotalAlarmPages()) return;
    setAlarmCurrentPage(page);
  };

  return (
    <div className="inverter-detail-wrapper">
      <div className="detail-header">
        <div className="breadcrumb-inline">
          <button className="breadcrumb-item-inline" onClick={() => router.back()}>
            <span className="breadcrumb-icon">◀</span>
            <span className="breadcrumb-text">Back</span>
          </button>
          <span className="breadcrumb-separator-inline">›</span>
          <span className="breadcrumb-item-inline">Inverter {inverterId || '--'}</span>
          <span className="breadcrumb-separator-inline">›</span>
          <span className="breadcrumb-item-inline">2025-12-22 11:19:58</span>
        </div>
        
      </div>

      <div className="card-grid top">
        <div className="card basic-card">
          <div className="card-head">
            <h3>Basic Info</h3>
             
          </div>
          <div className="card-content basic-content">
            <div className="basic-grid">
              {basicInfo.map((item) => (
                <InfoRow key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-head">
            <h3>Production Summary</h3>
          </div>
          <div className="card-content summary-content">
            <div className="circle-section">
              <WaterWaveCircle percentage={getPercentage()} />
            </div>
            <div className="stats-grid">
              {getProductionData().map((stat, idx) => (
                <StatBox key={idx} title={stat.title} value={stat.value} unit={stat.unit} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid middle">
        <div className="card info-card">
          <div className="card-head"><h4>AC Info</h4></div>
          <div className="info-list">
            {acInfo.map((item) => (
              <InfoRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </div>

        <div className="card info-card">
          <div className="card-head"><h4>DC Info</h4></div>
          <div className="info-list">
            {dcInfo.map((item) => (
              <InfoRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </div>

        <div className="card error-log-card">
          <div className="error-log-header">
            <h3 className="card-title">Alarm</h3>
            <div className="error-tabs">
              <button
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`tab-button ${activeTab === 'going' ? 'active' : ''}`}
                onClick={() => setActiveTab('going')}
              >
                Going
              </button>
              <button
                className={`tab-button ${activeTab === 'recovered' ? 'active' : ''}`}
                onClick={() => setActiveTab('recovered')}
              >
                Recovered
              </button>
            </div>
          </div>

          <div className="error-log-content">
            {loadingAlarms ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : alarms.length > 0 ? (
              <>
                {getPaginatedAlarms().map((alarm, idx) => (
                  <AlarmCard
                    key={alarm.id ?? idx}
                    alarm={alarm}
                    index={(alarmCurrentPage - 1) * alarmsPerPage + idx + 1}
                  />
                ))}
                {getTotalAlarmPages() > 1 && (
                  <div className="alarm-pagination-container">
                    <button
                      className="alarm-pagination-arrow"
                      onClick={() => handleAlarmPageChange(alarmCurrentPage - 1)}
                      disabled={alarmCurrentPage === 1}
                    >
                      ◀
                    </button>
                    {Array.from({ length: getTotalAlarmPages() }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`alarm-pagination-number ${alarmCurrentPage === page ? 'active' : ''}`}
                        onClick={() => handleAlarmPageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="alarm-pagination-arrow"
                      onClick={() => handleAlarmPageChange(alarmCurrentPage + 1)}
                      disabled={alarmCurrentPage === getTotalAlarmPages()}
                    >
                      ▶
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-errors">No alarm records</div>
            )}
          </div>
        </div>
      </div>

      <div className="card chart-card">
        <div className="card-head">
          <h3>Production Overview</h3>
          <div className="chart-tabs">
            <button className="tab active">Day</button>
            <button className="tab">Month</button>
            <button className="tab">Year</button>
            <button className="tab">Total</button>
            <div className="date-chip">2025-12-22</div>
          </div>
        </div>
        <div className="chart-body">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
