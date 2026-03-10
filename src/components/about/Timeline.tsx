'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  decade: string;
}

const TIMELINE_DATA: TimelineEntry[] = [
  {
    year: '1964',
    title: 'Port Authority Founded',
    description: 'The Lorain Port Authority was established on May 4, 1964 by an act of the Council of the City of Lorain. Its first major project was a $22 million renovation of the port, laying the groundwork for decades of waterfront development.',
    icon: 'fas fa-flag',
    color: '#1B8BEB',
    decade: '1960s',
  },
  {
    year: '1967',
    title: 'Dry Dock Facility Completed',
    description: 'The construction of a 305-meter dry dock facility was completed, marking a significant expansion of the port\'s industrial capacity and establishing Lorain as a key Great Lakes maritime hub.',
    icon: 'fas fa-anchor',
    color: '#0D9488',
    decade: '1960s',
  },
  {
    year: '1974',
    title: 'First Industrial Revenue Bond',
    description: 'The Authority issued its first Industrial Revenue Bond (IRB), providing $3.5 million to assist Allied Oil in the construction of fuel storage tanks along the Black River — pioneering a financing model that would drive decades of economic development.',
    icon: 'fas fa-file-invoice-dollar',
    color: '#D97706',
    decade: '1970s',
  },
  {
    year: '1970s\u20131980s',
    title: 'Port & River Renovation',
    description: 'The Authority led major renovations including the installation of the floating tire breakwall, renovation of the historic lighthouse, and construction of the east pier breakwall — transforming the harbor\'s infrastructure.',
    icon: 'fas fa-tools',
    color: '#7C3AED',
    decade: '1970s',
  },
  {
    year: '1995',
    title: 'Riverside Expansion',
    description: 'The Authority received a 10-hectare riverside plot from LTV Steel, leading to the creation of the $2.1 million Black River Wharf Boat Launch Ramp — opening the waterfront to recreational boating.',
    icon: 'fas fa-map-marked-alt',
    color: '#059669',
    decade: '1990s',
  },
  {
    year: '2000',
    title: 'First Concert at Riverside Park',
    description: 'The Authority hosted its first concert at Riverside Park, sparking the Black River Landing Concert Series that would transform Lorain\'s waterfront into a regional entertainment destination.',
    icon: 'fas fa-music',
    color: '#DC2626',
    decade: '2000s',
  },
  {
    year: '2010',
    title: 'Mile-Long Pier Renovation',
    description: 'The Authority provided $3.37 million to renovate the Mile-Long Pier, transforming it into a beloved public resource and one of the community\'s most treasured waterfront landmarks.',
    icon: 'fas fa-road',
    color: '#1B8BEB',
    decade: '2010s',
  },
  {
    year: '2014',
    title: 'Black River Landing Headquarters',
    description: 'The Authority moved into the Ferry Terminal Building at Black River Landing, establishing its headquarters right on the Black River — symbolizing its commitment to the waterfront.',
    icon: 'fas fa-building',
    color: '#0B1F3A',
    decade: '2010s',
  },
  {
    year: '2018',
    title: 'CDFA Strategic Plan',
    description: 'The Authority\'s strategic plan was prepared by the Council of Development Finance Agencies (CDFA), charting a course for the future of port development, financing, and community impact.',
    icon: 'fas fa-clipboard-check',
    color: '#7C3AED',
    decade: '2010s',
  },
  {
    year: '2022',
    title: 'EPA Brownfield Assessment Grant',
    description: 'The Authority received a $500,000 EPA Brownfield Assessment grant to evaluate and redevelop previously established industrial sites in Lorain — turning environmental challenges into economic opportunity.',
    icon: 'fas fa-leaf',
    color: '#059669',
    decade: '2020s',
  },
  {
    year: '2023',
    title: 'Waterfront Development Proposals',
    description: 'The Port requested development proposals for three key sites: the city-owned Pellet Terminal, the Port Authority-owned southern portion of Black River Landing, and the Black River Wharf — signaling a new era of waterfront transformation.',
    icon: 'fas fa-hard-hat',
    color: '#D97706',
    decade: '2020s',
  },
  {
    year: '2024',
    title: 'Harbor Dredging & Commerce',
    description: 'The Lorain Harbor received dredging through the upper channel of the Black River as part of a capital needs project. The port handled over 1.1 million tons of aggregate materials through 4 privately owned terminals, with 53 inbound ships received.',
    icon: 'fas fa-ship',
    color: '#1B8BEB',
    decade: '2020s',
  },
  {
    year: '2025',
    title: 'Amphitheater Groundbreaking',
    description: 'The Lorain Port & Finance Authority broke ground on the new $11 million Black River Landing Amphitheater and Stage, set to be complete in May 2026 — accommodating the growing crowds that attend the Rockin\' on the River concert series and other waterfront events.',
    icon: 'fas fa-star',
    color: '#DC2626',
    decade: '2020s',
  },
];

const DECADES = ['1960s', '1970s', '1990s', '2000s', '2010s', '2020s'];

export default function Timeline() {
  const [activeDecade, setActiveDecade] = useState('1960s');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isScrollingTo = useRef(false);

  // Drag-to-scroll state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    function onMouseDown(e: MouseEvent) {
      isDragging.current = true;
      hasDragged.current = false;
      dragStartX.current = e.pageX;
      dragScrollLeft.current = container!.scrollLeft;
      container!.style.cursor = 'grabbing';
      container!.style.scrollSnapType = 'none';
      container!.style.scrollBehavior = 'auto';
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      e.preventDefault();
      const dx = e.pageX - dragStartX.current;
      if (Math.abs(dx) > 5) hasDragged.current = true;
      container!.scrollLeft = dragScrollLeft.current - dx;
    }

    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      container!.style.cursor = '';
      container!.style.scrollSnapType = 'x mandatory';
      container!.style.scrollBehavior = '';
    }

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  function onCardClick(i: number) {
    if (hasDragged.current) return;
    setExpandedIndex(expandedIndex === i ? null : i);
  }

  // When user scrolls, detect which card is centered and update decade tab
  const handleScroll = useCallback(() => {
    if (isScrollingTo.current) return;
    const container = scrollRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const centerX = scrollLeft + containerWidth / 2;

    let closestIdx = 0;
    let closestDist = Infinity;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const cardCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(cardCenter - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    const decade = TIMELINE_DATA[closestIdx]?.decade;
    if (decade && decade !== activeDecade) {
      setActiveDecade(decade);
    }
  }, [activeDecade]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Clicking a decade tab scrolls to the first card of that decade
  function scrollToDecade(decade: string) {
    setActiveDecade(decade);
    setExpandedIndex(null);
    const idx = TIMELINE_DATA.findIndex(e => e.decade === decade);
    const el = cardRefs.current[idx];
    const container = scrollRef.current;
    if (!el || !container) return;

    isScrollingTo.current = true;
    const scrollTarget = el.offsetLeft - 24; // small left padding
    container.scrollTo({ left: scrollTarget, behavior: 'smooth' });

    // Release lock after scroll animation
    setTimeout(() => { isScrollingTo.current = false; }, 600);
  }

  // Arrow buttons
  function scrollByCard(dir: number) {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = cardRefs.current[0]?.offsetWidth || 320;
    container.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' });
  }

  return (
    <div className="tl-wrap">
      {/* Decade tabs */}
      <div className="tl-decade-pills">
        {DECADES.map(d => (
          <button
            key={d}
            className={`tl-decade-pill${activeDecade === d ? ' active' : ''}`}
            onClick={() => scrollToDecade(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Scroll container with arrows */}
      <div className="tl-scroll-outer">
        <button className="tl-arrow tl-arrow-left" onClick={() => scrollByCard(-1)} aria-label="Scroll left">
          <i className="fas fa-chevron-left"></i>
        </button>

        <div className="tl-scroll" ref={scrollRef}>
          {TIMELINE_DATA.map((entry, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <button
                key={entry.year}
                ref={(el) => { cardRefs.current[i] = el; }}
                className={`tl-card${isExpanded ? ' tl-card-expanded' : ''}`}
                onClick={() => onCardClick(i)}
                aria-expanded={isExpanded}
              >
                <div className="tl-card-icon" style={{ background: entry.color }}>
                  <i className={entry.icon}></i>
                </div>
                <span className="tl-year" style={{ color: entry.color }}>{entry.year}</span>
                <h4 className="tl-title">{entry.title}</h4>
                {isExpanded && (
                  <p className="tl-description">{entry.description}</p>
                )}
              </button>
            );
          })}
        </div>

        <button className="tl-arrow tl-arrow-right" onClick={() => scrollByCard(1)} aria-label="Scroll right">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
