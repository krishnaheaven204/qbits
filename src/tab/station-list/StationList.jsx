'use client';

import { useRouter } from 'next/navigation';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import './StationList.css';

export default function StationList() {
  const router = useRouter();

  return (
    <div className="station-list-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Station List</h5>
            <button className="btn btn-primary qbits-btn qbits-btn-primary" onClick={() => router.push('/create-station')}>
              <PlusIcon style={{width: '16px', height: '16px'}} />
              Create Station
            </button>
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
    </div>
  );
}

