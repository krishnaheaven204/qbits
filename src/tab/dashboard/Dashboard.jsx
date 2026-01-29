'use client';

import { useState, useEffect, useRef } from 'react';
import './Dashboard.css';

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

  return (
    <div className="dashboard-page">
      {/* Main Dashboard Layout */}
      <div className="row">
        <div className="col-12">
          <div className="card qbits-card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 dashboard-title">Dashboard</h5>
              </div>
            </div>
            <div className="card-body">
              <>
                {/* Top Row - Status Cards */}
                <div className="dashboard-metrics-row">
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.all_plant ?? '—'}</div>
                    <div className="dashboard-metric-label">Total Plants</div>
                  </div>
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.normal_plant ?? '—'}</div>
                    <div className="dashboard-metric-label">Normal</div>
                  </div>
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.alarm_plant ?? '—'}</div>
                    <div className="dashboard-metric-label">Alarm</div>
                  </div>
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.offline_plant ?? '—'}</div>
                    <div className="dashboard-metric-label">Offline</div>
                  </div>
                </div>

                {/* Energy Metrics Row */}
                <div className="dashboard-metrics-row">
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.power ?? '—'}</div>
                    <div className="dashboard-metric-label">Keep-live Power (kW)</div>
                  </div>
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.capacity ?? '—'}</div>
                    <div className="dashboard-metric-label">Capacity (kW)</div>
                  </div>
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.day_power ?? '—'}</div>
                    <div className="dashboard-metric-label">Day Production (kWh)</div>
                  </div>
                  <div className="dashboard-metric-card">
                    <div className="dashboard-metric-value">{widgetData?.total_power ?? '—'}</div>
                    <div className="dashboard-metric-label">Total Production (kWh)</div>
                  </div>
                </div>
              </>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

