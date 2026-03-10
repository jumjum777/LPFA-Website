import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'Brownfields Program' };

const PROJECTS = [
  {
    title: 'Stoveworks',
    image: '/images/brownfields/stoveworks.jpg',
    text: 'Former industrial site at 1200 Long Ave with asbestos, arsenic, lead, and groundwater contamination. Phase I and II assessments completed via USEPA Brownfield Cleanup Grant. Leveraged $1.25M assessment and $14K cleanup dollars.',
  },
  {
    title: 'Carnegie Center',
    image: '/images/brownfields/carnegie-center.jpg',
    text: 'Home of the Lorain Historical Society, built in 1903 with a $30,000 gift from the Andrew Carnegie Building Foundation. Environmental assessment completed to support preservation and continued community programming.',
  },
  {
    title: 'Ariel on Broadway',
    image: '/images/brownfields/ariel-broadway.jpg',
    text: 'Former Spitzer Plaza Hotel at 301 Broadway Ave. Phase 1 assessment completed via USEPA grant. $9.1M restoration project leveraging $1.75M state redevelopment dollars for hotel, conference center, and commercial space.',
  },
  {
    title: 'United Way',
    image: '/images/brownfields/united-way.jpg',
    text: 'Phase I assessment at 624 Broadway Avenue. Leveraged $620K redevelopment dollars, creating 11 full-time jobs plus college internships and part-time coordinators for the Free Tax Prep Coalition.',
  },
  {
    title: 'Lorain Harbor AWP',
    image: '/images/brownfields/lorain-harbor-awp.jpg',
    text: 'Area Wide Planning Project covering five publicly owned sites along the Black River: Pellet Terminal, Black River Landing, Boat Launch, Riverbend Commerce Park, and Former Landfill. Led by Lorain County with USEPA support.',
  },
];

export default function BrownfieldsPage() {
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
            <span className="current">Brownfields Program</span>
          </nav>
          <div className="page-hero-label">Environmental Remediation</div>
          <h1>Brownfields Programs, Grants, Clean-Up, &amp; More</h1>
          <p>The Lorain Port Authority is committed to revitalizing former industrial and commercial sites through brownfield assessment and cleanup. With $600,000 in EPA grant funding, we&apos;re identifying and preparing sites for redevelopment to support a cleaner, stronger community.</p>
        </div>
      </section>

      {/* INFO CARDS + CONSIDER CALLOUT */}
      <section className="section">
        <div className="container">
          <div className="bf-info-grid" data-animate="fade-up">
            <div className="bf-info-card">
              <div className="bf-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}>
                <i className="fas fa-question-circle"></i>
              </div>
              <h3>What is a Brownfield?</h3>
              <p>&ldquo;&hellip;real property, the expansion, redevelopment, or reuse of which may be complicated by the presence of a hazardous substance, pollutant, or contamination.&rdquo; Includes residential, commercial, industrial properties, and mine scarred lands.</p>
            </div>

            <div className="bf-info-card">
              <div className="bf-info-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                <i className="fas fa-hand-holding-dollar"></i>
              </div>
              <h3>EPA Grant Program</h3>
              <p>The EPA Brownfields Grant Program assesses, cleans up, and reuses contaminated properties. In 2010, Lorain received $400,000 in assessment grants for hazardous substances and petroleum, helping address 200 acres of former steel mill land and Black River contamination.</p>
            </div>

            <div className="bf-info-card">
              <div className="bf-info-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}>
                <i className="fas fa-clipboard-list"></i>
              </div>
              <h3>What Grants Pay For</h3>
              <p>Inventory of brownfield sites, Phase I &amp; II site investigations, remedial action plans, and community outreach meetings.</p>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}><strong>Consider this program if</strong> you&apos;re purchasing, selling, or looking to increase the marketability of a property, or need an environmental assessment for financing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLETED PROJECTS — compact grid */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Success Stories</div>
            <h2 className="section-title">Completed Projects</h2>
          </div>

          <div className="bf-projects-grid" data-animate="fade-up">
            {PROJECTS.map((project) => (
              <div key={project.title} className="bf-project-card">
                <div className="bf-project-img">
                  <img src={project.image} alt={project.title} loading="lazy" />
                </div>
                <div className="bf-project-body">
                  <h3>{project.title}</h3>
                  <p>{project.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Get Involved</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Interested in a Brownfield Site?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Our team can help you navigate the brownfields assessment and cleanup process.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-gold">Contact Our Team</Link>
              <Link href="/development" className="btn btn-outline-white">Development &amp; Finance</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
