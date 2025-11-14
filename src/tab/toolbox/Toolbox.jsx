'use client';

import { 
  Cog6ToothIcon, 
  CircleStackIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import './Toolbox.css';

export default function Toolbox() {
  return (
    <div className="toolbox-page">
      <div className="col-xl-12">
        <div className="card qbits-card">
          <div className="card-header">
            <h5>System Toolbox</h5>
          </div>
          <div className="card-body toolbox-body">
            <div className="toolbox-grid">
              {/* Row 1 */}
              <div className="toolbox-card">
                <Cog6ToothIcon className="toolbox-icon toolbox-icon-purple" />
                <h6 className="toolbox-title">System Settings</h6>
                <p className="toolbox-description">Configure system parameters and preferences</p>
                <button className="toolbox-button">Configure</button>
              </div>
              <div className="toolbox-card">
                <CircleStackIcon className="toolbox-icon toolbox-icon-green" />
                <h6 className="toolbox-title">Database Tools</h6>
                <p className="toolbox-description">Manage database operations and maintenance</p>
                <button className="toolbox-button">Manage</button>
              </div>
              <div className="toolbox-card">
                <ShieldCheckIcon className="toolbox-icon toolbox-icon-orange" />
                <h6 className="toolbox-title">Security Tools</h6>
                <p className="toolbox-description">Security monitoring and access control</p>
                <button className="toolbox-button">Monitor</button>
              </div>
              
              {/* Row 2 */}
              <div className="toolbox-card">
                <ChartBarIcon className="toolbox-icon toolbox-icon-blue" />
                <h6 className="toolbox-title">Analytics Tools</h6>
                <p className="toolbox-description">Advanced analytics and reporting tools</p>
                <button className="toolbox-button">Analyze</button>
              </div>
              <div className="toolbox-card">
                <CloudArrowUpIcon className="toolbox-icon toolbox-icon-grey" />
                <h6 className="toolbox-title">Backup Tools</h6>
                <p className="toolbox-description">System backup and restore operations</p>
                <button className="toolbox-button">Backup</button>
              </div>
              <div className="toolbox-card">
                <WrenchScrewdriverIcon className="toolbox-icon toolbox-icon-grey-dark" />
                <h6 className="toolbox-title">Maintenance</h6>
                <p className="toolbox-description">System maintenance and optimization</p>
                <button className="toolbox-button">Maintain</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

