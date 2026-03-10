import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'Financing & Projects' };

const PROGRAMS = [
  {
    icon: 'fa-building',
    color: 'rgba(27,139,235,0.1)',
    iconColor: 'var(--blue-accent)',
    title: 'Construction Financing',
    who: 'Developers, Business Owners',
    text: 'The Construction Financing Program can assist qualified businesses to receive a sales tax exemption on all construction materials related to the project by having the Port Authority lease the facility to the company. The borrower is the owner for federal tax purposes and acquires the project for $1.00 at the end of the lease term. The borrower retains full control of the property.',
  },
  {
    icon: 'fa-landmark',
    color: 'rgba(217,119,6,0.1)',
    iconColor: 'var(--gold)',
    title: 'Conduit Financing',
    who: '501(c)(3) Non-Profit Organizations, Manufacturing Projects',
    text: 'The Conduit Financing Program provides tax-exempt financing for land and building acquisition, renovations, new construction and equipment purchase. The program can provide up to 100% financing. In order to reduce transaction costs, the borrower may consider direct placement of the bonds with a local bank.',
  },
  {
    icon: 'fa-bolt',
    color: 'rgba(16,185,129,0.1)',
    iconColor: '#059669',
    title: 'PACE Program',
    who: 'Developers, Business Owners, Non-Profits, Government Entities',
    text: 'The PACE Program can finance investments in energy related improvements in new and existing real estate property, thereby reducing the operating costs of the borrower through energy cost savings. Eligible costs include any improvements that reduce energy costs, including heating and cooling systems, roof, insulation, windows, doors, solar, geothermal projects, etc. The PACE bonds are paid by the property owner with special assessments levied on the property. The program can provide up to 100% fixed-rate financing for a term not to exceed the expected useful life of the improvements.',
  },
  {
    icon: 'fa-road',
    color: 'rgba(139,92,246,0.1)',
    iconColor: '#7C3AED',
    title: 'Special Assessment',
    who: 'Developers, Business Owners',
    text: 'The Special Assessment Financing Program assists developers and business owners in financing public infrastructure projects such as roads, curbs, streetlights, utilities, sidewalks, landscaping, public parking garages, etc. Special assessment financing can be used to supplement TIF bonds. Special assessment bonds allow the borrower to reduce the amount of equity or conventional financing, and are non-recourse. The local municipality levies an annual special assessment on the project in an amount sufficient to finance debt issued to pay for certain public infrastructure costs related to the project. This program can provide 100% fixed-rate, tax-exempt financing for 10 to 33 years.',
  },
];

const PACE_BENEFITS = [
  'Can allow for zero up-front cash to make the investment',
  'Provides long-term, fixed-rate financing',
  'Assessments stay with the property, even if it\'s sold during the loan term',
  'Preserves borrowing capacity through off-balance sheet financing',
  'Allows borrower to pass payments through to tenants',
  'Provides greater long-term property value and rental benefits',
];

const PACE_EFFICIENCY = ['Lighting', 'HVAC', 'Windows', 'Doors', 'Roofing', 'Insulation'];
const PACE_RENEWABLE = ['Geothermal', 'Wind', 'Solar-photovoltaic', 'Solar-thermal water heating systems', 'Biomass energy', 'Gasification projects'];

const FINANCED_PROJECTS = [
  { year: '1967', name: 'American Ship Building Co', amount: '$7M', type: 'First Mortgage Revenue Bonds', desc: 'Financing the costs of acquiring, constructing, and equipping facilities related to building ships' },
  { year: '1973', name: 'Ashland Oil', amount: '$5M', type: 'First Mortgage Revenue Bonds', desc: 'Terminal facility for storage and distribution of petroleum' },
  { year: '1975', name: 'American Ship Building Co', amount: '$3.5M', type: 'First Mortgage Revenue Bonds', desc: 'Promote industrial and economic development of Ohio by creating jobs and increasing opportunities' },
  { year: '1980', name: 'American Ship Building Co', amount: '$4M', type: 'Revenue Bonds', desc: 'Paying the costs of adding to the industrial facilities of the project' },
  { year: '1981', name: 'Lorain Dock Company', amount: '$31M', type: 'Revenue Bonds', desc: 'Financing costs of acquiring, constructing, and equipping improvements and facilities' },
  { year: '1981', name: 'Republic Steel Corporation', amount: '$6.55M', type: 'Revenue Bonds', desc: 'Assisting in the financing of costs of acquiring and improving real property' },
  { year: '1989', name: 'Spitzer Project', amount: '$1.5M', type: 'Port Development Revenue Bonds', desc: 'Acquisition, construction, equipping, and improvement of port facilities' },
  { year: '1994', name: 'Spitzer Project', amount: '$4.735M', type: 'Adjustable Rate Revenue Bonds', desc: 'Refunding all outstanding $5.1M Series 1988 bonds' },
  { year: '1996', name: 'Spitzer Project', amount: '$1.24M', type: 'Revenue Bonds', desc: 'Acquisition, construction, equipping, and improvement of port authority facilities' },
  { year: '1996', name: 'Brush Wellman Inc.', amount: '$8.5M', type: 'Variable Rate Industrial Dev Revenue Bonds', desc: 'Financing the cost of the acquisition, construction, equipping and improvement of a Port Authority facility' },
  { year: '1999', name: 'Spitzer Project', amount: '$3.5M', type: 'Revenue Bonds', desc: 'Authorizing the execution and delivery of an agreement of lease and a sublease' },
  { year: '2001', name: 'Advanced Automotive Systems', amount: '$1M', type: 'Open End Mortgage', desc: 'Acquisition, construction, equipping, furnishing & improving of project' },
  { year: '2004', name: 'Spitzer Project', amount: '$3M', type: 'Revenue Bonds', desc: 'Acquiring the execution and delivery of an agreement of lease and a sublease' },
  { year: '2008', name: 'Horizon Activity Center', amount: '$6M', type: 'Economic Dev Revenue Bonds', desc: 'Making a loan to assist Horizon in financing the costs of Port Authority facilities' },
  { year: '2011', name: 'Marshall Plaza Apartments', amount: '$3.5M', type: 'Revenue Bonds', desc: 'Financing the acquisition and rehabilitation of a 90 unit multi-family residential rental facility in Lorain', image: '/images/financing/marshall-plaza.jpg' },
  { year: '2012', name: 'Altenheim Project', amount: '$10M', type: 'Variable Rate Revenue Bonds', desc: 'Refunding Cuyahoga County Ohio adjustable rate demand health care facilities revenue bonds' },
  { year: '2013', name: 'Fairfax Renaissance Dev Corp', amount: '$6.225M', type: 'Variable Rate Revenue Bonds', desc: 'Refunding Cuyahoga County Ohio multi-mode variable rate civic facility revenue bonds' },
  { year: '2016', name: 'Clover', amount: '$6M', type: 'Capital Lease Financing', desc: 'Financing a Port Authority facility for a 125 unit independent senior living facility', image: '/images/financing/clover.jpg' },
  { year: '2016', name: 'Ohio Guidestone', amount: '$7.8M', type: 'Economic Dev Revenue Bonds', desc: 'Financing and refinancing Port Authority facilities' },
  { year: '2016', name: 'Camaco Expansion', amount: '$4.6M', type: 'Capital Lease Financing', desc: 'Constructing and equipping an expansion of the Camaco LLC manufacturing plant in Lorain', image: '/images/financing/camaco.jpg' },
  { year: '2018', name: 'Horizon Education Center', amount: '$7.6M', type: 'Tax Exempt Revenue Bonds', desc: 'Building of a facility for Horizon Education Centers in Cleveland', image: '/images/financing/horizon.jpg' },
  { year: '2019', name: 'Ariel on Broadway', amount: '$10M', type: 'Capital Lease Financing', desc: 'Financing a 55 room hotel and rooftop conference center', image: '/images/financing/ariel-broadway.jpg' },
];

export default function FinancingPage() {
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
            <span className="current">Financing &amp; Projects</span>
          </nav>
          <div className="page-hero-label">Capital Finance</div>
          <h1>Financing &amp; Projects</h1>
          <p>The Lorain Port Authority has helped to finance a number of projects in the city of Lorain and surrounding areas to a total of $144 million issued in bonds to date. We are an independent lender offering solutions for capital finance challenges and special projects, providing creative financing options to accommodate your individual needs.</p>
        </div>
      </section>

      {/* FINANCING PROGRAMS */}
      <section className="section">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Programs</div>
            <h2 className="section-title">Financing Programs</h2>
          </div>
          <div className="fin-programs-grid" data-animate="fade-up">
            {PROGRAMS.map((p) => (
              <div key={p.title} className="fin-program-card">
                <div className="bf-info-icon" style={{ background: p.color, color: p.iconColor }}>
                  <i className={`fas ${p.icon}`}></i>
                </div>
                <h3>{p.title}</h3>
                <div className="fin-who"><i className="fas fa-user-check"></i> {p.who}</div>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACE DETAILS */}
      <section className="section bg-light">
        <div className="container">
          <div className="fin-pace-grid" data-animate="fade-up">
            <div>
              <div className="section-label">Energy Finance</div>
              <h2 style={{ marginBottom: '1rem' }}>PACE Loan Program</h2>
              <p style={{ marginBottom: '1rem' }}>The Lorain Port Authority has partnered with <a href="http://www.nopec.org/" target="_blank" rel="noopener">NOPEC</a> to provide a PACE loan program to the city of Lorain and surrounding areas. PACE is a mechanism that allows property owners to finance energy efficiency and renewable energy improvements through assessments on their real property tax bills, providing upfront capital with stable, predictable payments.</p>
              <p style={{ marginBottom: '1rem' }}>Loans range from <strong>$100,000 to $500,000</strong> with terms of <strong>5 to 20 years</strong> at fixed interest rates of <strong>2.5%&ndash;4%</strong>. Any commercial property owner in a NOPEC member community is eligible.</p>
              <h4 style={{ marginBottom: '0.5rem' }}>Benefits</h4>
              <ul className="fin-check-list">
                {PACE_BENEFITS.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="fin-eligible-wrap">
                <div className="fin-eligible-box">
                  <h4><i className="fas fa-plug"></i> Efficiency Improvements</h4>
                  <ul>{PACE_EFFICIENCY.map((e) => <li key={e}>{e}</li>)}</ul>
                </div>
                <div className="fin-eligible-box">
                  <h4><i className="fas fa-solar-panel"></i> Renewable Energy</h4>
                  <ul>{PACE_RENEWABLE.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OPPORTUNITY ZONES */}
      <section className="section">
        <div className="container">
          <div className="fin-opp-zone" data-animate="fade-up">
            <div className="fin-opp-icon"><i className="fas fa-map-marked-alt"></i></div>
            <div>
              <h3>Opportunity Zones</h3>
              <p>An Opportunity Zone is a census tract classified as an economically-distressed community where new investments may be eligible for preferential tax treatment. The goal of the Opportunity Zone Program is to drive investment in rural and low-income urban communities that have struggled to recover post-recession, unlocking private capital currently held in appreciated assets and redeploying it into distressed areas.</p>
              <p style={{ marginTop: '0.75rem' }}>The program allows a taxpayer to reinvest proceeds from the sale of an eligible business or property into an Opportunity Fund, which in turn invests in businesses or properties located within qualified Opportunity Zones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINANCED PROJECTS TABLE */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Track Record</div>
            <h2 className="section-title">Financed Projects</h2>
            <p className="section-desc">$144 million issued in bonds across 22 projects since 1967.</p>
          </div>
          <div className="fin-projects-table-wrap" data-animate="fade-up">
            <table className="fin-projects-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Project</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th className="fin-desc-col">Description</th>
                </tr>
              </thead>
              <tbody>
                {FINANCED_PROJECTS.map((p, i) => (
                  <tr key={i}>
                    <td className="fin-year">{p.year}</td>
                    <td className="fin-name">
                      {p.image ? (
                        <span className="fin-name-with-img">
                          <img src={p.image} alt={p.name} className="fin-thumb" loading="lazy" />
                          {p.name}
                        </span>
                      ) : p.name}
                    </td>
                    <td className="fin-amount">{p.amount}</td>
                    <td className="fin-type">{p.type}</td>
                    <td className="fin-desc-col">{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Get Started</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Interested in Financing?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>To learn more, contact our Executive Director, Tiffany McClelland at <a href="mailto:tmcclelland@lorainportauthority.com" style={{ color: 'var(--blue-accent)' }}>tmcclelland@lorainportauthority.com</a> or (440) 204-2269.</p>
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
