import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import StaffPageClient from '@/components/staff/StaffPage';
import { createServerClient } from '@/lib/supabase/server';
import type { StaffMember } from '@/lib/types';

export const metadata = { title: 'Our Staff' };
export const revalidate = 60;

export default async function StaffPage() {
  const supabase = await createServerClient();
  const { data: staff } = await supabase
    .from('staff_members')
    .select('*')
    .eq('is_published', true)
    .order('sort_order');

  const members: StaffMember[] = staff || [];

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
            <span className="current">Staff</span>
          </nav>
          <div className="page-hero-label">Our People</div>
          <h1>Meet the Team</h1>
          <p>Dedicated professionals committed to Lorain&apos;s waterfront future.</p>
        </div>
      </section>

      <StaffPageClient members={members} />

      {/* CONTACT CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Work With Us</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Ready to Build Lorain&apos;s Future?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Whether you&apos;re a developer, business, community partner, or resident — we want to hear from you.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-gold">Contact Us</Link>
              <Link href="/development" className="btn btn-outline-white">View Opportunities</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
