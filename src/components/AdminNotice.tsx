/**
 * Admin Notice Component
 * Displays admin credentials notice for demo purposes
 */

import React from "react";

const AdminNotice: React.FC = () => {
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Admin Access Available
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p className="mb-2">
              For administrative functions, use these credentials:
            </p>
            <div className="rounded bg-amber-100 p-2 font-mono text-xs">
              <div>Username: <span className="font-semibold">CloneFest2025</span></div>
              <div>Password: <span className="font-semibold">CloneFest2025</span></div>
            </div>
            <p className="mt-2 text-xs">
              Admin users have access to dashboard, content management, and system settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotice;
