import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import FaqAccordion from '@/components/ui/FaqAccordion';

export const metadata = { title: 'Did You Know?' };

const generalQuestions = [
  {
    question: 'What is a Port Authority?',
    answer: (
      <p>We are a local government entity that is granted special permissions/abilities through the Ohio Revised Code.</p>
    ),
  },
  {
    question: 'What is the difference between the Lorain Port & Finance Authority and the Lorain County Port Authority?',
    answer: (
      <p>The Lorain Port and Finance Authority is a completely separate entity from the Lorain County Port Authority located in Elyria at 226 Middle Avenue on the fifth floor. While they have similar capabilities offered through the ORC, each organization has its own executive director, staff, board of directors and set of operating procedures. The Lorain Port and Finance Authority currently only owns property in the City of Lorain. The Lorain County Port Authority owns/manages properties throughout the county.</p>
    ),
  },
  {
    question: 'Do you manage the Lorain County Land Bank?',
    answer: (
      <p>The Lorain County Land Bank is managed by the Lorain County Port Authority. They can be reached at <a href="tel:4403282326">440-328-2326</a> or <a href="tel:4403282336">440-328-2336</a>.</p>
    ),
  },
];

const eventsVendorQuestions = [
  {
    question: 'Do you book talent for events at Black River Landing?',
    answer: (
      <p>Yes. We book talent for Rockin&apos; on the River and BRL Events. Please contact our Operations Director Tom Brown at <a href="mailto:tbrown@lorainportauthority.com">tbrown@lorainportauthority.com</a>.</p>
    ),
  },
  {
    question: 'Can I bring my food truck to Black River Landing?',
    answer: (
      <p>Operations Director Tom Brown coordinates all food and drink vendors for Rockin&apos; on the River and BRL Events. We do have a separate application for vendors who want to sell goods when events aren&apos;t taking place. Our Vendor License Application includes a $50 license fee (yearly), and a $50 application fee that is charged per occurrence and/or per facility.</p>
    ),
  },
  {
    question: 'Is Black River Landing always open?',
    answer: (
      <p>BRL is open to the public when an event isn&apos;t taking place. The park opens at dawn and closes at 11 p.m.</p>
    ),
  },
  {
    question: 'Are dogs welcome at BRL?',
    answer: (
      <p>When an event isn&apos;t taking place, yes, BRL is a dog-friendly park featuring walking paths, pet waste stations and a doggie water fountain. Dogs are not welcome at Rockin&apos; on the River or BRL Events. Other event promoters/organizers are responsible for determining if they allow dogs or not and should be contacted directly.</p>
    ),
  },
];

const dronePolicyQuestions = [
  {
    question: 'What is the drone policy at LPFA properties?',
    answer: (
      <>
        <p>The Lorain Port &amp; Finance Authority supports responsible drone use while prioritizing public safety and privacy. Drones are prohibited at all LPFA properties, venues, and events unless prior written approval is granted by the Executive Director to a licensed FAA Part 107 operator.</p>
        <p style={{ marginTop: '0.75rem' }}>Drones (also known as Unmanned Aircraft Systems) can be used recreationally for various activities, but you should be aware that there are safety rules and regulations about how and where you can fly. These safety rules are regulated by the Federal Aviation Administration (FAA). The Lorain Port &amp; Finance Authority supports responsible drone ownership and has taken steps to adopt an official drone policy.</p>
        <p style={{ marginTop: '0.75rem' }}>In order to fly a drone at a LPFA property, venue, or event you must receive prior permission from the Executive Director. You will be asked to present a valid Part 107 FAA License for said approval. All approved Part 107 pilots must still follow all safety rules regulated by the FAA.</p>
      </>
    ),
  },
  {
    question: 'What are the FAA basic safety rules for drones?',
    answer: (
      <>
        <ol className="drone-rules">
          <li>Register your drone &ndash; mark it on the outside with the registration number and carry proof of registration with you.</li>
          <li>Fly only for recreational purposes.</li>
          <li>Never fly over any person(s) or moving vehicle.</li>
          <li>Never fly over a public or private event with a large group of people.</li>
          <li>Never interfere with emergency response activities such as disaster relief, any type of accident response, law enforcement activities, firefighting, or hurricane recovery efforts.</li>
          <li>Fly your drone at or below 400 feet above the ground when in uncontrolled (Class G) airspace.</li>
          <li>Keep your drone within your visual line of sight, or within the visual line-of-sight of a visual observer who is co-located (physically next to) and in direct communication with you.</li>
          <li>Do not fly at night unless your drone has lighting that allows you to know its location and orientation at all times.</li>
          <li>Give way to and do not interfere with manned aircraft.</li>
          <li>Never fly under the influence of drugs or alcohol. Many over-the-counter medications have side effects that could impact your ability to safely operate your drone.</li>
          <li>Do not operate your drone in a careless or reckless manner.</li>
        </ol>
        <p className="drone-note">Note: These are subject to change per FAA regulations. Please always check their website for the complete, most current and up-to-date rules and regulations for drone ownership. Violators will be prosecuted to the full extent of the law.</p>
      </>
    ),
  },
];

export default function DidYouKnowPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <Link href="/about">About</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Did You Know?</span>
          </nav>
          <div className="page-hero-label">Common Questions</div>
          <h1>Did You Know?</h1>
          <p>Answers to frequently asked questions about the Lorain Port &amp; Finance Authority.</p>
        </div>
      </section>

      {/* FAQ CONTENT */}
      <section className="section">
        <div className="container" style={{ maxWidth: '820px' }}>

          {/* GENERAL QUESTIONS */}
          <div className="faq-section" data-animate="fade-up">
            <div className="faq-section-header">
              <div className="faq-section-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-building-columns"></i></div>
              <h3>General Questions</h3>
            </div>
            <FaqAccordion items={generalQuestions} />
          </div>

          {/* EVENTS & VENDORS */}
          <div className="faq-section" data-animate="fade-up">
            <div className="faq-section-header">
              <div className="faq-section-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-calendar-star"></i></div>
              <h3>Events &amp; Vendors</h3>
            </div>
            <FaqAccordion items={eventsVendorQuestions} />
          </div>

          {/* DRONE POLICY */}
          <div className="faq-section" data-animate="fade-up">
            <div className="faq-section-header">
              <div className="faq-section-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}><i className="fas fa-drone"></i></div>
              <h3>Drone Policy</h3>
            </div>
            <FaqAccordion items={dronePolicyQuestions} />
          </div>

        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Still Have Questions?</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>We&apos;re Here to Help</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Can&apos;t find the answer you&apos;re looking for? Reach out to our team directly.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-gold">Contact Us</Link>
              <Link href="/about" className="btn btn-outline-white">About LPFA</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
