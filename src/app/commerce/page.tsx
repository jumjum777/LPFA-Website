import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'Waterborne Commerce' };

export default function CommercePage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <Link href="/development">Development &amp; Finance</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Waterborne Commerce</span>
          </nav>
          <div className="page-hero-label">Maritime Industry</div>
          <h1>Waterborne Commerce</h1>
          <p>Since 1976, the Lorain Port Authority has supported commercial shipping, dredging, and industrial growth along Lake Erie &mdash; strengthening regional and global trade through efficient operations and sustainable development.</p>
        </div>
      </section>

      {/* PORT OPERATIONS */}
      <section className="section">
        <div className="container">
          <div className="commerce-grid" data-animate="fade-up">
            <div>
              <div className="section-label">Port Operations</div>
              <h2 style={{ marginBottom: '1.25rem' }}>Shipping, Dredging &amp; Waterfront Property</h2>
              <p>The Lorain Port Authority is an active commercial port, maintained as a deep water navigational channel through dredging, providing an ideal environment for industrial development and growth.</p>
              <p>Lorain&apos;s strategic location at the mouth of the Black River on Lake Erie has made it a working port city for generations. The LPFA supports continued commercial maritime activity &mdash; a critical driver of jobs and economic activity in our region.</p>
            </div>
            <div>
              <div className="commerce-stats-grid">
                <div className="commerce-stat-card">
                  <div className="commerce-stat-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-ship"></i></div>
                  <h4>Commercial Shipping</h4>
                  <p>Supporting cargo and freight operations on Lake Erie</p>
                </div>
                <div className="commerce-stat-card">
                  <div className="commerce-stat-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-anchor"></i></div>
                  <h4>Port Infrastructure</h4>
                  <p>Maintaining and improving maritime infrastructure</p>
                </div>
                <div className="commerce-stat-card">
                  <div className="commerce-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}><i className="fas fa-industry"></i></div>
                  <h4>Industrial Access</h4>
                  <p>Waterfront industrial site access and logistics</p>
                </div>
                <div className="commerce-stat-card">
                  <div className="commerce-stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}><i className="fas fa-handshake"></i></div>
                  <h4>Trade Relations</h4>
                  <p>Building commercial maritime partnerships</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIKE DISPOSAL SITE */}
      <section className="section bg-light" id="dike">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Infrastructure</div>
            <h2 className="section-title">Dike Disposal Site</h2>
            <p className="section-desc">Constructed in June 1976, the dike disposal facility is located adjacent to the east breakwater, off-shore with a semi-circular shape covering a surface area of 58 acres.</p>
          </div>

          <div className="commerce-specs" data-animate="fade-up">
            <div className="commerce-spec-item">
              <div className="commerce-spec-number">58</div>
              <div className="commerce-spec-label">Acres</div>
              <div className="commerce-spec-desc">Surface area coverage</div>
            </div>
            <div className="commerce-spec-item">
              <div className="commerce-spec-number">1.85M</div>
              <div className="commerce-spec-label">Cubic Yards</div>
              <div className="commerce-spec-desc">Dredge material capacity</div>
            </div>
            <div className="commerce-spec-item">
              <div className="commerce-spec-number">8 ft</div>
              <div className="commerce-spec-label">Above LWD</div>
              <div className="commerce-spec-desc">Rubble mound height</div>
            </div>
            <div className="commerce-spec-item">
              <div className="commerce-spec-number">$8.3M</div>
              <div className="commerce-spec-label">Construction</div>
              <div className="commerce-spec-desc">Funded by US Army Corps of Engineers</div>
            </div>
          </div>
        </div>
      </section>

      {/* SHIPPING ACTIVITY */}
      <section className="section" id="shipping">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Port Activity</div>
            <h2 className="section-title">Lorain Shipping Activity</h2>
          </div>

          <div className="commerce-terminals" data-animate="fade-up">
            <div className="commerce-terminal-card">
              <div className="commerce-terminal-icon"><i className="fas fa-warehouse"></i></div>
              <h3>Jonick Dock &amp; Terminal</h3>
              <div className="commerce-terminal-materials">
                <span>Coke Breeze</span>
                <span>Coke Furnace</span>
                <span>Coke Nut</span>
                <span>Mill Scale</span>
                <span>Salt</span>
                <span>Slag</span>
              </div>
            </div>
            <div className="commerce-terminal-card">
              <div className="commerce-terminal-icon"><i className="fas fa-boxes-stacked"></i></div>
              <h3>Amcor Corporation</h3>
              <div className="commerce-terminal-materials">
                <span>Potash</span>
                <span>Salt</span>
              </div>
            </div>
            <div className="commerce-terminal-card">
              <div className="commerce-terminal-icon"><i className="fas fa-truck-loading"></i></div>
              <h3>Terminal Ready Mix</h3>
              <div className="commerce-terminal-materials">
                <span>Limestone</span>
                <span>Sand</span>
                <span>Gravel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOREIGN TRADE ZONE */}
      <section className="section bg-dark-navy" id="ftz">
        <div className="container">
          <div className="commerce-grid" data-animate="fade-up">
            <div>
              <div className="section-label" style={{ color: 'var(--gold-muted)', background: 'rgba(252,211,77,0.1)', borderColor: 'rgba(252,211,77,0.2)' }}>Trade &amp; Commerce</div>
              <h2 style={{ color: '#fff', marginBottom: '1.25rem' }}>Foreign Trade Zone</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>The U.S. Foreign-Trade Zone (FTZ) program is a unique global supply chain management tool that assists U.S. companies engaged in international trade by offering significant, ongoing cost savings.</p>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Created in 1934 by Congress as an incentive to encourage companies to keep investment and jobs in the United States, an FTZ is a designated area within the US that is considered to be outside the stream of international commerce.</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '1.5rem' }}>The Lorain Port Authority is part of Foreign-Trade Zone 40 and a recipient of the Pacesetter Award.</p>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="commerce-ftz-card">
                  <div className="commerce-ftz-icon"><i className="fas fa-building"></i></div>
                  <div>
                    <h4>General Purpose Zones</h4>
                    <p>Accommodate multiple companies and activities in industrial and commercial parks.</p>
                  </div>
                </div>
                <div className="commerce-ftz-card">
                  <div className="commerce-ftz-icon"><i className="fas fa-industry"></i></div>
                  <div>
                    <h4>Subzones</h4>
                    <p>Established for single companies with specific manufacturing or processing operations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="section" id="resources">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Downloads</div>
            <h2 className="section-title">Additional Resources</h2>
          </div>

          <div className="commerce-resources" data-animate="fade-up">
            <a href="https://drive.google.com/file/d/1vnN-y-K-NbG5BbCUfQx_iJTpbkxAqo_u/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="commerce-resource-card">
              <div className="commerce-resource-icon"><i className="fas fa-map"></i></div>
              <h4>Lorain Harbor Maps</h4>
              <span className="commerce-resource-dl"><i className="fas fa-external-link-alt"></i> View Document</span>
            </a>
            <a href="https://drive.google.com/file/d/1hInb6USmcnUUiwpG7ZlEU18sHYZpRVL-/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="commerce-resource-card">
              <div className="commerce-resource-icon"><i className="fas fa-landmark"></i></div>
              <h4>Port History</h4>
              <span className="commerce-resource-dl"><i className="fas fa-external-link-alt"></i> View Document</span>
            </a>
            <a href="https://drive.google.com/file/d/1E3eFHQeuFEHQPJpt5pOizyLeK9UlH6F7/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="commerce-resource-card">
              <div className="commerce-resource-icon"><i className="fas fa-file-alt"></i></div>
              <h4>Black River Wharf Info Sheet</h4>
              <span className="commerce-resource-dl"><i className="fas fa-external-link-alt"></i> View Document</span>
            </a>
            <a href="https://drive.google.com/file/d/1R7jHzEJLqJQytNUFDns3PkCcKRRDbVT/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="commerce-resource-card">
              <div className="commerce-resource-icon"><i className="fas fa-water"></i></div>
              <h4>Waterfront Development Info</h4>
              <span className="commerce-resource-dl"><i className="fas fa-external-link-alt"></i> View Document</span>
            </a>
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section className="section bg-light" id="videos">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Port Lorain</div>
            <h2 className="section-title">Port Traffic Videos</h2>
          </div>

          <div className="commerce-videos" data-animate="fade-up">
            <div className="commerce-video-wrap">
              <h3>Dorothy Anne Arriving &mdash; November 23, 2022</h3>
              <div className="commerce-video-embed">
                <iframe
                  src="https://www.youtube.com/embed/gPG1FxGODNw"
                  title="Dorothy Anne arriving at Port Lorain"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <div className="commerce-video-wrap">
              <h3>Laura L Vanenkevort Arriving &mdash; July 7, 2022</h3>
              <div className="commerce-video-embed">
                <iframe
                  src="https://www.youtube.com/embed/NXHg4Hxh7Pw"
                  title="Laura L Vanenkevort arriving at Port Lorain"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }} data-animate="fade-up">
            <a href="https://www.youtube.com/@LorainPortandFinanceAuthority" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <i className="fab fa-youtube" style={{ marginRight: '0.5rem' }}></i> View More on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Get in Touch</div>
            <h2 style={{ marginBottom: '1rem' }}>Interested in Port Operations?</h2>
            <p style={{ maxWidth: '560px', margin: '0 auto 2rem' }}>Whether you&apos;re looking to ship through Port Lorain, explore trade zone benefits, or learn about waterfront industrial access &mdash; our team is here to help.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-primary">Contact Our Team</Link>
              <Link href="/development" className="btn btn-outline">Development &amp; Finance</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
