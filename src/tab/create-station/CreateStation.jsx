'use client';

import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import './CreateStation.css';

export default function CreateStation() {
  const router = useRouter();

  return (
    <div className="create-station-page">
      <div className="col-xl-8">
        <div className="card qbits-card">
          <div className="card-header">
            <h5>Create New Station</h5>
          </div>
          <div className="card-body">
            <form id="create-station-form" onSubmit={(e) => { e.preventDefault(); }}>
              <div className="row">
                <div className="col-md-6">
                  <div className="qbits-form-group">
                    <label className="qbits-form-label">Station Name *</label>
                    <input type="text" className="qbits-form-input" placeholder="Enter station name" required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="qbits-form-group">
                    <label className="qbits-form-label">Capacity (kW) *</label>
                    <input type="number" className="qbits-form-input" placeholder="0.0" step="0.1" required />
                  </div>
                </div>
              </div>
              <div className="qbits-form-group">
                <label className="qbits-form-label">Station Address *</label>
                <textarea className="qbits-form-input" rows="3" placeholder="Enter complete station address" required></textarea>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="qbits-form-group">
                    <label className="qbits-form-label">Latitude</label>
                    <input type="number" className="qbits-form-input" placeholder="0.000000" step="0.000001" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="qbits-form-group">
                    <label className="qbits-form-label">Longitude</label>
                    <input type="number" className="qbits-form-input" placeholder="0.000000" step="0.000001" />
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="qbits-btn qbits-btn-primary">
                  <CheckIcon className="h-4 w-4" />
                  Create Station
                </button>
                <button type="button" className="qbits-btn qbits-btn-secondary" onClick={() => router.push('/station-list')}>
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

