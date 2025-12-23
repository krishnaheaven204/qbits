'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './InverterSummary.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

// Wave animation lifted from PlantDetails (SVG sine paths)
function WaterWaveCircle({ percentage = 25 }) {
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
          <clipPath id="summaryCircleClip">
            <circle cx="100" cy="100" r="98" />
          </clipPath>
        </defs>

        <circle cx="100" cy="100" r="98" fill="white" stroke="#159f6c" strokeWidth="1.6" />

        <g clipPath="url(#summaryCircleClip)" id="waveGroup">
          <g className="wave2">
            <path d={wave2Path} fill="#159f6c" />
          </g>
          <g className="wave1">
            <path d={wave1Path} fill="#159f6c" />
          </g>
        </g>
      </svg>

      <div className="wave-text">
        <span className="wave-value">{percentage}%</span>
      </div>
    </div>
  );
}

function BasicInfo({ items }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <div className="info-card basic-card">
      <div className="info-title">Basic Info</div>
      <div className="basic-table">
        <div className="basic-header-spacer" />
        {rows.map((row, idx) => (
          <div key={idx} className="basic-row">
            {row.map((item) => (
              <div key={item.label} className="basic-cell">
                <span className="basic-label">{item.label}</span>
                <span className="basic-value">{item.value}</span>
              </div>
            ))}
            {row.length < 3 &&
              Array.from({ length: 3 - row.length }).map((_, i) => (
                <div key={`empty-${i}`} className="basic-cell empty" />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductionSummary({ stats, percentage = 25 }) {
  return (
    <div className="prod-card">
      <div className="prod-wave-center">
        <WaterWaveCircle percentage={percentage} />
      </div>
      <div className="prod-tile-grid">
        {stats.map((tile) => (
          <div key={tile.label} className="tile">
            <div className="tile-value main">{tile.value}</div>
            <div className="tile-label main">{tile.label}</div>
            {tile.unit && <div className="tile-unit">{tile.unit}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InverterSummary({ inverterId, plantNo }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [alarms, setAlarms] = useState([]);
  const [loadingAlarms, setLoadingAlarms] = useState(false);
  const [alarmCurrentPage, setAlarmCurrentPage] = useState(1);
  const alarmsPerPage = 3;
  const [chartTab, setChartTab] = useState('day');

  const basicInfo = useMemo(
    () => [
      { label: 'Device', value: 'QB-5KTLD' },
      { label: 'No.', value: inverterId || '—' },
      { label: 'RS485 ID', value: '1' },
      { label: 'Collector', value: '250508024' },
      { label: 'Record Time', value: '2025-08-12' },
      { label: 'Serial', value: '250508024' },
      { label: 'Time-zone', value: '55' },
      { label: 'Panel', value: '330 W' },
      { label: 'Panel Qty.', value: '17 Pieces' },
    ],
    [inverterId]
  );

  const prodStats = useMemo(
    () => [
      { label: 'Keep-live power', value: '1.4 kW' },
      { label: 'Capacity', value: '5.6 kWp' },
      { label: 'Day Production', value: '1.17 kWh' },
      { label: 'Total Production', value: '2137 kWh' },
      { label: 'kpi', value: '0.2' },
      { label: 'Work Time', value: '2:8:0' },
    ],
    []
  );

  const breadcrumbs = [
    { label: 'Back', action: () => router.back() },
    { label: 'Inverter' },
    { label: new Date().toLocaleString() },
  ];

  const acInfo = [
    { label: 'Aphase', value: '240.3V / 5.54A' },
    { label: 'Frequency', value: '49.96Hz' },
    { label: 'Power', value: '1.4kW' },
    { label: 'Temperature(IGBT)', value: '38.2°C' },
  ];

  const dcRows = [
    { label: 'PV1', voltage: '241.7V', current: '4.42A', power: '1068W' },
    { label: 'PV2', voltage: '288V', current: '3.77A', power: '1086W' },
  ];

  const acRows = [
    [
      { label: 'Aphase', value: '240.3V / 5.54A' },
      { label: 'Frequency', value: '49.96Hz' },
    ],
    [{ label: 'Power', value: '1.4kW' }],
    [{ label: 'Temperature(IGBT)', value: '38.2°C' }],
  ];

  // Alarm card component (same design as plant details)
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
          <div className="error-model">{alarm.inverter_id || inverterId || 'N/A'}</div>
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

  // Fetch alarms
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
        if (token) headers.Authorization = `Bearer ${token}`;

        const statusParam = activeTab === 'all' ? -1 : activeTab === 'going' ? 0 : 1;
        const url = `https://qbits.quickestimate.co/api/v1/faults?plant_id=${plantNo ?? ''}&inverter_id=${inverterId ?? ''}&status=${statusParam}`;

        const response = await fetch(url, { method: 'GET', headers, signal: abortController.signal });
        if (response.ok) {
          const data = await response.json();
          const alarmData =
            data?.data?.faults?.data ||
            data?.data?.faults ||
            data?.data ||
            data?.faults ||
            [];
          setAlarms(Array.isArray(alarmData) ? alarmData : []);
        } else {
          setAlarms([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') setAlarms([]);
      } finally {
        setLoadingAlarms(false);
      }
    };

    fetchAlarms();
    return () => abortController.abort();
  }, [plantNo, inverterId, activeTab]);

  useEffect(() => {
    setAlarmCurrentPage(1);
  }, [activeTab]);

  const getPaginatedAlarms = () => {
    const startIndex = (alarmCurrentPage - 1) * alarmsPerPage;
    return alarms.slice(startIndex, startIndex + alarmsPerPage);
  };

  const getTotalAlarmPages = () => Math.ceil(alarms.length / alarmsPerPage);

  const handleAlarmPageChange = (page) => {
    if (page < 1 || page > getTotalAlarmPages()) return;
    setAlarmCurrentPage(page);
  };

  const chartData = useMemo(() => {
    if (chartTab === 'day') {
      const labels = ['07:05', '07:35', '08:05', '08:35', '09:05', '09:35', '10:05', '10:35', '11:05'];
      const values = [0, 0.2, 0.4, 0.8, 1.1, 1.4, 1.7, 1.9, 2.2];
      return {
        labels,
        datasets: [
          {
            label: 'Power',
            data: values,
            fill: true,
            tension: 0.35,
            borderColor: '#e74c3c',
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
              gradient.addColorStop(0, 'rgba(231, 76, 60, 0.18)');
              gradient.addColorStop(1, 'rgba(231, 76, 60, 0.02)');
              return gradient;
            },
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
        ],
      };
    }

    const base = chartTab === 'month'
      ? { labels: ['W1', 'W2', 'W3', 'W4'], data: [18, 22, 26, 24] }
      : chartTab === 'year'
        ? { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], data: [120, 140, 132, 155, 162, 170, 168, 174, 165, 150, 142, 138] }
        : { labels: ['2021', '2022', '2023', '2024', '2025'], data: [820, 930, 980, 1050, 1120] };

    return {
      labels: base.labels,
      datasets: [
        {
          label: 'Energy',
          data: base.data,
          backgroundColor: 'rgba(231, 76, 60, 0.15)',
          borderColor: '#e74c3c',
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    };
  }, [chartTab]);

  const chartOptions = useMemo(() => {
    const common = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.82)',
          borderColor: '#e74c3c',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#fff',
        },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
          beginAtZero: true,
        },
      },
    };
    if (chartTab === 'day') return common;
    return {
      ...common,
      plugins: { ...common.plugins },
    };
  }, [chartTab]);

  return (
    <div className="summary-page">
      <div className="summary-header">
        <div className="breadcrumb-inline">
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx === 0 ? (
                <button className="breadcrumb-item" onClick={item.action}>
                  ◀ {item.label}
                </button>
              ) : (
                <span className="breadcrumb-item muted">{item.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && <span className="breadcrumb-sep">›</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="summary-layout">
        <BasicInfo items={basicInfo} />
        <ProductionSummary stats={prodStats} percentage={25} />
      </div>

      <div className="lower-layout">
        <div className="stacked-cards">
          <div className="info-card slim">
            <div className="info-title">AC Info</div>
            <div className="ac-table">
              {acRows.map((row, idx) => (
                <div key={idx} className="ac-row">
                  {row.map((item, i) => (
                    <div key={i} className="ac-cell">
                      <span className="ac-label">{item.label}</span>
                      <span className="ac-value">{item.value}</span>
                    </div>
                  ))}
                  {row.length === 1 && <div className="ac-cell empty" />}
                </div>
              ))}
            </div>
          </div>

          <div className="info-card slim">
            <div className="info-title">DC Info</div>
            <div className="dc-table">
              <div className="dc-header">
                <span></span>
                <span>Voltage</span>
                <span>Current</span>
                <span>Power</span>
              </div>
              {dcRows.map((row) => (
                <div key={row.label} className="dc-row">
                  <span className="dc-label">{row.label}</span>
                  <span className="dc-value">{row.voltage}</span>
                  <span className="dc-value">{row.current}</span>
                  <span className="dc-value">{row.power}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card error-log-card compact">
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
              <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
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

      <div className="card chart-card compact">
        <div className="chart-head">
          <div className="chart-title">String information (current / A)</div>
          <div className="chart-controls">
            <div className="chart-tabs">
              {['day', 'month', 'year', 'total'].map((tab) => (
                <button
                  key={tab}
                  className={`chart-tab ${chartTab === tab ? 'active' : ''}`}
                  onClick={() => setChartTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="chart-date">{new Date().toISOString().slice(0, 10)}</div>
          </div>
        </div>
        <div className="chart-body">
          {chartTab === 'day' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}
