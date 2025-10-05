// useHome.tsx
'use client';

import { useState, useCallback } from 'react';
import { useClientSession } from './ClientSessions';
import { NewsItem, Category } from './useFetchNews';

interface UseHomeReturn {
  breakingNews: NewsItem[];
  featuredNews: NewsItem[];
  categories: Category[];
  categoryPreviews: { [key: string]: NewsItem[] };
  isLoading: boolean;
  error: string | null;
  fetchHomeContent: () => Promise<void>;
  formatDate: (dateString: string) => string;
  formatNumber: (num: number) => string;
  getImageUrl: (imageUrl: string) => string | null;
  getCategoryColor: (slug: string) => string;
  getCategoryIcon: (slug: string) => string;
}

const categoryColors: Record<string, string> = {
  politics: '#dc2626',
  counties: '#16a34a',
  opinion: '#7c3aed',
  business: '#ea580c',
  sports: '#0284c7',
  technology: '#4338ca',
  default: '#6b7280'
};

const categoryIcons: Record<string, string> = {
  politics: '🏛️',
  counties: '🏢',
  opinion: '💭',
  business: '💼',
  sports: '⚽',
  technology: '💻',
  default: '📰'
};

export const useHome = (): UseHomeReturn => {
  const { sessionToken } = useClientSession();
  
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPreviews, setCategoryPreviews] = useState<{ [key: string]: NewsItem[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recent';
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch {
      return 'Recent';
    }
  }, []);

  const formatNumber = useCallback((num: number): string => {
    if (!num || num < 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  const getImageUrl = useCallback((imageUrl: string): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://api.vybeztribe.com' : 'http://localhost:5000';
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${cleanPath}`;
  }, []);

  const getCategoryColor = useCallback((slug: string): string => {
    return categoryColors[slug.toLowerCase()] || categoryColors['default'];
  }, []);

  const getCategoryIcon = useCallback((slug: string): string => {
    return categoryIcons[slug.toLowerCase()] || categoryIcons['default'];
  }, []);

  const normalizeNewsItem = useCallback((item: any): NewsItem => {
    const firstName = item.author?.first_name || item.first_name || item.author_first_name || 'Anonymous';
    const lastName = item.author?.last_name || item.last_name || item.author_last_name || '';

    return {
      news_id: item.news_id || 0,
      title: item.title || 'Untitled',
      content: item.content || '',
      excerpt: item.excerpt || '',
      slug: item.slug || '',
      category_id: item.category_id || 0,
      category_name: item.category_name || 'Uncategorized',
      category_slug: item.category_slug || 'uncategorized',
      featured: Boolean(item.featured),
      image_url: item.image_url || '',
      status: item.status || 'published',
      priority: item.priority || 'medium',
      tags: item.tags || '',
      reading_time: parseInt(item.reading_time) || 5,
      views: parseInt(item.views) || 0,
      likes_count: parseInt(item.likes_count) || 0,
      comments_count: parseInt(item.comments_count) || 0,
      share_count: parseInt(item.share_count) || 0,
      first_name: firstName,
      last_name: lastName,
      author_email: item.author?.email || item.author_email || '',
      published_at: item.published_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
  }, []);

  const fetchHomeContent = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/client/home?type=all', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setBreakingNews((data.breaking_news || []).map(normalizeNewsItem));
        setFeaturedNews((data.featured_news || []).map(normalizeNewsItem));
        setCategories(data.categories || []);
        
        const normalizedPreviews: { [key: string]: NewsItem[] } = {};
        Object.entries(data.category_previews || {}).forEach(([categorySlug, newsItems]) => {
          normalizedPreviews[categorySlug] = (newsItems as any[]).map(normalizeNewsItem);
        });
        setCategoryPreviews(normalizedPreviews);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch home content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch home content');
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, normalizeNewsItem]);

  return {
    breakingNews,
    featuredNews,
    categories,
    categoryPreviews,
    isLoading,
    error,
    fetchHomeContent,
    formatDate,
    formatNumber,
    getImageUrl,
    getCategoryColor,
    getCategoryIcon
  };
};