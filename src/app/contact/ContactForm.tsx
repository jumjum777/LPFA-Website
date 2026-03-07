'use client';

import { FormEvent, useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    // Simulate submission
    setSubmitted(true);
    form.reset();
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="contact-form" data-animate="fade-left">
      <h3>Send Us a Message</h3>
      {submitted && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', color: '#059669', fontWeight: 500 }}>
          <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i> Thank you! Your message has been sent. We&apos;ll be in touch soon.
        </div>
      )}
      <form id="contact-form" noValidate onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cf-first">First Name *</label>
            <input type="text" id="cf-first" name="first_name" required autoComplete="given-name" />
          </div>
          <div className="form-group">
            <label htmlFor="cf-last">Last Name *</label>
            <input type="text" id="cf-last" name="last_name" required autoComplete="family-name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cf-email">Email Address *</label>
            <input type="email" id="cf-email" name="email" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="cf-phone">Phone Number</label>
            <input type="tel" id="cf-phone" name="phone" autoComplete="tel" />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="cf-subject">Subject / Topic *</label>
          <select id="cf-subject" name="subject" required defaultValue="">
            <option value="" disabled>Please select a topic...</option>
            <option value="development">Economic Development &amp; Financing</option>
            <option value="brownfields">Brownfields Program</option>
            <option value="rfp">RFPs &amp; Bids</option>
            <option value="events">Events &amp; Programming</option>
            <option value="boat-tours">Boat Tours &amp; Recreation</option>
            <option value="facility-rental">Facility Rental Inquiry</option>
            <option value="media">Media &amp; Press</option>
            <option value="general">General Inquiry</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="cf-org">Organization / Company</label>
          <input type="text" id="cf-org" name="organization" autoComplete="organization" />
        </div>
        <div className="form-group">
          <label htmlFor="cf-message">Message *</label>
          <textarea id="cf-message" name="message" required placeholder="Please describe your inquiry, question, or how we can help you..."></textarea>
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <input type="checkbox" id="cf-newsletter" name="newsletter" style={{ width: 'auto', marginTop: '0.2rem', flexShrink: 0 }} />
          <label htmlFor="cf-newsletter" style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontFamily: 'var(--font-body)', fontWeight: 400, cursor: 'pointer' }}>Sign me up for the LPFA newsletter to receive event and development updates.</label>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>Send Message <i className="fas fa-paper-plane"></i></button>
      </form>
    </div>
  );
}
