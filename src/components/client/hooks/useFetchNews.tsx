'use client';

import { useState, useCallback } from 'react';

const API_URL = 'https://api.vybeztribe.com';

export interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  featured: boolean;
  image_url: string;
  status: string;
  priority: string;
  tags: string;
  reading_time: number;
  views: number;
  likes_count: number;
  comments_count: number;
  share_count: number;
  first_name: string;
  last_name: string;
  author_email: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

export const useFetchNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const normalizeNewsItem = useCallback((item: any): NewsItem => {
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
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      author_email: item.author_email || '',
      published_at: item.published_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
  }, []);

  const fetchNews = useCallback(async (params?: any): Promise<NewsItem[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = new URL(`${API_URL}/api/client/fetch`);
      url.searchParams.set('type', 'news');
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, String(value));
        });
      }

      const data = await apiCall(url.toString());
      const newsItems = (data.news || []).map(normalizeNewsItem);
      setNews(newsItems);
      return newsItems;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [normalizeNewsItem]);

  const fetchBreaking = useCallback(async (limit: number = 10): Promise<NewsItem[]> => {
    try {
      setError(null);
      const url = `${API_URL}/api/client/home?type=breaking&limit=${limit}`;
      const data = await apiCall(url);
      return (data.breaking_news || []).map(normalizeNewsItem);
    } catch (err) {
      setError('Failed to fetch breaking news');
      return [];
    }
  }, [normalizeNewsItem]);

  const fetchFeatured = useCallback(async (limit: number = 10): Promise<NewsItem[]> => {
    try {
      setError(null);
      const url = `${API_URL}/api/client/home?type=featured&limit=${limit}`;
      const data = await apiCall(url);
      return (data.featured_news || []).map(normalizeNewsItem);
    } catch (err) {
      setError('Failed to fetch featured news');
      return [];
    }
  }, [normalizeNewsItem]);

  const fetchTrending = useCallback(async (limit: number = 10): Promise<NewsItem[]> => {
    try {
      setError(null);
      const url = `${API_URL}/api/client/home?type=trending&limit=${limit}`;
      const data = await apiCall(url);
      return (data.trending_news || []).map(normalizeNewsItem);
    } catch (err) {
      setError('Failed to fetch trending news');
      return [];
    }
  }, [normalizeNewsItem]);

  const fetchByCategory = useCallback(async (
    categorySlug: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<NewsItem[]> => {
    try {
      setError(null);
      const url = `${API_URL}/api/client/category?slug=${categorySlug}&type=news&page=${page}&limit=${limit}`;
      const data = await apiCall(url);
      return (data.news || []).map(normalizeNewsItem);
    } catch (err) {
      setError(`Failed to fetch ${categorySlug} news`);
      return [];
    }
  }, [normalizeNewsItem]);

  const searchNews = useCallback(async (
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<NewsItem[]> => {
    if (!query.trim()) return [];
    
    try {
      setError(null);
      const url = `${API_URL}/api/client/fetch?type=search&q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      const data = await apiCall(url);
      const newsItems = (data.news || []).map(normalizeNewsItem);
      setNews(newsItems);
      return newsItems;
    } catch (err) {
      setError('Search failed');
      return [];
    }
  }, [normalizeNewsItem]);

  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    try {
      setError(null);
      const url = `${API_URL}/api/client/home?type=categories`;
      const data = await apiCall(url);
      const categoryList = data.categories || [];
      setCategories(categoryList);
      return categoryList;
    } catch (err) {
      setError('Failed to fetch categories');
      return [];
    }
  }, []);

  const trackView = useCallback(async (newsId: number): Promise<void> => {
    try {
      await fetch(`${API_URL}/api/client/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view', id: newsId }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('View tracking error:', error);
    }
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    await Promise.all([fetchNews(), fetchCategories()]);
  }, [fetchNews, fetchCategories]);

  const clearData = useCallback(() => {
    setNews([]);
    setCategories([]);
    setError(null);
  }, []);

  return {
    news,
    categories,
    pagination: null,
    isLoading,
    isRefreshing: false,
    error,
    
    fetchNews,
    fetchBreaking,
    fetchFeatured,
    fetchTrending,
    fetchByCategory,
    searchNews,
    fetchCategories,
    
    trackView,
    formatDate,
    formatNumber,
    getImageUrl,
    refreshData,
    clearData
  };
};