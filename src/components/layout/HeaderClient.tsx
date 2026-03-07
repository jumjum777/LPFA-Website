'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function HeaderClient({ children }: { children: React.ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Header scroll hide/show
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const nav = header.querySelector('#main-nav');
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (nav) nav.classList.toggle('scrolled', currentY > 40);
          if (currentY > 200) {
            header.classList.toggle('hidden', currentY > lastY);
          } else {
            header.classList.remove('hidden');
          }
          lastY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile nav toggle
  useEffect(() => {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    const closeMenu = () => {
      menu.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    const handleToggle = () => {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', isOpen.toString());
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (!toggle.contains(e.target as Node) && !menu.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    const handleLinkClick = (e: Event) => {
      if (window.innerWidth < 768) {
        const target = e.currentTarget as HTMLElement;
        if (target.closest('.has-dropdown') && target.parentElement?.classList.contains('has-dropdown')) return;
        closeMenu();
      }
    };

    toggle.addEventListener('click', handleToggle);
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', handleLinkClick));

    return () => {
      toggle.removeEventListener('click', handleToggle);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      menu.querySelectorAll('a').forEach(link => link.removeEventListener('click', handleLinkClick));
    };
  }, []);

  // Mobile dropdown toggle
  useEffect(() => {
    const dropdownParents = document.querySelectorAll('.has-dropdown');
    const handlers: Array<{ link: Element; handler: (e: Event) => void }> = [];

    dropdownParents.forEach(parent => {
      const link = parent.querySelector('a');
      if (!link) return;

      const handler = (e: Event) => {
        if (window.innerWidth < 768) {
          e.preventDefault();
          parent.classList.toggle('dropdown-open');
        }
      };

      link.addEventListener('click', handler);
      handlers.push({ link, handler });
    });

    return () => {
      handlers.forEach(({ link, handler }) => link.removeEventListener('click', handler));
    };
  }, []);

  // Set active nav link based on pathname
  useEffect(() => {
    const menu = document.getElementById('nav-menu');
    if (!menu) return;

    const pathMap: Record<string, string> = {
      '/': '/',
      '/development': '/development',
      '/events': '/events',
      '/facilities': '/facilities',
      '/news': '/news',
      '/about': '/about',
      '/staff': '/about',
      '/board': '/about',
      '/didyouknow': '/about',
      '/marine': '/marine',
      '/donate': '/donate',
      '/contact': '/contact',
    };

    const activeBase = pathMap[pathname] || pathname;

    menu.querySelectorAll(':scope > li > a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      link.classList.toggle('active', href === activeBase);
    });
  }, [pathname]);

  return (
    <header className="site-header" id="site-header" ref={headerRef}>
      {children}
    </header>
  );
}
