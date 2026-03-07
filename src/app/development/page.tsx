import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'Development & Finance' };

export default function DevelopmentPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Development &amp; Finance</span>
          </nav>
          <div className="page-hero-label">Economic Growth</div>
          <h1>Development &amp; Finance</h1>
          <p>Catalyzing investment and opportunity along Lorain&apos;s Lake Erie waterfront through brownfields remediation, property financing, and strategic development partnerships.</p>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="container">
          <div className="stats-band-grid">
            <div className="stats-band-item" data-animate="fade-up" data-delay="0"><span className="num">$50M+</span><span className="lbl">Development Investment</span></div>
            <div className="stats-band-item" data-animate="fade-up" data-delay="100"><span className="num">Multiple</span><span className="lbl">Active Brownfield Sites</span></div>
            <div className="stats-band-item" data-animate="fade-up" data-delay="200"><span className="num">State &amp; Federal</span><span className="lbl">Grant Programs</span></div>
            <div className="stats-band-item" data-animate="fade-up" data-delay="300"><span className="num">Active</span><span className="lbl">RFPs Available</span></div>
          </div>
        </div>
      </div>

      {/* BROWNFIELDS */}
      <section className="section" id="brownfields">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div data-animate="fade-right">
              <div className="section-label">Environmental Remediation</div>
              <h2 style={{ marginBottom: '1.25rem' }}>Brownfields Program</h2>
              <p style={{ marginBottom: '1rem' }}>Lorain&apos;s industrial heritage left behind contaminated and underutilized properties — a challenge we&apos;re turning into opportunity. Our Brownfields Program provides grants and technical assistance to assess, clean up, and redevelop these sites for productive use.</p>
              <p style={{ marginBottom: '1rem' }}>We work with state and federal partners — including the U.S. EPA, Ohio EPA, and the Ohio Department of Development — to access the funding and expertise needed to make remediation projects viable.</p>
              <p style={{ marginBottom: '2rem' }}>Cleaned brownfield sites can be transformed into housing, commercial development, green space, or manufacturing — all of which create jobs and expand Lorain&apos;s tax base.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Inquire About Brownfields</Link>
              </div>
            </div>
            <div data-animate="fade-left">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(27,139,235,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-accent)', fontSize: '1.1rem', flexShrink: 0 }}><i className="fas fa-search"></i></div>
                  <div><h4 style={{ marginBottom: '0.3rem' }}>Phase I &amp; II Assessments</h4><p style={{ fontSize: '0.88rem' }}>Environmental site assessments to identify contamination and develop remediation strategies.</p></div>
                </div>
                <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: '1.1rem', flexShrink: 0 }}><i className="fas fa-leaf"></i></div>
                  <div><h4 style={{ marginBottom: '0.3rem' }}>Cleanup Grants</h4><p style={{ fontSize: '0.88rem' }}>Grant funding for remediation of petroleum, hazardous substance, and other contamination.</p></div>
                </div>
                <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(217,119,6,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '1.1rem', flexShrink: 0 }}><i className="fas fa-building"></i></div>
                  <div><h4 style={{ marginBottom: '0.3rem' }}>Redevelopment Planning</h4><p style={{ fontSize: '0.88rem' }}>Technical assistance and planning support to bring cleaned sites to market for productive reuse.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINANCING */}
      <section className="section bg-light" id="financing">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Property Finance</div>
            <h2 className="section-title">Development Financing Programs</h2>
            <p className="section-desc">We offer a range of financing tools to help private developers and property owners invest in Lorain&apos;s waterfront.</p>
          </div>
          <div className="programs-grid">
            <div className="program-card" data-animate="fade-up" data-delay="0">
              <div className="program-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-hand-holding-dollar"></i></div>
              <h3>Property Financing</h3>
              <p>The LPFA can provide property financing to support acquisition, development, and redevelopment of waterfront properties. Our flexible financing tools complement traditional bank lending to fill financing gaps.</p>
              <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
            </div>
            <div className="program-card" data-animate="fade-up" data-delay="100">
              <div className="program-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-landmark"></i></div>
              <h3>Tax Increment Financing</h3>
              <p>TIF arrangements allow new tax revenues generated by development to be reinvested into the project area — funding infrastructure improvements and making projects more financially viable.</p>
              <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
            </div>
            <div className="program-card" data-animate="fade-up" data-delay="200">
              <div className="program-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}><i className="fas fa-file-contract"></i></div>
              <h3>Development Agreements</h3>
              <p>We structure public-private partnerships and development agreements to incentivize quality investment on key waterfront sites, aligning developer interests with community goals.</p>
              <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
            </div>
            <div className="program-card" data-animate="fade-up" data-delay="300">
              <div className="program-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}><i className="fas fa-network-wired"></i></div>
              <h3>Grant Coordination</h3>
              <p>We help developers identify and navigate state and federal grant programs — from JobsOhio incentives to Community Development Block Grants — maximizing the financial viability of waterfront projects.</p>
              <Link href="/contact" className="btn btn-outline btn-sm">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* RFPs */}
      <section className="section" id="rfp">
        <div className="container">
          <div className="section-header" data-animate="fade-up">
            <div className="section-label">Procurement</div>
            <h2 className="section-title">Requests for Proposals &amp; Bids</h2>
            <p className="section-desc">Current development opportunities and procurement solicitations from the Lorain Port &amp; Finance Authority.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} data-animate="fade-up">
            <div className="rfp-card">
              <div className="rfp-icon"><i className="fas fa-anchor"></i></div>
              <div className="rfp-body" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
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
              <div className="rfp-body" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
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

          <div style={{ marginTop: '2.5rem', padding: '1.75rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }} data-animate="fade-up">
            <div style={{ width: '44px', height: '44px', background: 'rgba(27,139,235,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-accent)', fontSize: '1.1rem', flexShrink: 0 }}><i className="fas fa-bell"></i></div>
            <div>
              <h4 style={{ marginBottom: '0.3rem' }}>Stay Notified of New RFPs</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Sign up for our newsletter or contact us to be added to our procurement notification list. We&apos;ll alert you when new opportunities are posted.</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary btn-sm">Get Notified</Link>
                <Link href="/#newsletter" className="btn btn-outline btn-sm">Subscribe to Newsletter</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WATERBORNE COMMERCE */}
      <section className="section bg-dark-navy" id="commerce">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div data-animate="fade-right">
              <div className="section-label" style={{ color: 'var(--gold-muted)', background: 'rgba(252,211,77,0.1)', borderColor: 'rgba(252,211,77,0.2)' }}>Maritime Industry</div>
              <h2 style={{ color: '#fff', marginBottom: '1.25rem' }}>Waterborne Commerce</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1rem' }}>Lorain&apos;s strategic location at the mouth of the Black River on Lake Erie has made it a working port city for generations. The LPFA supports continued commercial maritime activity — a critical driver of jobs and economic activity in our region.</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>We work to maintain and improve port infrastructure, facilitate commercial shipping relationships, and ensure Lorain&apos;s viability as a Great Lakes maritime hub for future generations.</p>
              <Link href="/contact" className="btn btn-gold">Contact Our Team</Link>
            </div>
            <div data-animate="fade-left">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'rgba(27,139,235,0.8)', marginBottom: '0.75rem' }}><i className="fas fa-ship"></i></div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.4rem' }}>Commercial Shipping</h4>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Supporting cargo and freight operations on Lake Erie</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'rgba(217,119,6,0.8)', marginBottom: '0.75rem' }}><i className="fas fa-anchor"></i></div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.4rem' }}>Port Infrastructure</h4>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Maintaining and improving maritime infrastructure</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'rgba(16,185,129,0.8)', marginBottom: '0.75rem' }}><i className="fas fa-industry"></i></div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.4rem' }}>Industrial Access</h4>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Waterfront industrial site access and logistics</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: 'rgba(139,92,246,0.8)', marginBottom: '0.75rem' }}><i className="fas fa-handshake"></i></div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.4rem' }}>Trade Relations</h4>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Building commercial maritime partnerships</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-light">
        <div className="container" style={{ textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Get Started</div>
            <h2 style={{ marginBottom: '1rem' }}>Ready to Invest in Lorain?</h2>
            <p style={{ maxWidth: '560px', margin: '0 auto 2rem' }}>Whether you&apos;re interested in a brownfields site, development financing, or a partnership opportunity — our team is here to help.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-primary">Contact Our Team</Link>
              <Link href="/about" className="btn btn-outline">Learn About the LPFA</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
