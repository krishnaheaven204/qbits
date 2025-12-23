'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import DatePicker from '@/components/date-picker/DatePicker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

export default function ProductionOverview({ selectedPlant }) {
  const [activeTab, setActiveTab] = useState('day');
  // Default to the latest known date (falls back to today)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalChartData, setTotalChartData] = useState(null);
  const [totalLoading, setTotalLoading] = useState(false);
  const [totalError, setTotalError] = useState(null);
  const [yearChartData, setYearChartData] = useState(null);
  const [yearLoading, setYearLoading] = useState(false);
  const [yearError, setYearError] = useState(null);
  const [monthChartData, setMonthChartData] = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState(null);
  const [dayChartData, setDayChartData] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState(null);
  const [dayTotalEday, setDayTotalEday] = useState(null);





  // Chart options for Total tab - single bar
  const totalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#159f6c',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold',
          family: "'Nunito', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Nunito', sans-serif",
        },
        callbacks: {
          title: function (context) {
            return context[0].label;
          },
          label: function (context) {
            return `Solar: ${context.parsed.y} kWh`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
            family: "'Nunito', sans-serif",
          },
          maxRotation: 0,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#159f6c',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold',
          family: "'Nunito', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Nunito', sans-serif",
        },
        callbacks: {
          title: function (context) {
            return context[0].label;
          },
          label: function (context) {
            return `Solar: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
            family: "'Nunito', sans-serif",
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#159f6c',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold',
          family: "'Nunito', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Nunito', sans-serif",
        },
        callbacks: {
          title: function (context) {
            return `Day ${context[0].label}`;
          },
          label: function (context) {
            if (context.parsed.y === 0) return '';
            return `Solar: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
            family: "'Nunito', sans-serif",
          },
          maxRotation: 0,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };

  const yearChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#159f6c',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold',
          family: "'Nunito', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Nunito', sans-serif",
        },
        callbacks: {
          title: function (context) {
            return `Month ${context[0].label}`;
          },
          label: function (context) {
            if (context.parsed.y === 0) return '';
            return `Solar: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
            family: "'Nunito', sans-serif",
          },
          maxRotation: 0,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTotalProduction = async (plant) => {
    if (!plant || !plant.plant_no) {
      setTotalError('Plant information not available');
      return;
    }

    try {
      setTotalChartData(null);
      setTotalLoading(true);
      setTotalError(null);

      const year = new Date().getFullYear();
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const params = new URLSearchParams({
        startTime: year.toString(),
        plantId: plant.plant_no.toString(),
        atun: plant.atun || '',
        atpd: plant.atpd || ''
      });
      
      const url = `/api/plants/statistics-by-total?${params}`;
      
      console.log('🔵 Fetching Total Production:', {
        url,
        plantNo: plant.plant_no,
        year,
        hasToken: !!token
      });

      const headers = {
        'Accept': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('🔵 API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔵 API Response Data:', result);
      
      if (result.success && result.data?.bytotal?.plantEnergyList) {
        const plantEnergyList = result.data.bytotal.plantEnergyList;
        
        console.log('✅ Plant Energy List:', plantEnergyList);
        
        const labels = plantEnergyList.map(item => item.recordTime);
        const dataValues = plantEnergyList.map(item => Number(item.power));
        
        setTotalChartData({
          labels,
          datasets: [
            {
              label: 'Total Production (kWh)',
              data: dataValues,
              backgroundColor: '#159f6c',
              borderColor: '#159f6c',
              borderWidth: 0,
              borderRadius: 4,
              barPercentage: 0.6,
              categoryPercentage: 0.75,
            },
          ],
        });
      } else {
        console.error('🔴 Invalid response structure:', result);
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('🔴 Total Production Fetch Error:', err);
      setTotalError(err.message || 'Failed to load total production data');
      setTotalChartData(null);
    } finally {
      setTotalLoading(false);
    }
  };

  const fetchYearProduction = async (plant) => {
    if (!plant || !plant.plant_no) {
      setYearError('Plant information not available');
      return;
    }

    try {
      setYearChartData(null);
      setYearLoading(true);
      setYearError(null);

      const year = new Date().getFullYear();
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const params = new URLSearchParams({
        startTime: year.toString(),
        plantId: plant.plant_no.toString(),
        atun: plant.atun || '',
        atpd: plant.atpd || ''
      });
      
      const url = `/api/plants/statistics-by-year?${params}`;
      
      console.log('🔵 Fetching Year Production:', {
        url,
        plantNo: plant.plant_no,
        year,
        hasToken: !!token
      });

      const headers = {
        'Accept': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('🔵 Year API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Year API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔵 Year API Response Data:', result);
      
      if (result.success && result.data?.byyear?.catisticsDataByYearList) {
        const monthlyList = result.data.byyear.catisticsDataByYearList;
        
        console.log('✅ Monthly Production List:', monthlyList);
        
        const labels = monthlyList.map(item => item.recordTime);
        const dataValues = monthlyList.map(item => Number(item.power));
        
        setYearChartData({
          labels,
          datasets: [
            {
              label: 'Production (kWh)',
              data: dataValues,
              backgroundColor: '#159f6c',
              borderColor: '#159f6c',
              borderWidth: 0,
              borderRadius: 4,
              barPercentage: 0.6,
              categoryPercentage: 0.75,
            },
          ],
        });
      } else {
        console.error('🔴 Invalid year response structure:', result);
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('🔴 Year Production Fetch Error:', err);
      setYearError(err.message || 'Failed to load year production data');
      setYearChartData(null);
    } finally {
      setYearLoading(false);
    }
  };

  // Fetch Total data when Total tab is active and selectedPlant is available
  useEffect(() => {
    if (activeTab === 'total' && selectedPlant) {
      fetchTotalProduction(selectedPlant);
    }
  }, [activeTab, selectedPlant]);

  const fetchMonthProduction = async (plant) => {
    if (!plant || !plant.plant_no) {
      setMonthError('Plant information not available');
      return;
    }

    try {
      setMonthChartData(null);
      setMonthLoading(true);
      setMonthError(null);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startTime = `${year}-${month}`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const params = new URLSearchParams({
        startTime,
        plantId: plant.plant_no.toString(),
        atun: plant.atun || '',
        atpd: plant.atpd || ''
      });
      
      const url = `/api/plants/statistics-by-month?${params}`;
      
      console.log('🔵 Fetching Month Production:', {
        url,
        plantNo: plant.plant_no,
        startTime,
        hasToken: !!token
      });

      const headers = {
        'Accept': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('🔵 Month API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Month API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔵 Month API Response Data:', result);
      
      if (result.success && result.data?.bymonth?.catisticsDataByMonthList) {
        const dailyList = result.data.bymonth.catisticsDataByMonthList;
        
        console.log('✅ Daily Production List:', dailyList);
        
        const labels = dailyList.map(item => item.recordTime);
        const dataValues = dailyList.map(item => Number(item.power));
        
        setMonthChartData({
          labels,
          datasets: [
            {
              label: 'Production (kWh)',
              data: dataValues,
              backgroundColor: '#159f6c',
              borderColor: '#159f6c',
              borderWidth: 0,
              borderRadius: 4,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            },
          ],
        });
      } else {
        console.error('🔴 Invalid month response structure:', result);
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('🔴 Month Production Fetch Error:', err);
      setMonthError(err.message || 'Failed to load month production data');
      setMonthChartData(null);
    } finally {
      setMonthLoading(false);
    }
  };

  // Fetch Year data when Year tab is active and selectedPlant is available
  useEffect(() => {
    if (activeTab === 'year' && selectedPlant) {
      fetchYearProduction(selectedPlant);
    }
  }, [activeTab, selectedPlant]);

  const fetchDayProduction = async (plant, date) => {
    if (!plant || !plant.plant_no) {
      setDayError('Plant information not available');
      return;
    }

    try {
      setDayLoading(true);
      setDayError(null);
      setDayTotalEday(null);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const startTime = `${year}-${month}-${day}`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const params = new URLSearchParams({
        startTime,
        plantId: plant.plant_no.toString(),
        atun: plant.atun || '',
        atpd: plant.atpd || ''
      });
      
      const url = `/api/plants/statistics-by-day?${params}`;
      
      console.log('🔵 Fetching Day Production:', {
        url,
        plantNo: plant.plant_no,
        startTime,
        hasToken: !!token
      });

      const headers = {
        'Accept': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('🔵 Day API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Day API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔵 Day API Response Data:', result);
      
      if (result.success && result.data?.byday?.catisticsDataByDayList) {
        const hourlyList = result.data.byday.catisticsDataByDayList;
        
        console.log('✅ Hourly Production List:', hourlyList);
        
        const labels = hourlyList.map(item => item.recordTime);
        const dataValues = hourlyList.map(item => Number(item.acMomentaryPower));

        // Capture API-provided day total (eday) if present
        const apiEday = result.data.byday.eday ?? result.data.byday.day_power ?? null;
        if (apiEday !== null && apiEday !== undefined && !isNaN(Number(apiEday))) {
          setDayTotalEday(Number(apiEday));
        }
        
        setDayChartData({
          labels,
          datasets: [
            {
              label: 'Production (kWh)',
              data: dataValues,
              borderColor: '#159f6c',
              backgroundColor: 'rgba(21, 159, 108, 0.15)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#159f6c',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              borderWidth: 2.5,
              borderCapStyle: 'round',
              borderJoinStyle: 'round',
            },
          ],
        });
      } else {
        console.error('🔴 Invalid day response structure:', result);
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('🔴 Day Production Fetch Error:', err);
      setDayError(err.message || 'Failed to load day production data');
      setDayChartData(null);
    } finally {
      setDayLoading(false);
    }
  };

  // Fetch Month data when Month tab is active and selectedPlant is available
  useEffect(() => {
    if (activeTab === 'month' && selectedPlant) {
      fetchMonthProduction(selectedPlant);
    }
  }, [activeTab, selectedPlant]);

  // Fetch Day data when Day tab is active and selectedPlant is available
  useEffect(() => {
    if (activeTab === 'day' && selectedPlant) {
      fetchDayProduction(selectedPlant, selectedDate);
    }
  }, [activeTab, selectedPlant, selectedDate]);

  // When plant data arrives, prefer its latest timestamp to initialize the day view
  useEffect(() => {
    if (selectedPlant?.stime) {
      const parsed = new Date(selectedPlant.stime);
      if (!isNaN(parsed)) {
        setSelectedDate(parsed);
      }
    }
  }, [selectedPlant]);

  const renderTotalValue = () => {
    const sumDataset = (data) =>
      data?.datasets?.[0]?.data?.reduce((sum, val) => sum + val, 0);

    // For day view, always prefer the currently loaded chart data (selected date)
    if (activeTab === 'day') {
      if (dayLoading) {
        return '0.00 kWh';
      }
      if (dayTotalEday !== null && dayTotalEday !== undefined) {
        return `${Number(dayTotalEday).toFixed(2)} kWh`;
      }

      if (dayChartData) {
        return `${(sumDataset(dayChartData) ?? 0).toFixed(2)} kWh`;
      }

      // Fallback to plant snapshot only if no chart data yet
      if (selectedPlant) {
        const eday =
          selectedPlant.eday ??
          selectedPlant.day_power ??
          selectedPlant.dayProduction ??
          selectedPlant.day_power ??
          null;
        if (eday !== null && eday !== undefined && !isNaN(Number(eday))) {
          return `${Number(eday).toFixed(2)} kWh`;
        }
      }
    }

    if (activeTab === 'total' && totalChartData) {
      return `${(sumDataset(totalChartData) ?? 0).toFixed(1)} kWh`;
    }
    if (activeTab === 'year') {
      if (yearLoading) return '0.0 kWh';
      if (yearChartData) {
        return `${(sumDataset(yearChartData) ?? 0).toFixed(1)} kWh`;
      }
    }
    if (activeTab === 'month') {
      if (monthLoading) return '0.0 kWh';
      if (monthChartData) {
        return `${(sumDataset(monthChartData) ?? 0).toFixed(1)} kWh`;
      }
    }
    if (activeTab === 'day' && dayChartData) {
      return `${(sumDataset(dayChartData) ?? 0).toFixed(2)} kWh`;
    }
    return '0.00 kWh';
  };

  return (
    <div className="card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', border: '1px solid #e8eef7', overflow: 'hidden' }}>
      {/* Header with Title, Value, and Controls */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f4f8' }}>
        <div className="row align-items-center" style={{ margin: 0 }}>
          <div className="col-auto" style={{ paddingLeft: 0, paddingRight: '8px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: 0 }}>Production Overview</h5>
          </div>
          <div className="col-auto ms-auto" style={{ paddingRight: 0 }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#159f6c' }}>
              {renderTotalValue()}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f4f8', backgroundColor: '#fafbfc' }}>
        <div className="row align-items-center" style={{ margin: 0 }}>
          <div className="col-auto" style={{ paddingLeft: 0, paddingRight: '6px' }}>
            <button
              onClick={() => setActiveTab('day')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: "'Nunito', sans-serif",
                borderRadius: '4px',
                backgroundColor: activeTab === 'day' ? '#159f6c' : 'transparent',
                color: activeTab === 'day' ? '#fff' : '#6b7280',
                border: activeTab === 'day' ? 'none' : '1px solid #d1d5db',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Day
            </button>
          </div>
          <div className="col-auto" style={{ paddingLeft: '3px', paddingRight: '3px' }}>
            <button
              onClick={() => setActiveTab('month')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: "'Nunito', sans-serif",
                borderRadius: '4px',
                backgroundColor: activeTab === 'month' ? '#159f6c' : 'transparent',
                color: activeTab === 'month' ? '#fff' : '#6b7280',
                border: activeTab === 'month' ? 'none' : '1px solid #d1d5db',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Month
            </button>
          </div>
          <div className="col-auto" style={{ paddingLeft: '3px', paddingRight: '3px' }}>
            <button
              onClick={() => setActiveTab('year')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: "'Nunito', sans-serif",
                borderRadius: '4px',
                backgroundColor: activeTab === 'year' ? '#159f6c' : 'transparent',
                color: activeTab === 'year' ? '#fff' : '#6b7280',
                border: activeTab === 'year' ? 'none' : '1px solid #d1d5db',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Year
            </button>
          </div>
          <div className="col-auto" style={{ paddingLeft: '3px', paddingRight: '6px' }}>
            <button
              onClick={() => {
                setActiveTab('total');
              }}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: "'Nunito', sans-serif",
                borderRadius: '4px',
                backgroundColor: activeTab === 'total' ? '#159f6c' : 'transparent',
                color: activeTab === 'total' ? '#fff' : '#6b7280',
                border: activeTab === 'total' ? 'none' : '1px solid #d1d5db',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Total
            </button>
          </div>
          {activeTab === 'day' && (
            <div className="col-auto ms-auto" style={{ paddingRight: 0 }}>
              <DatePicker value={selectedDate} onChange={setSelectedDate} />
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ padding: '20px', height: '280px', position: 'relative', backgroundColor: '#fff' }}>
        {activeTab === 'day' && (
          dayLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              Loading...
            </div>
          ) : dayError ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontSize: '14px' }}>
              {dayError}
            </div>
          ) : dayChartData ? (
            <Line data={dayChartData} options={lineChartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              No data available
            </div>
          )
        )}
        {activeTab === 'month' && (
          monthLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              Loading...
            </div>
          ) : monthError ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontSize: '14px' }}>
              {monthError}
            </div>
          ) : monthChartData ? (
            <Bar data={monthChartData} options={barChartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              No data available
            </div>
          )
        )}
        {activeTab === 'year' && (
          yearLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              Loading...
            </div>
          ) : yearError ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontSize: '14px' }}>
              {yearError}
            </div>
          ) : yearChartData ? (
            <Bar data={yearChartData} options={yearChartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              No data available
            </div>
          )
        )}
        {activeTab === 'total' && (
          totalLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              Loading...
            </div>
          ) : totalError ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontSize: '14px' }}>
              {totalError}
            </div>
          ) : totalChartData ? (
            <Bar data={totalChartData} options={totalChartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
              No data available
            </div>
          )
        )}
      </div>
    </div>
  );
}
