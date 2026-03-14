'use client';

import Link from 'next/link';

export default function RegulationsTab() {
  return (
    <div>
      {/* ── ODNR Regulations Banner ── */}
      <div className="fish-odnr-banner">
        <div className="fish-odnr-icon">
          <i className="fas fa-gavel" style={{ fontSize: '2rem', color: 'var(--gold)' }}></i>
        </div>
        <h3>Ohio Fishing Regulations</h3>
        <p style={{ color: 'var(--gray-400)', margin: '0.75rem 0 1.25rem', maxWidth: 500 }}>
          Fishing regulations are updated annually by the Ohio Department of Natural Resources. Always verify current limits, seasons, and size requirements before fishing.
        </p>
        <a
          href="https://eregulations.com/ohio/fishing/lake-erie-and-inland-waters/"
          target="_blank"
          rel="noopener noreferrer"
          className="fish-odnr-link"
        >
          <i className="fas fa-external-link-alt" style={{ marginRight: '0.4rem' }}></i>
          View Current Lake Erie Regulations
        </a>
        <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
          Source: Ohio DNR eRegulations — Lake Erie &amp; Inland Waters
        </p>
      </div>

      {/* ── Important Information ── */}
      <div className="fish-regs-info">
        <h3 style={{ marginBottom: '0.75rem' }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem', color: 'var(--gold)' }}></i>
          Important Information
        </h3>
        <ul>
          <li>
            Ohio fishing license required for all anglers 16 and older (purchase
            at{' '}
            <a
              href="https://ohiodnr.gov"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--blue-accent)' }}
            >
              ohiodnr.gov
            </a>
            )
          </li>
          <li>Lake Erie Permit required for Lake Erie fishing</li>
          <li>
            Fish consumption advisories apply — check ODNR guidelines before
            consuming your catch
          </li>
          <li>
            Regulations updated annually — always verify current limits at{' '}
            <a
              href="https://ohiodnr.gov"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--blue-accent)' }}
            >
              ohiodnr.gov
            </a>
          </li>
        </ul>
      </div>

      {/* ── Resources Links ── */}
      <div className="section-header center" style={{ marginTop: '2.5rem' }}>
        <div className="section-label">Helpful Links</div>
        <h2 className="section-title">Resources</h2>
      </div>

      <div className="fish-resources-grid">
        <a
          href="https://ohiodnr.gov/fishing"
          target="_blank"
          rel="noopener noreferrer"
          className="fish-resource-card"
        >
          <div
            className="fish-resource-icon"
            style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}
          >
            <i className="fas fa-fish"></i>
          </div>
          <h3>ODNR Fishing</h3>
          <p>Ohio fishing regulations, seasons, and license information</p>
        </a>

        <a
          href="https://oh-web.s1702.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="fish-resource-card"
        >
          <div
            className="fish-resource-icon"
            style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}
          >
            <i className="fas fa-id-card"></i>
          </div>
          <h3>Buy License</h3>
          <p>Purchase your Ohio fishing license and Lake Erie permit online</p>
        </a>

        <Link href="/facilities#boat-launch" className="fish-resource-card">
          <div
            className="fish-resource-icon"
            style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}
          >
            <i className="fas fa-ship"></i>
          </div>
          <h3>Boat Launch</h3>
          <p>Public boat launch at Lorain&apos;s waterfront facilities</p>
        </Link>

        <a
          href="https://odh.ohio.gov/know-our-programs/fish-advisory"
          target="_blank"
          rel="noopener noreferrer"
          className="fish-resource-card"
        >
          <div
            className="fish-resource-icon"
            style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}
          >
            <i className="fas fa-utensils"></i>
          </div>
          <h3>Fish Consumption</h3>
          <p>Fish consumption advisories and safe eating guidelines for Ohio</p>
        </a>
      </div>
    </div>
  );
}
