'use client';

import { useState } from 'react';

interface FaqItemData {
  question: string;
  answer: React.ReactNode;
}

interface FaqAccordionProps {
  items: FaqItemData[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <div key={index} className={`faq-item${openIndex === index ? ' open' : ''}`}>
          <div
            className="faq-question"
            onClick={() => handleToggle(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(index);
              }
            }}
          >
            {item.question} <i className="fas fa-chevron-down"></i>
          </div>
          <div className="faq-answer">
            {item.answer}
          </div>
        </div>
      ))}
    </div>
  );
}
