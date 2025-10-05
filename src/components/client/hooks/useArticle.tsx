// useArticle.tsx
'use client';

import { useState, useCallback } from 'react';
import { useClientSession } from './ClientSessions';
import { NewsItem } from './useFetchNews';

interface UseArticleReturn {
  article: NewsItem | null;
  relatedArticles: NewsItem[];
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  fetchArticle: (slug: string) => Promise<NewsItem | null>;
  trackView: (slug: string) => Promise<void>;
  trackLike: (slug: string, clientId?: string) => Promise<void>;
  formatDate: (dateString: string) => string;
  formatNumber: (num: number) => string;
  getImageUrl: (imageUrl: string) => string | null;
}

export const useArticle = (): UseArticleReturn => {
  const { sessionToken, clientId } = useClientSession();
  
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recent';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  const normalizeArticle = useCallback((data: any): NewsItem => {
    const firstName = data.author?.first_name || data.first_name || data.author_first_name || 'Anonymous';
    const lastName = data.author?.last_name || data.last_name || data.author_last_name || '';

    return {
      news_id: data.news_id || 0,
      title: data.title || 'Untitled',
      content: data.content || '',
      excerpt: data.excerpt || '',
      slug: data.slug || '',
      category_id: data.category_id || data.category?.category_id || 0,
      category_name: data.category_name || data.category?.name || 'Uncategorized',
      category_slug: data.category_slug || data.category?.slug || 'uncategorized',
      featured: Boolean(data.featured),
      image_url: data.image_url || '',
      status: data.status || 'published',
      priority: data.priority || 'medium',
      tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
      reading_time: parseInt(data.reading_time) || 5,
      views: parseInt(data.views) || 0,
      likes_count: parseInt(data.likes_count) || 0,
      comments_count: parseInt(data.comments_count) || 0,
      share_count: parseInt(data.share_count) || 0,
      first_name: firstName,
      last_name: lastName,
      author_email: data.author?.email || data.author_email || '',
      published_at: data.published_at || new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }, []);

  const fetchArticle = useCallback(async (slug: string): Promise<NewsItem | null> => {
    const trimmedSlug = slug?.trim();
    if (!trimmedSlug || trimmedSlug === '') {
      setError('Invalid article slug');
      setNotFound(true);
      return null;
    }

    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setArticle(null);
    setRelatedArticles([]);

    try {
      const url = `/api/client/article?slug=${encodeURIComponent(trimmedSlug)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true);
          setError('Article not found');
          return null;
        }
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.article) {
        const articleData = normalizeArticle(data.article);
        setArticle(articleData);
        const related = (data.related_articles || []).map(normalizeArticle);
        setRelatedArticles(related);
        setError(null);
        setNotFound(false);
        setTimeout(() => { trackView(trimmedSlug); }, 1000);
        return articleData;
      } else {
        setNotFound(true);
        setError(data.message || 'Article not found');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch article';
      if (errorMessage.includes('404') || errorMessage.toLowerCase().includes('not found')) {
        setNotFound(true);
        setError('Article not found');
      } else {
        setError(errorMessage);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, normalizeArticle]);

  const trackView = useCallback(async (slug: string): Promise<void> => {
    const trimmedSlug = slug?.trim();
    if (!trimmedSlug) return;
    try {
      const response = await fetch('/api/client/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }) },
        body: JSON.stringify({ action: 'view', slug: trimmedSlug, user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown', ip_address: 'frontend' }),
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (article && article.slug === trimmedSlug && result.views) {
          setArticle(prev => prev ? { ...prev, views: result.views } : null);
        }
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [sessionToken, article]);

  const trackLike = useCallback(async (slug: string, providedClientId?: string): Promise<void> => {
    const trimmedSlug = slug?.trim();
    if (!trimmedSlug) return;
    const effectiveClientId = providedClientId || clientId;
    if (!effectiveClientId) return;
    try {
      const response = await fetch('/api/client/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }) },
        body: JSON.stringify({ action: 'like', slug: trimmedSlug, client_id: effectiveClientId }),
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (article && article.slug === trimmedSlug) {
          setArticle(prev => prev ? { ...prev, likes_count: result.likes_count || (prev.likes_count || 0) } : null);
        }
      }
    } catch (error) {
      console.error('Error tracking like:', error);
    }
  }, [sessionToken, clientId, article]);

  return {
    article,
    relatedArticles,
    isLoading,
    error,
    notFound,
    fetchArticle,
    trackView,
    trackLike,
    formatDate,
    formatNumber,
    getImageUrl
  };
};