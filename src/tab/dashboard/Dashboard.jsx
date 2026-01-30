'use client';

import { useState, useEffect, useRef } from 'react';
import './Dashboard.css';

const MetricIcon = ({ type }) => {
  switch (type) {
    case 'plants':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 20v-8" />
          <path d="M10 20v-4" />
          <path d="M14 20v-6" />
          <path d="M18 20v-10" />
          <path d="M4 20h16" />
        </svg>
      );
    case 'normal':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 9 19 20 6" />
        </svg>
      );
    case 'alarm':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
        </svg>
      );
    case 'offline':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13a7 7 0 0 1 14 0" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="m2 2 20 20" />
        </svg>
      );
    case 'power':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v10" />
          <path d="M7.5 4.21A8 8 0 1 0 12 4" />
        </svg>
      );
    case 'capacity':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h6" />
        </svg>
      );
    case 'day':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case 'total':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M8 17l4-4 4 3 4-6" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Dashboard() {
  const [widgetData, setWidgetData] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchWidgetData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch('https://qbits.quickestimate.co/api/v1/dashboard/widget-total', {
          method: 'GET',
          headers,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json.success && json.data) {
          setWidgetData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch widget totals:', err);
      }
    };

    fetchWidgetData();
  }, []);

  const statusMetrics = [
    { label: 'Total Plants', value: widgetData?.all_plant ?? '—', tone: 'mint', icon: 'plants' },
    { label: 'Normal', value: widgetData?.normal_plant ?? '—', tone: 'indigo', icon: 'normal' },
    { label: 'Alarm', value: widgetData?.alarm_plant ?? '—', tone: 'amber', icon: 'alarm' },
    { label: 'Offline', value: widgetData?.offline_plant ?? '—', tone: 'slate', icon: 'offline' },
  ];

  const energyMetrics = [
    { label: 'Keep-live Power (kW)', value: widgetData?.power ?? '—', tone: 'sky', icon: 'power' },
    { label: 'Capacity (kW)', value: widgetData?.capacity ?? '—', tone: 'violet', icon: 'capacity' },
    { label: 'Day Production (kWh)', value: widgetData?.day_power ?? '—', tone: 'mint', icon: 'day' },
    { label: 'Total Production (kWh)', value: widgetData?.total_power ?? '—', tone: 'rose', icon: 'total' },
  ];

  return (
    <div className="dashboard-page">
      <div className="card qbits-card dashboard-shell">
        <div className="dashboard-header">
          <h4 className="dashboard-title mb-1">Dashboard</h4>
          <p className="dashboard-subtitle mb-0">Professional, minimal snapshot of plant health and energy</p>
        </div>

        <div className="metric-row">
          <div className="metric-block">
            <div className="metric-strip">
              {statusMetrics.map((metric) => (
                <div key={metric.label} className={`metric-card tone-${metric.tone}`}>
                  <div className={`metric-icon-bubble tone-${metric.tone}`}>
                    <MetricIcon type={metric.icon} />
                  </div>
                  <div className="metric-label">{metric.label}</div>
                  <div className="metric-value">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-block">
            <div className="metric-strip">
              {energyMetrics.map((metric) => (
                <div key={metric.label} className={`metric-card tone-${metric.tone}`}>
                  <div className={`metric-icon-bubble tone-${metric.tone}`}>
                    <MetricIcon type={metric.icon} />
                  </div>
                  <div className="metric-label">{metric.label}</div>
                  <div className="metric-value">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

