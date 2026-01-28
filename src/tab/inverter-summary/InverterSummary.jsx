'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [wavePath, setWavePath] = React.useState('');
  const [offset, setOffset] = React.useState(0);

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

    setWavePath(generateWave(offset));
  }, [percentage, offset]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 2) % 400);
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
          <g className="wave1">
            <path d={wavePath} fill="#159f6c" />
          </g>
        </g>
      </svg>

      <div className="wave-text">
        <span className="wave-value">{percentage}%</span>
      </div>
    </div>
  );
}

function BasicInfo({ items, loading }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <div className="info-card basic-card">
      <div className="info-title">Basic Info</div>
      {loading ? (
        <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
      ) : (
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
      )}
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
  const metricOptions = useMemo(
    () => [
      'Power',
      'AphaseVoltage',
      'BphaseVoltage',
      'CphaseVoltage',
      'AphaseCurrent',
      'BphaseCurrent',
      'CphaseCurrent',
      'Temperature',
      'Frequency',
      'DC Current',
      'DC Current2',
      'DC Voltage',
      'DC Voltage2',
      'DC Voltage3',
      'DC Current3',
      'DC Voltage4',
      'DC Current4',
      'DC Voltage5',
      'DC Current5',
      'DC Voltage6',
      'DC Current6',
      'DC Voltage7',
      'DC Current7',
      'DC Voltage8',
      'DC Current8',
      'DC Voltage9',
      'DC Current9',
      'DC Voltage10',
      'DC Current10',
    ],
    []
  );
  const [selectedMetrics, setSelectedMetrics] = useState(() => ['Power']);
  const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false);
  const metricDropdownRef = useRef(null);

  const colorPalette = [
    '#e74c3c',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ef4444',
    '#0ea5e9',
    '#22c55e',
    '#f97316',
    '#a855f7',
    '#6366f1',
    '#14b8a6',
    '#fbbf24',
    '#f472b6',
    '#65a30d',
    '#0891b2',
    '#d946ef',
    '#ea580c',
    '#84cc16',
    '#dc2626',
  ];

  const [basicInfoData, setBasicInfoData] = useState(null);
  const [loadingBasicInfo, setLoadingBasicInfo] = useState(false);

  const basicInfo = useMemo(() => {
    const inv = basicInfoData || {};
    const toDisplay = (value) => (value === null || value === undefined || value === '' ? '—' : value);
    return [
      { label: 'Device', value: toDisplay(inv.model) },
      { label: 'No.', value: toDisplay(inv.id ?? inverterId) },
      { label: 'RS485 ID', value: toDisplay(inv.inverter_no) },
      { label: 'Collector', value: toDisplay(inv.collector_address) },
      { label: 'Record Time', value: toDisplay(inv.record_time) },
      { label: 'Serial', value: toDisplay(inv.collector_address) },
      { label: 'Time-zone', value: toDisplay(inv.timezone) },
      { label: 'Panel', value: toDisplay(inv.panel) },
      { label: 'Panel Qty.', value: toDisplay(inv.panel_num) },
    ];
  }, [basicInfoData, inverterId]);

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

  const formatValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === '') return '—';
    const num = Number(value);
    const display = Number.isFinite(num) ? num : value;
    return suffix ? `${display} ${suffix}` : display;
  };

  const computePower = (voltage, current) => {
    const v = Number(voltage);
    const c = Number(current);
    if (Number.isFinite(v) && Number.isFinite(c)) {
      return `${(v * c).toFixed(2)} W`;
    }
    return '—';
  };

  const acRows = useMemo(() => {
    const inv = basicInfoData || {};
    return [
      [
        { label: 'Aphase', value: formatValue(inv.acVoltage, 'V') },
        { label: 'Frequency', value: formatValue(inv.acFrequency, 'Hz') },
      ],
      [{ label: 'Power', value: formatValue(inv.acMomentaryPower, 'kW') }],
      [{ label: 'Temperature(IGBT)', value: formatValue(inv.temperature, '°C') }],
    ];
  }, [basicInfoData]);

  const dcRows = useMemo(() => {
    const inv = basicInfoData || {};
    const pv1Voltage = inv.dcVoltage;
    const pv1Current = inv.dcCurrent;
    const pv2Voltage = inv.dcVoltage2;
    const pv2Current = inv.dcCurrent2;

    const pv1Power = computePower(pv1Voltage, pv1Current);
    const pv2Power = computePower(pv2Voltage, pv2Current);

    return [
      { label: 'PV1', voltage: formatValue(pv1Voltage, 'V'), current: formatValue(pv1Current, 'A'), power: pv1Power },
      { label: 'PV2', voltage: formatValue(pv2Voltage, 'V'), current: formatValue(pv2Current, 'A'), power: pv2Power },
    ];
  }, [basicInfoData]);

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

    const displayModel =
      alarm?.model ||
      alarm?.inverter?.model ||
      alarm?.inverter?.inverter_model ||
      alarm?.inverter?.model_name ||
      alarm?.inverter_model ||
      alarm?.inverterModel ||
      alarm?.device_model ||
      alarm?.model_name ||
      alarm?.inverter_name ||
      alarm?.inverter_id ||
      inverterId ||
      'N/A';

    return (
      <div className={`error-card ${statusClass}`}>
        <div className="error-header">
          <span className={`error-status ${statusClass}`}>{statusLabel}</span>
          <span className="error-index">#{index}</span>
        </div>

        <div className="error-body">
          <div className="error-model">{displayModel}</div>
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

  const alarmSortKey = (alarm) => {
    const start = new Date(alarm?.stime || alarm?.start_time || alarm?.start || 0).getTime() || 0;
    const end = new Date(alarm?.etime || alarm?.end_time || alarm?.end || 0).getTime() || 0;
    return Math.max(start, end);
  };

  const sortedAlarms = useMemo(() => {
    return [...alarms].sort((a, b) => alarmSortKey(b) - alarmSortKey(a));
  }, [alarms]);

  // Fetch basic info from latest inverter data
  useEffect(() => {
    if (!plantNo) {
      setBasicInfoData(null);
      return;
    }

    const abortController = new AbortController();

    const fetchBasicInfo = async () => {
      try {
        setLoadingBasicInfo(true);

        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const url = `https://qbits.quickestimate.co/api/v1/inverter/latest_data?plantId=${plantNo}`;
        const response = await fetch(url, { method: 'GET', headers, signal: abortController.signal });
        if (response.ok) {
          const data = await response.json();
          const inverterCandidates = [
            data?.data?.inverters?.data,
            data?.data?.inverters,
            data?.inverters?.data,
            data?.inverters,
            data?.data,
            data?.inverter,
            data,
          ];

          let inverterList = [];
          for (const candidate of inverterCandidates) {
            if (Array.isArray(candidate)) {
              inverterList = candidate;
              break;
            }
            if (candidate && typeof candidate === 'object') {
              // If it's an object with numeric/string keys, take values as list
              const values = Object.values(candidate);
              if (values.length > 0 && values.every((v) => typeof v === 'object')) {
                inverterList = values;
                break;
              }
              inverterList = [candidate];
              break;
            }
          }

          let inverter = null;
          if (Array.isArray(inverterList) && inverterList.length > 0) {
            if (inverterId) {
              inverter = inverterList.find((inv) => String(inv.id) === String(inverterId)) || inverterList[0];
            } else {
              inverter = inverterList[0];
            }
          }

          // Merge latest_detail into top-level for easy access in UI
          if (inverter) {
            const detail = inverter.latest_detail || inverter.latestDetail || {};
            const merged = { ...inverter, ...detail };
            setBasicInfoData(merged);
          } else {
            setBasicInfoData(null);
          }
        } else {
          setBasicInfoData(null);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setBasicInfoData(null);
        }
      } finally {
        setLoadingBasicInfo(false);
      }
    };

    fetchBasicInfo();
    return () => abortController.abort();
  }, [plantNo, inverterId]);

  const getPaginatedAlarms = () => {
    const startIndex = (alarmCurrentPage - 1) * alarmsPerPage;
    return sortedAlarms.slice(startIndex, startIndex + alarmsPerPage);
  };

  const getTotalAlarmPages = () => Math.ceil(sortedAlarms.length / alarmsPerPage);

  const handleAlarmPageChange = (page) => {
    if (page < 1 || page > getTotalAlarmPages()) return;
    setAlarmCurrentPage(page);
  };

  const chartData = useMemo(() => {
    const dayLabels = ['07:05', '07:35', '08:05', '08:35', '09:05', '09:35', '10:05', '10:35', '11:05'];
    const monthLabels = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
    const yearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalLabels = ['2021', '2022', '2023', '2024', '2025'];

    const getBaseSeries = (tab) => {
      if (tab === 'day') return [0, 0.2, 0.4, 0.8, 1.1, 1.4, 1.7, 1.9, 2.2];
      if (tab === 'month')
        return [
          16.2, 15.8, 15.6, 16.5, 15.9, 16.8, 17.2, 17.5, 16.9, 17.1, 16.4, 16.0, 15.7, 15.4, 15.2, 15.9, 16.3, 16.0,
          15.5, 15.7, 16.2, 14.1, 15.0, 10.5, 0, 0, 0, 0, 0, 0, 0,
        ];
      if (tab === 'year') return [120, 140, 132, 155, 162, 170, 168, 174, 165, 150, 142, 138];
      return [820, 930, 980, 1050, 1120];
    };

    const labels =
      chartTab === 'day'
        ? dayLabels
        : chartTab === 'month'
          ? monthLabels
          : chartTab === 'year'
            ? yearLabels
            : totalLabels;

    // Month tab: single Power bar chart, styled like reference
    if (chartTab === 'month') {
      const powerData = getBaseSeries('month');
      const powerColor = '#e74c3c';
      return {
        labels: monthLabels,
        datasets: [
          {
            label: 'Power',
            data: powerData,
            backgroundColor: `${powerColor}d9`,
            borderColor: powerColor,
            borderWidth: 1,
            borderRadius: 4,
            hoverBackgroundColor: powerColor,
            barThickness: 14,
          },
        ],
      };
    }

    const datasets = selectedMetrics.map((metric, idx) => {
      const base = getBaseSeries(chartTab);
      // Slightly vary each metric for visual separation
      const variation = base.map((val, i) => val + (idx % 3 === 0 ? i * 0.05 : idx % 3 === 1 ? Math.sin(i * 0.5) * 0.3 : i * 0.02));
      const color = colorPalette[idx % colorPalette.length];
      const isLine = chartTab === 'day';
      return {
        label: metric,
        data: variation,
        borderColor: color,
        backgroundColor: isLine
          ? (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
              gradient.addColorStop(0, `${color}22`);
              gradient.addColorStop(1, `${color}05`);
              return gradient;
            }
          : `${color}33`,
        fill: isLine,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      };
    });

    return { labels, datasets };
  }, [chartTab, selectedMetrics, colorPalette]);

  const chartOptions = useMemo(() => {
    const common = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      hover: { mode: 'index', intersect: false },
      animation: {
        duration: 450,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 10 } },
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

  const hoverLinePlugin = useMemo(
    () => ({
      id: 'hoverLine',
      afterDatasetsDraw(chart) {
        const {
          ctx,
          tooltip,
          chartArea: { top, bottom },
          scales: { x },
        } = chart;
        if (!tooltip || !tooltip.getActiveElements().length) return;
        const activePoint = tooltip.getActiveElements()[0];
        const xPos = x.getPixelForValue(activePoint.index);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xPos, top);
        ctx.lineTo(xPos, bottom);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      },
    }),
    []
  );

  const toggleMetric = (metric) => {
    setSelectedMetrics((prev) => {
      const exists = prev.includes(metric);
      if (exists) {
        if (prev.length === 1) return prev; // keep at least one metric
        return prev.filter((m) => m !== metric);
      }
      return [...prev, metric];
    });
  };

  // Close metric menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isMetricMenuOpen) return;
      if (metricDropdownRef.current && !metricDropdownRef.current.contains(e.target)) {
        setIsMetricMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMetricMenuOpen]);

  return (
    <div className="summary-page">
      <div className="summary-header">
        <div className="inverter-breadcrumb-inline">
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx === 0 ? (
                <button className="inverter-breadcrumb-item" onClick={item.action}>
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
        <BasicInfo items={basicInfo} loading={loadingBasicInfo} />
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
            <h3 className="inverter-card-title">Alarm</h3>
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
            <div className="metric-dropdown" ref={metricDropdownRef}>
              <button
                type="button"
                className="metric-trigger"
                onClick={() => setIsMetricMenuOpen((s) => !s)}
              >
                Metrics ({selectedMetrics.length})
                <span className="chevron">{isMetricMenuOpen ? '▲' : '▼'}</span>
              </button>
              {isMetricMenuOpen && (
                <div className="metric-menu">
                  {metricOptions.map((metric) => (
                    <label key={metric} className="metric-option">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric)}
                        onChange={() => toggleMetric(metric)}
                      />
                      <span>{metric}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
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
            <Line data={chartData} options={chartOptions} plugins={[hoverLinePlugin]} />
          ) : (
            <Bar data={chartData} options={chartOptions} plugins={[hoverLinePlugin]} />
          )}
        </div>
      </div>
    </div>
  );
}
