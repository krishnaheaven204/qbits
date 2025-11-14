'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import './DataExcel.css';

export default function DataExcel() {
  return (
    <div className="data-excel-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header">
            <h5>Data Excel Export</h5>
          </div>
          <div className="card-body data-excel-body">
            <p>Export station data to Excel format for analysis and reporting.</p>
            <button className="export-data-btn">
              <ArrowDownTrayIcon className="export-data-icon" />
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

