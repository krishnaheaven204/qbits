'use client';

import { CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import './Dashboard.css';

export default function Dashboard() {
  // Production data for the bar chart (monthly kWh)
  const productionData = [280, 320, 170, 460, 370, 400, 150, 250, 340, 480, 200, 300];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxValue = 500;
  const chartHeight = 220;
  const chartPadding = { top: 10, right: 20, bottom: 30, left: 50 };
  const chartInnerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const svgWidth = 900;
  const chartInnerWidth = svgWidth - chartPadding.left - chartPadding.right;
  const barWidth = 25;
  const barGap = (chartInnerWidth - (productionData.length * barWidth)) / (productionData.length - 1);

  // Calculate bar positions
  const calculateBarHeight = (value) => (value / maxValue) * chartInnerHeight;
  const calculateBarX = (index) => chartPadding.left + (index * (barWidth + barGap));

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Dashboard</h1>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="dropdown">
                <button className="dashboard-btn dashboard-btn-date dropdown-toggle">
                  <CalendarIcon className="dashboard-btn-icon" />
                  2025-01-
                </button>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="#">2025-01</a>
                  <a className="dropdown-item" href="#">2024-12</a>
                  <a className="dropdown-item" href="#">2024-11</a>
                </div>
              </div>
              <button className="dashboard-btn dashboard-btn-refresh">
                <ArrowPathIcon className="dashboard-btn-icon" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="row">
        <div className="col-12">
          <div className="card qbits-card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Production Overview</h5>
                <p className="text-muted small mb-0">System performance and energy metrics</p>
              </div>
            </div>
            <div className="card-body">
              {/* Top Row - Metric Cards */}
              <div className="dashboard-metrics-row">
                <div className="dashboard-metric-card">
                  <div className="dashboard-metric-value">23%</div>
                  <div className="dashboard-metric-label">System Efficiency</div>
                </div>
                <div className="dashboard-metric-card">
                  <div className="dashboard-metric-value">2.09</div>
                  <div className="dashboard-metric-label">Keep-live Power (kW)</div>
                </div>
                <div className="dashboard-metric-card">
                  <div className="dashboard-metric-value">3.60</div>
                  <div className="dashboard-metric-label">Capacity (kW)</div>
                </div>
                <div className="dashboard-metric-card">
                  <div className="dashboard-metric-value">367</div>
                  <div className="dashboard-metric-label">Total Production (kWh)</div>
                </div>
              </div>

              {/* Chart and Gauge Row */}
              <div className="row g-3 mb-3">
                <div className="col-lg-8">
                  <div className="p-3 bg-white rounded border">
                    <div className="d-flex align-items-center mb-2">
                      <div className="bg-success rounded me-2" style={{width: '10px', height: '10px'}}></div>
                      <span className="small">Production (kWh)</span>
                    </div>
                    <div className="chart-container" style={{height: `${chartHeight}px`, position: 'relative', width: '100%'}}>
                      <svg width="100%" height={chartHeight} style={{overflow: 'visible'}} viewBox={`0 0 ${svgWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
                        {/* Y-axis labels and grid lines */}
                        {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map((value) => {
                          const y = chartPadding.top + chartInnerHeight - (value / maxValue) * chartInnerHeight;
                          return (
                            <g key={value}>
                              <line 
                                x1={chartPadding.left} 
                                y1={y} 
                                x2={svgWidth - chartPadding.right} 
                                y2={y} 
                                stroke="#e5e7eb" 
                                strokeWidth="1"
                                strokeDasharray="2,2"
                              />
                              <text 
                                x={chartPadding.left - 8} 
                                y={y + 4} 
                                textAnchor="end" 
                                fontSize="11" 
                                fill="#6b7280"
                              >
                                {value}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* Bars */}
                        {productionData.map((value, index) => {
                          const barHeight = calculateBarHeight(value);
                          const x = calculateBarX(index);
                          const y = chartPadding.top + chartInnerHeight - barHeight;
                          return (
                            <g key={index}>
                              <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill="#22c55e"
                                rx="3"
                              />
                              {/* X-axis labels */}
                              <text
                                x={x + barWidth / 2}
                                y={chartHeight - 10}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#6b7280"
                              >
                                {months[index]}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* Y-axis line */}
                        <line 
                          x1={chartPadding.left} 
                          y1={chartPadding.top} 
                          x2={chartPadding.left} 
                          y2={chartHeight - chartPadding.bottom} 
                          stroke="#d1d5db" 
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="p-3 bg-white rounded border text-center">
                    <div className="position-relative d-inline-block">
                      <div className="progress-circle" style={{width: '120px', height: '120px'}}>
                        <svg className="progress-ring" width="120" height="120">
                          <circle 
                            className="progress-ring-circle" 
                            cx="60" 
                            cy="60" 
                            r="54" 
                            stroke="#e5e7eb" 
                            strokeWidth="8" 
                            fill="transparent"
                          />
                          <circle 
                            className="progress-ring-circle" 
                            cx="60" 
                            cy="60" 
                            r="54" 
                            stroke="#3b82f6" 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={`${2 * Math.PI * 54}`}
                            strokeDashoffset={`${2 * Math.PI * 54 * (1 - 0.23)}`}
                            strokeLinecap="round" 
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="position-absolute" style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
                          <div className="h5 mb-0">23%</div>
                          <div className="small text-muted">Efficiency</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Production Cards */}
              <div className="dashboard-metrics-row">
                <div className="dashboard-metric-card">
                  <div className="dashboard-metric-value">16</div>
                  <div className="dashboard-metric-label">Day Production (kWh)</div>
                </div>
                <div className="dashboard-metric-card">
                  <div className="dashboard-metric-value">32.17</div>
                  <div className="dashboard-metric-label">Month Production (kWh)</div>
                </div>
                <div className="dashboard-metric-card">
                  <div className="dashboard-metric-value">364.76</div>
                  <div className="dashboard-metric-label">Year Production (kWh)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

