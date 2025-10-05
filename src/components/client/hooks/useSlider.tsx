// components/client/hooks/useSlider.tsx - HERO SLIDER HOOK
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NewsItem } from './useFetchNews';

interface UseSliderProps {
  items: NewsItem[];
  autoPlayInterval?: number;
  transitionDuration?: number;
}

interface UseSliderReturn {
  currentIndex: number;
  currentSlide: NewsItem | null;
  isTransitioning: boolean;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  pauseAutoPlay: () => void;
  resumeAutoPlay: () => void;
  progress: number;
}

export const useSlider = ({
  items,
  autoPlayInterval = 5000,
  transitionDuration = 800
}: UseSliderProps): UseSliderReturn => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = items.length > 0 ? items[currentIndex] : null;

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    if (progressRef.current) clearTimeout(progressRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  // Progress bar animation
  const startProgress = useCallback(() => {
    setProgress(0);
    clearTimers();

    const increment = 100 / (autoPlayInterval / 50);
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, 50);
  }, [autoPlayInterval, clearTimers]);

  // Go to next slide
  const nextSlide = useCallback(() => {
    if (isTransitioning || items.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % items.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [items.length, isTransitioning, transitionDuration]);

  // Go to previous slide
  const prevSlide = useCallback(() => {
    if (isTransitioning || items.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [items.length, isTransitioning, transitionDuration]);

  // Go to specific slide
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || items.length === 0 || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [items.length, isTransitioning, currentIndex, transitionDuration]);

  // Pause autoplay
  const pauseAutoPlay = useCallback(() => {
    setIsPaused(true);
    clearTimers();
  }, [clearTimers]);

  // Resume autoplay
  const resumeAutoPlay = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (items.length <= 1 || isPaused) {
      clearTimers();
      return;
    }

    startProgress();

    autoPlayRef.current = setTimeout(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearTimers();
  }, [currentIndex, items.length, isPaused, autoPlayInterval, nextSlide, startProgress, clearTimers]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  return {
    currentIndex,
    currentSlide,
    isTransitioning,
    nextSlide,
    prevSlide,
    goToSlide,
    pauseAutoPlay,
    resumeAutoPlay,
    progress
  };
};