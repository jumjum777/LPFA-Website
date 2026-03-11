'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const parts = name.trim().split(/\s+/);
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';

    if (!first_name) {
      setError('Please enter your name.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name: last_name || first_name,
          email,
          subject: 'newsletter',
          message: 'Newsletter subscription from homepage',
          newsletter: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong.');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="newsletter-form">
        <div className="newsletter-success">
          <i className="fas fa-check-circle"></i> You&apos;re subscribed! We&apos;ll keep you updated.
        </div>
      </div>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
      <div className="newsletter-fields">
        <input
          type="text"
          placeholder="Your Name"
          autoComplete="name"
          required
          aria-label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Your Email Address"
          autoComplete="email"
          required
          aria-label="Your Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn btn-gold" disabled={loading}>
          {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <>Subscribe <i className="fas fa-arrow-right"></i></>}
        </button>
      </div>
      {error && <p className="newsletter-error"><i className="fas fa-exclamation-circle"></i> {error}</p>}
      <p className="newsletter-note">We respect your privacy. Unsubscribe at any time.</p>
    </form>
  );
}
