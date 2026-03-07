'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    question: 'How do I rent Black River Landing for a private event?',
    answer: (
      <>To inquire about renting Black River Landing or other LPFA facilities for a private event, please use the contact form above and select &quot;Facility Rental Inquiry&quot; as your topic. Our team will follow up to discuss availability, rates, and requirements.</>
    ),
  },
  {
    question: 'How do I book a boat tour or private charter?',
    answer: (
      <>Visit our <Link href="/recreation" style={{ color: 'var(--blue-accent)' }}>Recreation page</Link> to learn about available tours and submit an inquiry. You can also call us at 440.204.2269 or email info@lorainport.com to check availability and pricing.</>
    ),
  },
  {
    question: 'How do I learn about development financing opportunities?',
    answer: (
      <>Visit our <Link href="/development" style={{ color: 'var(--blue-accent)' }}>Development &amp; Finance page</Link> for an overview of our programs, including brownfields grants, property financing, and active RFPs. Contact our office directly to discuss a specific project or opportunity.</>
    ),
  },
  {
    question: 'Is the Mile-Long Pier open to the public?',
    answer: (
      <>Yes, the Mile-Long Pier is generally open to the public for walking, fishing, and sightseeing, weather permitting. There is no admission fee. Please contact us for current accessibility and seasonal hours information.</>
    ),
  },
  {
    question: 'How do I stay informed about upcoming events?',
    answer: (
      <>Subscribe to our newsletter using the form on our <Link href="/#newsletter" style={{ color: 'var(--blue-accent)' }}>homepage</Link>, and follow us on <a href="https://www.facebook.com/lorainportfinance" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>Facebook</a> and <a href="https://www.instagram.com/lorainportfinance" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>Instagram</a> for the latest event announcements and waterfront news.</>
    ),
  },
  {
    question: 'Is the Black River Wharf Boat Launch free to use?',
    answer: (
      <>Please contact our office at 440.204.2269 or info@lorainport.com for current information on boat launch fees, hours, and seasonal operation.</>
    ),
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-list" data-animate="fade-up">
      {faqs.map((faq, index) => (
        <div key={index} className={`faq-item${openIndex === index ? ' open' : ''}`}>
          <div className="faq-question" onClick={() => toggle(index)}>
            {faq.question} <i className="fas fa-chevron-down"></i>
          </div>
          <div className="faq-answer">
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
}
