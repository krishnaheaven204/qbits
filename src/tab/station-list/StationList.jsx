'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import './StationList.css';

export default function StationList() {
  const router = useRouter();
  const [isCreateStateOpen, setIsCreateStateOpen] = useState(false);
  const [createStateLoading, setCreateStateLoading] = useState(false);
  const [createStateError, setCreateStateError] = useState('');
  const [form, setForm] = useState({
    userName: '',
    password: '',
    plantName: '',
    city: '',
    longitude: '',
    latitude: '',
    stationtype: '',
    capacity: '',
    batterycapacity: '',
  });

  const closeCreateState = () => {
    setIsCreateStateOpen(false);
    setCreateStateLoading(false);
    setCreateStateError('');
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitCreateState = async (e) => {
    e.preventDefault();
    if (createStateLoading) return;

    setCreateStateError('');

    const payload = {
      userName: form.userName.trim(),
      password: form.password,
      plantName: form.plantName.trim(),
      city: form.city.trim(),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      latitude: form.latitude === '' ? null : Number(form.latitude),
      stationtype: form.stationtype.trim(),
      capacity: form.capacity === '' ? null : Number(form.capacity),
      batterycapacity: form.batterycapacity === '' ? null : Number(form.batterycapacity),
    };

    if (!payload.userName || !payload.password || !payload.plantName) {
      setCreateStateError('Please fill User Name, Password, and Plant Name.');
      return;
    }

    try {
      setCreateStateLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch('/api/create-plant', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = resp.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const result = isJson ? await resp.json() : await resp.text();

      if (!resp.ok) {
        const message =
          typeof result === 'object' && result && (result.message || result.error)
            ? result.message || result.error
            : typeof result === 'string'
              ? result
              : resp.statusText;
        throw new Error(message || 'Request failed');
      }

      const message =
        typeof result === 'object' && result
          ? result?.data?.message || result?.message
          : 'Plant created successfully.';
      const pid = typeof result === 'object' && result ? result?.data?.pid : null;

      closeCreateState();
      alert(pid ? `${message} (PID: ${pid})` : message);
    } catch (err) {
      setCreateStateError(err?.message || 'Failed to create plant');
    } finally {
      setCreateStateLoading(false);
    }
  };

  return (
    <div className="station-list-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Station List</h5>
            <div className="station-header-actions">
              <button
                className="btn btn-primary qbits-btn qbits-btn-primary"
                type="button"
                onClick={() => setIsCreateStateOpen(true)}
              >
                <PlusIcon style={{width: '16px', height: '16px'}} />
                Create Stations
              </button>
              <button className="btn btn-primary qbits-btn qbits-btn-primary" type="button" onClick={() => router.push('/create-station')}>
                <PlusIcon style={{width: '16px', height: '16px'}} />
                Create Station
              </button>
            </div>
          </div>
          <div className="station-refresh-row desktop-only">
            <button className="btn qbits-btn qbits-btn-secondary station-refresh-btn" type="button">
              <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
              Refresh
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="qbits-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Station Name</th>
                    <th>Capacity (kW)</th>
                    <th>Keep-live Power (kW)</th>
                    <th>Day Production (kWh)</th>
                    <th>Total Production (kWh)</th>
                    <th>KPI</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="qbits-status-badge qbits-status-normal">Normal</span>
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">Solar Station Alpha</div>
                        <div className="text-muted small">Mumbai, India</div>
                      </div>
                    </td>
                    <td>3.60</td>
                    <td>2.09</td>
                    <td>16</td>
                    <td>2,847</td>
                    <td>
                      <div className="progress" style={{height: '8px'}}>
                        <div className="progress-bar bg-success" style={{width: '98%'}}></div>
                      </div>
                      <small className="text-muted">98%</small>
                    </td>
                    <td>
                      <div className="qbits-actions">
                        <button className="qbits-icon-btn qbits-icon-primary" title="View">
                          <EyeIcon style={{width: '16px', height: '16px'}} />
                        </button>
                        <button className="qbits-icon-btn qbits-icon-secondary" title="Edit">
                          <PencilIcon style={{width: '16px', height: '16px'}} />
                        </button>
                        <button className="qbits-icon-btn qbits-icon-danger" title="Delete">
                          <TrashIcon style={{width: '16px', height: '16px'}} />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isCreateStateOpen ? (
        <div className="station-modal-overlay" role="dialog" aria-modal="true">
          <div className="station-modal">
            <div className="station-modal-header">
              <h5>Create Stations</h5>
              <button type="button" className="station-modal-close" onClick={closeCreateState}>
                ×
              </button>
            </div>

            <form className="station-modal-body" onSubmit={submitCreateState}>
              {createStateError ? <div className="station-modal-error">{createStateError}</div> : null}

              <div className="station-form-grid">
                <div className="station-form-field">
                  <label>User Name *</label>
                  <input value={form.userName} onChange={(e) => handleFormChange('userName', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={(e) => handleFormChange('password', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>Plant Name *</label>
                  <input value={form.plantName} onChange={(e) => handleFormChange('plantName', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>City</label>
                  <input value={form.city} onChange={(e) => handleFormChange('city', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>Longitude</label>
                  <input value={form.longitude} onChange={(e) => handleFormChange('longitude', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>Latitude</label>
                  <input value={form.latitude} onChange={(e) => handleFormChange('latitude', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>Station Type</label>
                  <input value={form.stationtype} onChange={(e) => handleFormChange('stationtype', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>Capacity</label>
                  <input value={form.capacity} onChange={(e) => handleFormChange('capacity', e.target.value)} />
                </div>
                <div className="station-form-field">
                  <label>Battery Capacity</label>
                  <input value={form.batterycapacity} onChange={(e) => handleFormChange('batterycapacity', e.target.value)} />
                </div>
              </div>

              <div className="station-modal-actions">
                <button type="button" className="btn qbits-btn qbits-btn-secondary" onClick={closeCreateState} disabled={createStateLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary qbits-btn qbits-btn-primary" disabled={createStateLoading}>
                  {createStateLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

