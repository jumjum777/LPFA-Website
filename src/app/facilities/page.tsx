import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'Facilities' };

export default function FacilitiesPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Facilities</span>
          </nav>
          <div className="page-hero-label">Our Properties</div>
          <h1>World-Class Waterfront Facilities</h1>
          <p>From premier event venues to public parks and boat launches &mdash; the LPFA manages and maintains Lorain&apos;s most treasured waterfront destinations.</p>
        </div>
      </section>

      {/* JUMP LINKS */}
      <div className="facility-jump-nav">
        <div className="container">
          <div className="facility-jump-nav-inner">
            <span className="facility-jump-label">Jump to:</span>
            <a href="#black-river-landing" className="facility-jump-link">Black River Landing</a>
            <a href="#mile-long-pier" className="facility-jump-link">Mile-Long Pier</a>
            <a href="#lakeside-landing" className="facility-jump-link">Lakeside Landing</a>
            <a href="#boat-launch" className="facility-jump-link">Boat Launch</a>
            <a href="#riverside-park" className="facility-jump-link">Riverside Park</a>
          </div>
        </div>
      </div>

      {/* BLACK RIVER LANDING */}
      <section className="section" id="black-river-landing">
        <div className="container">
          <div className="facility-detail">
            <div className="facility-img-block fib-brl" data-animate="fade-right">
              <div className="facility-icon-big"><i className="fas fa-water"></i></div>
            </div>
            <div className="facility-detail-content" data-animate="fade-left">
              <div className="section-label">Premier Event Venue</div>
              <h2>Black River Landing</h2>
              <p>Lorain&apos;s crown jewel waterfront destination, Black River Landing is a multi-use event venue and public gathering space situated at the confluence of the Black River and Lake Erie.</p>
              <p>From summer concerts and Independence Day fireworks to private corporate events and community festivals, Black River Landing is the heartbeat of Lorain&apos;s waterfront. The stunning waterfront setting provides a backdrop unlike any other venue in Northeast Ohio.</p>
              <ul className="facility-feature-list">
                <li><i className="fas fa-check"></i> Outdoor event stage and amphitheater area</li>
                <li><i className="fas fa-check"></i> Waterfront promenade and public access</li>
                <li><i className="fas fa-check"></i> Parking for hundreds of vehicles</li>
                <li><i className="fas fa-check"></i> Available for private event rental</li>
                <li><i className="fas fa-check"></i> Host of Rockin&apos; on the River and July 4th Fireworks</li>
                <li><i className="fas fa-check"></i> Accessible to all visitors</li>
              </ul>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/events" className="btn btn-primary">Upcoming Events</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="facility-section-divider" />

      {/* MILE-LONG PIER */}
      <section className="section" id="mile-long-pier">
        <div className="container">
          <div className="facility-detail reverse">
            <div className="facility-img-block fib-pier" data-animate="fade-left">
              <div className="facility-icon-big"><i className="fas fa-anchor"></i></div>
            </div>
            <div className="facility-detail-content" data-animate="fade-right">
              <div className="section-label">Lorain&apos;s Iconic Landmark</div>
              <h2>Mile-Long Pier</h2>
              <p>One of Lorain&apos;s most iconic and beloved landmarks, the Mile-Long Pier extends dramatically into Lake Erie &mdash; offering breathtaking panoramic views of the lake, the city skyline, and the lighthouse.</p>
              <p>A favorite destination for fishing, walking, and simply taking in the majesty of Lake Erie, the pier attracts thousands of visitors each year. The Lorain Lighthouse, sitting at the outer end of the breakwater, is one of the most photographed landmarks on the Great Lakes.</p>
              <ul className="facility-feature-list">
                <li><i className="fas fa-check"></i> Public access for walking and fishing</li>
                <li><i className="fas fa-check"></i> Panoramic views of Lake Erie</li>
                <li><i className="fas fa-check"></i> Views of the historic Lorain Lighthouse</li>
                <li><i className="fas fa-check"></i> Open year-round (weather permitting)</li>
                <li><i className="fas fa-check"></i> Popular photography and sightseeing destination</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="facility-section-divider" />

      {/* LAKESIDE LANDING */}
      <section className="section" id="lakeside-landing">
        <div className="container">
          <div className="facility-detail">
            <div className="facility-img-block fib-lakeside" data-animate="fade-right">
              <div className="facility-icon-big"><i className="fas fa-umbrella-beach"></i></div>
            </div>
            <div className="facility-detail-content" data-animate="fade-left">
              <div className="section-label">Event &amp; Recreation Venue</div>
              <h2>Lakeside Landing</h2>
              <p>Lakeside Landing is a beautiful waterfront facility offering a scenic setting for private events, community gatherings, and outdoor recreation along the shores of Lake Erie.</p>
              <p>With its stunning waterfront location and flexible event capabilities, Lakeside Landing provides an exceptional setting for weddings, corporate events, and community gatherings in a natural, waterfront environment.</p>
              <ul className="facility-feature-list">
                <li><i className="fas fa-check"></i> Waterfront location on Lake Erie</li>
                <li><i className="fas fa-check"></i> Available for private event rental</li>
                <li><i className="fas fa-check"></i> Outdoor recreation and public access</li>
                <li><i className="fas fa-check"></i> Scenic waterfront views</li>
                <li><i className="fas fa-check"></i> Accessible and family-friendly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="facility-section-divider" />

      {/* BOAT LAUNCH */}
      <section className="section" id="boat-launch">
        <div className="container">
          <div className="facility-detail reverse">
            <div className="facility-img-block fib-launch" data-animate="fade-left">
              <div className="facility-icon-big"><i className="fas fa-ship"></i></div>
            </div>
            <div className="facility-detail-content" data-animate="fade-right">
              <div className="section-label">Public Access</div>
              <h2>Black River Wharf Boat Launch</h2>
              <p>The Black River Wharf Boat Launch provides public access to the Black River and Lake Erie for recreational boaters, anglers, and water sports enthusiasts.</p>
              <p>One of the premier public boat launches in Lorain County, the facility provides a safe and accessible entry point to some of the best fishing and boating waters in the Great Lakes region. Whether you&apos;re launching a bass boat, kayak, or canoe &mdash; you&apos;ll find easy access here.</p>
              <ul className="facility-feature-list">
                <li><i className="fas fa-check"></i> Multi-lane public boat launch ramp</li>
                <li><i className="fas fa-check"></i> Trailer parking available</li>
                <li><i className="fas fa-check"></i> Access to Black River and Lake Erie</li>
                <li><i className="fas fa-check"></i> Popular fishing and boating destination</li>
                <li><i className="fas fa-check"></i> Seasonal operation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="facility-section-divider" />

      {/* RIVERSIDE PARK */}
      <section className="section" id="riverside-park">
        <div className="container">
          <div className="facility-detail">
            <div className="facility-img-block fib-river" data-animate="fade-right">
              <div className="facility-icon-big"><i className="fas fa-tree"></i></div>
            </div>
            <div className="facility-detail-content" data-animate="fade-left">
              <div className="section-label">Public Green Space</div>
              <h2>Riverside Park</h2>
              <p>Riverside Park is a scenic public green space nestled along the banks of the Black River, offering Lorain residents and visitors a peaceful natural retreat in the heart of the waterfront district.</p>
              <p>Whether you&apos;re enjoying a morning walk, having a riverside picnic, or simply taking in the natural beauty of the Black River, Riverside Park offers a genuine respite in an urban waterfront setting.</p>
              <ul className="facility-feature-list">
                <li><i className="fas fa-check"></i> Scenic walking paths along the Black River</li>
                <li><i className="fas fa-check"></i> Picnic areas and open green space</li>
                <li><i className="fas fa-check"></i> River access and nature observation</li>
                <li><i className="fas fa-check"></i> Free and open to the public</li>
                <li><i className="fas fa-check"></i> Accessible for all visitors</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
