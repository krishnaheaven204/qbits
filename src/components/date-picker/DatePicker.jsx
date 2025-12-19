'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function DatePicker({ value, onChange }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value));
  const calendarRef = useRef(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleSelectDate = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(newDate);
    setShowCalendar(false);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onChange(today);
    setShowCalendar(false);
  };

  const handleClear = () => {
    onChange(new Date());
    setShowCalendar(false);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === value.getDate() &&
      currentMonth.getMonth() === value.getMonth() &&
      currentMonth.getFullYear() === value.getFullYear()
    );
  };

  const calendarDays = [];
  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const daysInPrevMonth = getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
    });
  }

  // Next month days
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
    });
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={calendarRef}>
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="form-control form-control-sm"
        style={{
          fontSize: '12px',
          padding: '5px 8px',
          width: '110px',
          fontFamily: "'Nunito', sans-serif",
          textAlign: 'left',
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{formatDate(value)}</span>
        <span style={{ fontSize: '14px' }}>📅</span>
      </button>

      {showCalendar && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            padding: '16px',
            width: '320px',
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          {/* Month/Year Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              onClick={handlePrevMonth}
              className="btn btn-sm btn-outline-secondary"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                width: '32px',
                height: '32px',
              }}
            >
              ↑
            </button>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', minWidth: '140px', textAlign: 'center' }}>
              {monthNames[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
            </div>
            <button
              onClick={handleNextMonth}
              className="btn btn-sm btn-outline-secondary"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                width: '32px',
                height: '32px',
              }}
            >
              ↓
            </button>
          </div>

          {/* Day Names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {dayNames.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  padding: '6px 0',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '16px' }}>
            {calendarDays.map((item, index) => (
              <button
                key={index}
                onClick={() => item.isCurrentMonth && handleSelectDate(item.day)}
                style={{
                  padding: '8px 0',
                  fontSize: '12px',
                  border: 'none',
                  backgroundColor: isSelected(item.day) && item.isCurrentMonth ? '#159f6c' : 'transparent',
                  color: isSelected(item.day) && item.isCurrentMonth ? '#fff' : item.isCurrentMonth ? '#1e293b' : '#cbd5e1',
                  borderRadius: '4px',
                  cursor: item.isCurrentMonth ? 'pointer' : 'default',
                  fontWeight: isSelected(item.day) && item.isCurrentMonth ? '600' : '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (item.isCurrentMonth && !isSelected(item.day)) {
                    e.target.style.backgroundColor = '#f0f4f8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (item.isCurrentMonth && !isSelected(item.day)) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                disabled={!item.isCurrentMonth}
              >
                {item.day}
              </button>
            ))}
          </div>

          {/* Clear and Today Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <button
              onClick={handleClear}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#159f6c',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#0f7d52')}
              onMouseLeave={(e) => (e.target.style.color = '#159f6c')}
            >
              Clear
            </button>
            <button
              onClick={handleToday}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#159f6c',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#0f7d52')}
              onMouseLeave={(e) => (e.target.style.color = '#159f6c')}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
