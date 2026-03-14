'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NavAuthButton() {
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (loading) return null;

  if (!user || !profile) {
    return (
      <li role="none">
        <Link href="/login" className="nav-auth-btn" role="menuitem">
          <i className="fas fa-user"></i>
          <span>Log In</span>
        </Link>
      </li>
    );
  }

  const initial = profile.display_name.charAt(0).toUpperCase();

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <li className="has-dropdown nav-auth-item" role="none" ref={ref}>
      <button
        className="nav-auth-btn nav-auth-logged-in"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="nav-auth-avatar">{initial}</span>
        <span className="nav-auth-name">{profile.display_name}</span>
        <i className="fas fa-chevron-down" style={{ fontSize: '0.6rem' }}></i>
      </button>
      {open && (
        <ul className="dropdown nav-auth-dropdown" role="menu">
          <li role="none">
            <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>
              <i className="fas fa-user-circle"></i> My Account
            </Link>
          </li>
          <li role="none">
            <Link href="/account#catches" role="menuitem" onClick={() => setOpen(false)}>
              <i className="fas fa-fish"></i> My Catches
            </Link>
          </li>
          <li role="none" className="nav-auth-divider"></li>
          <li role="none">
            <button role="menuitem" onClick={handleSignOut}>
              <i className="fas fa-sign-out-alt"></i> Log Out
            </button>
          </li>
        </ul>
      )}
    </li>
  );
}
