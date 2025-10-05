// components/client/components/HeroSlider.tsx - WITH SMART IMAGE FITTING
'use client';

import React, { useState, useEffect } from 'react';
import { NewsItem } from '../hooks/useFetchNews';
import { useSlider } from '../hooks/useSlider';

interface HeroSliderProps {
  slides: NewsItem[];
  onSlideClick: (slide: NewsItem) => void;
  formatDate: (date: string) => string;
  formatNumber: (num: number) => string;
  getImageUrl: (url: string) => string | null;
}

export default function HeroSlider({
  slides,
  onSlideClick,
  formatDate,
  formatNumber,
  getImageUrl
}: HeroSliderProps) {
  const {
    currentIndex,
    currentSlide,
    isTransitioning,
    nextSlide,
    prevSlide,
    goToSlide,
    pauseAutoPlay,
    resumeAutoPlay,
    progress
  } = useSlider({
    items: slides,
    autoPlayInterval: 5000,
    transitionDuration: 600
  });

  const [imageStates, setImageStates] = useState<{[key: number]: 'loading' | 'loaded' | 'error'}>({});

  useEffect(() => {
    // Preload all slide images
    slides.forEach(slide => {
      const imageUrl = getImageUrl(slide.image_url);
      if (imageUrl && !imageStates[slide.news_id]) {
        const img = new Image();
        img.onload = () => {
          setImageStates(prev => ({ ...prev, [slide.news_id]: 'loaded' }));
        };
        img.onerror = () => {
          setImageStates(prev => ({ ...prev, [slide.news_id]: 'error' }));
        };
        img.src = imageUrl;
        setImageStates(prev => ({ ...prev, [slide.news_id]: 'loading' }));
      }
    });
  }, [slides, getImageUrl]);

  if (!currentSlide || slides.length === 0) {
    return (
      <div className="hero-slider-empty">
        <p>No featured stories available</p>
      </div>
    );
  }

  return (
    <div 
      className="hero-slider-compact"
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
    >
      {/* Main Slider Wrapper */}
      <div className="slider-wrapper-compact">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const isPrev = index === (currentIndex - 1 + slides.length) % slides.length;
          const isNext = index === (currentIndex + 1) % slides.length;
          
          let slideClass = 'slide-compact';
          if (isActive) slideClass += ' active';
          if (isPrev) slideClass += ' prev';
          if (isNext) slideClass += ' next';

          const imageUrl = getImageUrl(slide.image_url);
          const imageState = imageStates[slide.news_id];

          return (
            <div
              key={slide.news_id}
              className={slideClass}
              onClick={() => isActive && onSlideClick(slide)}
            >
              {/* Image - Smart Fitting */}
              <div className="slide-image-wrapper">
                {imageUrl && imageState !== 'error' ? (
                  <>
                    {/* Background blur effect for empty space */}
                    <div 
                      className="slide-bg-blur"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                    {/* Main image with contain (shows full image) */}
                    <img
                      src={imageUrl}
                      alt={slide.title}
                      className="slide-image-fit"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </>
                ) : (
                  <div className="slide-placeholder">
                    <span className="placeholder-emoji">📰</span>
                  </div>
                )}
                {/* Dark gradient overlay for text readability */}
                <div className="slide-gradient" />
              </div>

              {/* Compact Content Overlay */}
              <div className="slide-content-compact">
                {/* Category Badge */}
                <div className="slide-category-row">
                  <span className="category-badge-compact">{slide.category_name}</span>
                  {slide.featured && <span className="featured-star">⭐</span>}
                </div>

                {/* Title - Compact and readable */}
                <h2 className="slide-title-compact">{slide.title}</h2>

                {/* Meta Info */}
                <div className="slide-meta-compact">
                  <span>{slide.first_name} {slide.last_name}</span>
                  <span className="meta-separator">•</span>
                  <span>{formatDate(slide.published_at)}</span>
                  <span className="meta-separator">•</span>
                  <span>{formatNumber(slide.views)} views</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            className="nav-btn-compact nav-prev-compact"
            onClick={prevSlide}
            aria-label="Previous slide"
            disabled={isTransitioning}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            className="nav-btn-compact nav-next-compact"
            onClick={nextSlide}
            aria-label="Next slide"
            disabled={isTransitioning}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Progress Dots with Animation */}
      {slides.length > 1 && (
        <div className="slider-dots-compact">
          {slides.map((slide, index) => (
            <button
              key={slide.news_id}
              className={`dot-compact ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              disabled={isTransitioning}
            >
              {/* Animated progress bar for active dot */}
              {index === currentIndex && (
                <span 
                  className="dot-progress-bar" 
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}