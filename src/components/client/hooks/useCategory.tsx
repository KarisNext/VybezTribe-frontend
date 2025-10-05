// useCategory.tsx - FIXED FOR EXCERPT ONLY
'use client';

import { useState, useCallback } from 'react';
import { useClientSession } from './ClientSessions';
import { NewsItem, Category } from './useFetchNews';

interface CategoryStats {
  total_articles: number;
  published_articles: number;
  featured_articles: number;
  articles_this_week: number;
  articles_this_month: number;
  total_views: number;
  total_likes: number;
  avg_reading_time: number;
}

interface UseCategoryReturn {
  category: Category | null;
  news: NewsItem[];
  stats: CategoryStats | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  fetchCategory: (slug: string, page?: number, limit?: number) => Promise<NewsItem[]>;
  loadMore: () => Promise<NewsItem[]>;
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

export const useCategory = (): UseCategoryReturn => {
  const { sessionToken } = useClientSession();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

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

  // FIXED: Backend returns excerpt only, not content
  const normalizeNewsItem = useCallback((item: any): NewsItem => {
    const firstName = item.first_name || 'Anonymous';
    const lastName = item.last_name || '';

    return {
      news_id: item.news_id || 0,
      title: item.title || 'Untitled',
      content: '', // Backend doesn't return content for listings - empty string
      excerpt: item.excerpt || '', // This is what we actually use
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
      author_email: item.author_email || '',
      published_at: item.published_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
  }, []);

  const fetchCategory = useCallback(async (slug: string, page: number = 1, limit: number = 20): Promise<NewsItem[]> => {
    if (!slug || slug.trim() === '') {
      setError('Invalid category slug');
      setNotFound(true);
      return [];
    }

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const url = `/api/client/category?slug=${encodeURIComponent(slug)}&type=news&page=${page}&limit=${limit}`;
      
      console.log(`Fetching category: ${slug}, page: ${page}, limit: ${limit}`);
      
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
          setError(`Category '${slug}' not found`);
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const categoryData: Category = data.category || {
          category_id: 0,
          name: slug.charAt(0).toUpperCase() + slug.slice(1),
          slug: slug,
          description: `Latest ${slug} news`,
          active: true
        };

        if (page === 1) {
          setCategory(categoryData);
          console.log('Category set:', categoryData);
        }
        
        const newsItems = (data.news || []).map(normalizeNewsItem);
        console.log(`Fetched ${newsItems.length} articles for ${slug}`);
        
        if (page === 1) {
          setNews(newsItems);
        } else {
          setNews(prev => [...prev, ...newsItems]);
        }
        
        if (data.pagination) {
          setCurrentPage(data.pagination.current_page || page);
          setTotalPages(data.pagination.total_pages || 1);
          setHasMore(data.pagination.has_next || false);
          console.log('Pagination:', data.pagination);
        } else {
          setCurrentPage(page);
          setHasMore(newsItems.length >= limit);
          setTotalPages(page + (newsItems.length >= limit ? 1 : 0));
        }
        
        setError(null);
        setNotFound(false);
        return newsItems;
      } else {
        setNotFound(true);
        setError(data.message || 'Category not found');
        return [];
      }
    } catch (err) {
      console.error('Category fetch error:', err);
      setNotFound(true);
      setError(`Failed to load category: ${err}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, normalizeNewsItem]);

  const loadMore = useCallback(async (): Promise<NewsItem[]> => {
    if (!category || !hasMore || isLoading) {
      console.log('Load more blocked:', { category: !!category, hasMore, isLoading });
      return [];
    }
    console.log(`Loading more articles for ${category.slug}, page ${currentPage + 1}`);
    return fetchCategory(category.slug, currentPage + 1);
  }, [category, hasMore, isLoading, currentPage, fetchCategory]);

  return {
    category,
    news,
    stats,
    isLoading,
    error,
    notFound,
    hasMore,
    currentPage,
    totalPages,
    fetchCategory,
    loadMore,
    formatDate,
    formatNumber,
    getImageUrl,
    getCategoryColor,
    getCategoryIcon
  };
};