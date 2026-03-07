'use client';

import { useState } from 'react';
import type { GalleryImage } from '@/lib/types';

export default function ArticleGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  // Single image — no gallery controls needed
  if (images.length === 1) {
    return (
      <div className="article-gallery">
        <div className="article-gallery-main">
          <img src={images[0].url} alt={images[0].alt} />
        </div>
      </div>
    );
  }

  return (
    <div className="article-gallery">
      <div className="article-gallery-main">
        <img src={images[activeIndex].url} alt={images[activeIndex].alt} />
        <button
          className="article-gallery-arrow article-gallery-arrow--left"
          onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
          aria-label="Previous image"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          className="article-gallery-arrow article-gallery-arrow--right"
          onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
          aria-label="Next image"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
        <div className="article-gallery-counter">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      <div className="article-gallery-thumbs">
        {images.map((img, i) => (
          <button
            key={img.url}
            className={`article-gallery-thumb ${i === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            <img src={img.url} alt={img.alt} />
          </button>
        ))}
      </div>
    </div>
  );
}
