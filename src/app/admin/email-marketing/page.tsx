'use client';

import EmailMarketingDashboard from '@/components/admin/EmailMarketingDashboard';

export default function AdminEmailMarketingPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><i className="fas fa-envelope" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Email Marketing</h1>
        <p>Campaign analytics from Constant Contact for LPFA communications.</p>
      </div>
      <EmailMarketingDashboard context="lpfa" />
    </div>
  );
}
