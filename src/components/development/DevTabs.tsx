'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface RFP {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'new' | 'open' | 'closed';
  posted_date: string;
  deadline_date: string | null;
  location: string;
  document_url: string | null;
}

type TabId = 'brownfields' | 'financing' | 'rfp' | 'commerce';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'rfp', label: 'RFPs & Bids', icon: 'fa-file-contract' },
  { id: 'financing', label: 'Financing', icon: 'fa-hand-holding-dollar' },
  { id: 'brownfields', label: 'Brownfields', icon: 'fa-leaf' },
  { id: 'commerce', label: 'Waterborne Commerce', icon: 'fa-ship' },
];

export default function DevTabs() {
  const [active, setActive] = useState<TabId>('rfp');
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [nlFirst, setNlFirst] = useState('');
  const [nlLast, setNlLast] = useState('');
  const [nlEmail, setNlEmail] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [rfpsLoading, setRfpsLoading] = useState(true);
  const [expandedRfp, setExpandedRfp] = useState<string | null>(null);

  // Support hash links from nav (e.g. /development#financing)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    if (tabs.some(t => t.id === hash)) {
      setActive(hash);
    }
  }, []);

  // Fetch RFPs from Supabase (with timeout to prevent infinite loading)
  useEffect(() => {
    async function loadRfps() {
      const timeout = setTimeout(() => setRfpsLoading(false), 6000);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('rfps')
          .select('*')
          .neq('status', 'archived')
          .order('posted_date', { ascending: false });
        setRfps(data || []);
      } catch (err) {
        console.error('Failed to load RFPs:', err);
      } finally {
        clearTimeout(timeout);
        setRfpsLoading(false);
      }
    }
    loadRfps();
  }, []);

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNlError('');
    setNlLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: nlFirst,
          last_name: nlLast,
          email: nlEmail,
          subject: 'newsletter',
          message: 'Newsletter subscription from RFPs & Bids page',
          newsletter: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong.');
      }
      setNewsletterSuccess(true);
    } catch (err) {
      setNlError(err instanceof Error ? err.message : 'Something went wrong.');
    }
    setNlLoading(false);
  }

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
                  <Link href="/brownfields" className="btn btn-primary">Learn More</Link>
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
              <div className="dev-two-col">
                <div>
                  <div className="section-label">Capital Finance</div>
                  <h2 style={{ marginBottom: '1.25rem' }}>Financing &amp; Projects</h2>
                  <p style={{ marginBottom: '1rem' }}>The Lorain Port Authority has helped to finance a number of projects in the city of Lorain and surrounding areas to a total of $144 million issued in bonds to date.</p>
                  <p style={{ marginBottom: '1rem' }}>We are an independent lender offering solutions for capital finance challenges and special projects, providing creative financing options to accommodate your individual needs.</p>
                  <p style={{ marginBottom: '2rem' }}>Programs include Construction Financing, Conduit Financing, PACE energy loans, Special Assessment financing, and Opportunity Zone investments.</p>
                  <Link href="/financing" className="btn btn-primary">Learn More</Link>
                </div>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="dev-info-card">
                      <div className="dev-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-hand-holding-dollar"></i></div>
                      <div><h4>$144M+ in Bonds Issued</h4><p>Across 22 projects since 1967, financing everything from industrial facilities to senior housing.</p></div>
                    </div>
                    <div className="dev-info-card">
                      <div className="dev-info-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-bolt"></i></div>
                      <div><h4>PACE Energy Loans</h4><p>$100K&ndash;$500K for energy efficiency and renewable energy improvements at 2.5%&ndash;4% fixed rates.</p></div>
                    </div>
                    <div className="dev-info-card">
                      <div className="dev-info-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}><i className="fas fa-file-contract"></i></div>
                      <div><h4>Multiple Programs</h4><p>Construction, conduit, special assessment financing, and Opportunity Zone investments.</p></div>
                    </div>
                  </div>
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
                {rfpsLoading ? (
                  <>
                    {[1, 2].map(i => (
                      <div key={i} className="rfp-card" style={{ opacity: 0.5 }}>
                        <div className="rfp-icon"><i className="fas fa-spinner fa-spin"></i></div>
                        <div className="rfp-body">
                          <div className="rfp-header"><h4 style={{ background: 'var(--gray-100)', height: '1.2em', width: '60%', borderRadius: '4px' }}>&nbsp;</h4></div>
                          <p style={{ background: 'var(--gray-100)', height: '3em', borderRadius: '4px' }}>&nbsp;</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : rfps.length === 0 ? (
                  <div className="rfp-card">
                    <div className="rfp-icon"><i className="fas fa-info-circle"></i></div>
                    <div className="rfp-body">
                      <h4>No Active RFPs</h4>
                      <p>There are currently no open requests for proposals. Check back soon or subscribe to our newsletter below to be notified when new opportunities are posted.</p>
                    </div>
                  </div>
                ) : (
                  rfps.map(rfp => {
                    const isExpanded = expandedRfp === rfp.id;
                    return (
                      <div key={rfp.id} className={`rfp-card rfp-collapsible${isExpanded ? ' rfp-expanded' : ''}`} style={rfp.status === 'closed' ? { opacity: 0.65 } : undefined}>
                        <div className="rfp-icon" style={rfp.status === 'closed' ? { background: 'rgba(100,116,139,0.08)', color: 'var(--gray-500)' } : undefined}>
                          <i className={`fas ${rfp.icon || 'fa-file-contract'}`}></i>
                        </div>
                        <div className="rfp-body">
                          <button
                            className="rfp-toggle"
                            onClick={() => setExpandedRfp(isExpanded ? null : rfp.id)}
                            aria-expanded={isExpanded}
                          >
                            <div className="rfp-header">
                              <h4>{rfp.title}</h4>
                              <span className={`rfp-status rfp-${rfp.status}`}>
                                {rfp.status === 'new' ? 'New' : rfp.status === 'open' ? 'Open' : 'Closed'}
                              </span>
                            </div>
                            <div className="rfp-toggle-meta">
                              <span><i className="fas fa-calendar"></i> {rfp.status === 'closed' ? 'Closed' : 'Posted'}: {new Date(rfp.posted_date).getFullYear()}</span>
                              {rfp.deadline_date && <span><i className="fas fa-clock"></i> Deadline: {new Date(rfp.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                              <span><i className="fas fa-map-marker-alt"></i> {rfp.location}</span>
                              <i className={`fas fa-chevron-down rfp-chevron${isExpanded ? ' rfp-chevron-up' : ''}`}></i>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="rfp-details">
                              <div className="rfp-description" dangerouslySetInnerHTML={{ __html: rfp.description }} />
                              {rfp.document_url && (
                                <div style={{ marginTop: '1rem' }}>
                                  <a href={rfp.document_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm">
                                    <i className="fas fa-download" style={{ marginRight: '0.4rem' }}></i>Download RFP Document
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="dev-info-card" style={{ marginTop: '2rem' }}>
                <div className="dev-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-bell"></i></div>
                <div>
                  <h4>Stay Notified of New RFPs</h4>
                  <p style={{ marginBottom: '0.75rem' }}>Sign up for our newsletter or contact us to be added to our procurement notification list. We&apos;ll alert you when new opportunities are posted.</p>
                  {!showNewsletter ? (
                    <button onClick={() => setShowNewsletter(true)} className="btn btn-primary btn-sm">Subscribe to Newsletter</button>
                  ) : newsletterSuccess ? (
                    <div className="newsletter-inline-success">
                      <i className="fas fa-check-circle"></i> You&apos;re subscribed! We&apos;ll keep you updated.
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="newsletter-inline-form">
                      <div className="newsletter-inline-fields">
                        <input type="text" placeholder="First Name" value={nlFirst} onChange={(e) => setNlFirst(e.target.value)} required />
                        <input type="text" placeholder="Last Name" value={nlLast} onChange={(e) => setNlLast(e.target.value)} required />
                        <input type="email" placeholder="Email Address" value={nlEmail} onChange={(e) => setNlEmail(e.target.value)} required />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={nlLoading}>
                          {nlLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Subscribe'}
                        </button>
                      </div>
                      {nlError && <p className="newsletter-inline-error"><i className="fas fa-exclamation-circle"></i> {nlError}</p>}
                    </form>
                  )}
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
                  <Link href="/commerce" className="btn btn-primary">Learn More</Link>
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
