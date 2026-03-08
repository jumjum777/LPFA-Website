'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type TabId = 'brownfields' | 'financing' | 'rfp' | 'commerce';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'brownfields', label: 'Brownfields', icon: 'fa-leaf' },
  { id: 'financing', label: 'Financing', icon: 'fa-hand-holding-dollar' },
  { id: 'rfp', label: 'RFPs & Bids', icon: 'fa-file-contract' },
  { id: 'commerce', label: 'Commerce', icon: 'fa-ship' },
];

export default function DevTabs() {
  const [active, setActive] = useState<TabId>('brownfields');

  // Support hash links from nav (e.g. /development#financing)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    if (tabs.some(t => t.id === hash)) {
      setActive(hash);
    }
  }, []);

  return (
    <section className="section">
      <div className="container">
        {/* Tab buttons (desktop) */}
        <div className="dev-tabs-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`dev-tab-btn${active === tab.id ? ' active' : ''}`}
              onClick={() => setActive(tab.id)}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab dropdown (mobile) */}
        <div className="dev-tabs-select-wrap">
          <select
            className="dev-tabs-select"
            value={active}
            onChange={(e) => setActive(e.target.value as TabId)}
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down dev-tabs-select-icon"></i>
        </div>

        {/* Tab content */}
        <div className="dev-tab-content">

          {/* BROWNFIELDS */}
          {active === 'brownfields' && (
            <div>
              <div className="dev-two-col">
                <div>
                  <div className="section-label">Environmental Remediation</div>
                  <h2 style={{ marginBottom: '1.25rem' }}>Brownfields Program</h2>
                  <p style={{ marginBottom: '1rem' }}>Lorain&apos;s industrial heritage left behind contaminated and underutilized properties — a challenge we&apos;re turning into opportunity. Our Brownfields Program provides grants and technical assistance to assess, clean up, and redevelop these sites for productive use.</p>
                  <p style={{ marginBottom: '1rem' }}>We work with state and federal partners — including the U.S. EPA, Ohio EPA, and the Ohio Department of Development — to access the funding and expertise needed to make remediation projects viable.</p>
                  <p style={{ marginBottom: '2rem' }}>Cleaned brownfield sites can be transformed into housing, commercial development, green space, or manufacturing — all of which create jobs and expand Lorain&apos;s tax base.</p>
                  <Link href="/contact" className="btn btn-primary">Inquire About Brownfields</Link>
                </div>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="dev-info-card">
                      <div className="dev-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-search"></i></div>
                      <div><h4>Phase I &amp; II Assessments</h4><p>Environmental site assessments to identify contamination and develop remediation strategies.</p></div>
                    </div>
                    <div className="dev-info-card">
                      <div className="dev-info-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}><i className="fas fa-leaf"></i></div>
                      <div><h4>Cleanup Grants</h4><p>Grant funding for remediation of petroleum, hazardous substance, and other contamination.</p></div>
                    </div>
                    <div className="dev-info-card">
                      <div className="dev-info-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-building"></i></div>
                      <div><h4>Redevelopment Planning</h4><p>Technical assistance and planning support to bring cleaned sites to market for productive reuse.</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCING */}
          {active === 'financing' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Property Finance</div>
                <h2 className="section-title">Development Financing Programs</h2>
                <p className="section-desc">We offer a range of financing tools to help private developers and property owners invest in Lorain&apos;s waterfront.</p>
              </div>
              <div className="programs-grid">
                <div className="program-card">
                  <div className="program-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-hand-holding-dollar"></i></div>
                  <h3>Property Financing</h3>
                  <p>The LPFA can provide property financing to support acquisition, development, and redevelopment of waterfront properties. Our flexible financing tools complement traditional bank lending to fill financing gaps.</p>
                  <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
                </div>
                <div className="program-card">
                  <div className="program-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-landmark"></i></div>
                  <h3>Tax Increment Financing</h3>
                  <p>TIF arrangements allow new tax revenues generated by development to be reinvested into the project area — funding infrastructure improvements and making projects more financially viable.</p>
                  <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
                </div>
                <div className="program-card">
                  <div className="program-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}><i className="fas fa-file-contract"></i></div>
                  <h3>Development Agreements</h3>
                  <p>We structure public-private partnerships and development agreements to incentivize quality investment on key waterfront sites, aligning developer interests with community goals.</p>
                  <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
                </div>
                <div className="program-card">
                  <div className="program-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}><i className="fas fa-network-wired"></i></div>
                  <h3>Grant Coordination</h3>
                  <p>We help developers identify and navigate state and federal grant programs — from JobsOhio incentives to Community Development Block Grants — maximizing the financial viability of waterfront projects.</p>
                  <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
                </div>
              </div>
            </div>
          )}

          {/* RFPs & BIDS */}
          {active === 'rfp' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Procurement</div>
                <h2 className="section-title">Requests for Proposals &amp; Bids</h2>
                <p className="section-desc">Current development opportunities and procurement solicitations from the Lorain Port &amp; Finance Authority.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="rfp-card">
                  <div className="rfp-icon"><i className="fas fa-anchor"></i></div>
                  <div className="rfp-body">
                    <div className="rfp-header">
                      <h4>Marina Conditions Assessment</h4>
                      <span className="rfp-status rfp-open">Open</span>
                    </div>
                    <p>The Lorain Port &amp; Finance Authority is seeking qualified firms to conduct a comprehensive marina conditions assessment of LPFA-managed waterfront facilities. The assessment will evaluate current conditions, capacity, and identify capital improvement priorities.</p>
                    <div className="rfp-meta">
                      <span><i className="fas fa-calendar"></i> Posted: 2026</span>
                      <span><i className="fas fa-map-marker-alt"></i> Lorain, OH</span>
                      <Link href="/contact" className="btn btn-gold btn-sm" style={{ marginLeft: 'auto' }}>Request Documents</Link>
                    </div>
                  </div>
                </div>

                <div className="rfp-card" style={{ opacity: 0.65 }}>
                  <div className="rfp-icon" style={{ background: 'rgba(100,116,139,0.08)', color: 'var(--gray-500)' }}><i className="fas fa-building"></i></div>
                  <div className="rfp-body">
                    <div className="rfp-header">
                      <h4>Waterfront Property Development RFP</h4>
                      <span className="rfp-status rfp-closed">Closed</span>
                    </div>
                    <p>Request for Proposals for development of a designated waterfront parcel near Black River Landing. This RFP has closed; award pending. Check back for future opportunities.</p>
                    <div className="rfp-meta">
                      <span><i className="fas fa-calendar"></i> Closed: 2025</span>
                      <span><i className="fas fa-map-marker-alt"></i> Lorain, OH</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dev-info-card" style={{ marginTop: '2rem' }}>
                <div className="dev-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-bell"></i></div>
                <div>
                  <h4>Stay Notified of New RFPs</h4>
                  <p style={{ marginBottom: '0.75rem' }}>Sign up for our newsletter or contact us to be added to our procurement notification list. We&apos;ll alert you when new opportunities are posted.</p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link href="/contact" className="btn btn-primary btn-sm">Get Notified</Link>
                    <Link href="/#newsletter" className="btn btn-outline btn-sm">Subscribe to Newsletter</Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WATERBORNE COMMERCE */}
          {active === 'commerce' && (
            <div>
              <div className="dev-two-col-even">
                <div>
                  <div className="section-label">Maritime Industry</div>
                  <h2 style={{ marginBottom: '1.25rem' }}>Waterborne Commerce</h2>
                  <p style={{ marginBottom: '1rem' }}>Lorain&apos;s strategic location at the mouth of the Black River on Lake Erie has made it a working port city for generations. The LPFA supports continued commercial maritime activity — a critical driver of jobs and economic activity in our region.</p>
                  <p style={{ marginBottom: '2rem' }}>We work to maintain and improve port infrastructure, facilitate commercial shipping relationships, and ensure Lorain&apos;s viability as a Great Lakes maritime hub for future generations.</p>
                  <Link href="/commerce" className="btn btn-gold">Learn More</Link>
                </div>
                <div>
                  <div className="dev-commerce-grid">
                    <div className="dev-commerce-card-light">
                      <div className="dev-commerce-card-icon" style={{ color: 'var(--blue-accent)' }}><i className="fas fa-ship"></i></div>
                      <h4>Commercial Shipping</h4>
                      <p>Supporting cargo and freight operations on Lake Erie</p>
                    </div>
                    <div className="dev-commerce-card-light">
                      <div className="dev-commerce-card-icon" style={{ color: 'var(--gold)' }}><i className="fas fa-anchor"></i></div>
                      <h4>Port Infrastructure</h4>
                      <p>Maintaining and improving maritime infrastructure</p>
                    </div>
                    <div className="dev-commerce-card-light">
                      <div className="dev-commerce-card-icon" style={{ color: '#059669' }}><i className="fas fa-industry"></i></div>
                      <h4>Industrial Access</h4>
                      <p>Waterfront industrial site access and logistics</p>
                    </div>
                    <div className="dev-commerce-card-light">
                      <div className="dev-commerce-card-icon" style={{ color: '#7C3AED' }}><i className="fas fa-handshake"></i></div>
                      <h4>Trade Relations</h4>
                      <p>Building commercial maritime partnerships</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
