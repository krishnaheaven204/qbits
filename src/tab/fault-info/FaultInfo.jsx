'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import './FaultInfo.css';

export default function FaultInfo() {
  return (
    <div className="fault-info-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header">
            <h5 className="mb-2">Fault Info</h5>
            <ul className="nav nav-tabs border-0" id="fault-tabs">
              <li className="nav-item"><a className="nav-link active" href="#" data-filter="all">ALL</a></li>
              <li className="nav-item"><a className="nav-link" href="#" data-filter="going">Going</a></li>
              <li className="nav-item"><a className="nav-link" href="#" data-filter="recovered">Recovered</a></li>
              <li className="nav-item dropdown ms-2">
                <a className="nav-link dropdown-toggle" href="#">Fault Export</a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="#" data-export="all">Export All</a>
                  <a className="dropdown-item" href="#" data-export="date">Export by Date</a>
                  <a className="dropdown-item" href="#" data-export="station">Export by Station</a>
                </div>
              </li>
            </ul>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="qbits-table" id="fault-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Station Name</th>
                    <th>Device</th>
                    <th>Serial</th>
                    <th>Fault Info</th>
                    <th>Start</th>
                    <th>End</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" className="text-center text-muted" style={{padding: '40px'}}>
                      No fault records found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-center mt-3" id="fault-pagination"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

