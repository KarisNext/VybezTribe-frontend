// File: frontend/src/components/admin/Stats.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/includes/Session';

interface NewsItem {
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
  first_name: string;
  last_name: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  youtube_url: string;
  youtube_id: string;
  youtube_thumbnail: string;
}

interface StatsData {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  featuredPosts: number;
  averageReadingTime: number;
  categoriesCount: number;
  recentActivity: Array<{
    action: string;
    count: number;
    period: string;
  }>;
}

interface StatsProps {
  news: NewsItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

const Stats: React.FC<StatsProps> = ({ news, isLoading, onRefresh }) => {
  const { user, csrfToken } = useSession();
  const [detailedStats, setDetailedStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  const calculateBasicStats = () => {
    if (!news.length) return null;

    const totalPosts = news.length;
    const publishedPosts = news.filter(item => item.status === 'published').length;
    const draftPosts = news.filter(item => item.status === 'draft').length;
    const archivedPosts = news.filter(item => item.status === 'archived').length;
    const featuredPosts = news.filter(item => item.featured).length;
    
    const totalViews = news.reduce((sum, item) => sum + (item.views || 0), 0);
    const totalLikes = news.reduce((sum, item) => sum + (item.likes_count || 0), 0);
    const totalComments = news.reduce((sum, item) => sum + (item.comments_count || 0), 0);
    
    const uniqueCategories = [...new Set(news.map(item => item.category_id))].length;
    const avgReadingTime = Math.round(news.reduce((sum, item) => sum + (item.reading_time || 0), 0) / totalPosts);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      featuredPosts,
      totalViews,
      totalLikes,
      totalComments,
      uniqueCategories,
      avgReadingTime
    };
  };

  const fetchDetailedStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDetailedStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const basicStats = calculateBasicStats();

  useEffect(() => {
    if (showDetailed && !detailedStats) {
      fetchDetailedStats();
    }
  }, [showDetailed]);

  if (isLoading) {
    return (
      <div className="stats-widget loading">
        <div className="stats-header">
          <h3>📊 Statistics</h3>
        </div>
        <div className="stats-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!basicStats) {
    return (
      <div className="stats-widget empty">
        <div className="stats-header">
          <h3>📊 Statistics</h3>
        </div>
        <div className="stats-empty">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-widget">
      <div className="stats-header">
        <h3>📊 Quick Stats</h3>
        <div className="stats-actions">
          <button 
            className="toggle-detailed-btn"
            onClick={() => setShowDetailed(!showDetailed)}
          >
            {showDetailed ? 'Simple' : 'Detailed'}
          </button>
          <button 
            className="refresh-stats-btn"
            onClick={onRefresh}
            title="Refresh Data"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item total">
          <div className="stat-icon">📰</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(basicStats.totalPosts)}</div>
            <div className="stat-label">Total Posts</div>
          </div>
        </div>

        <div className="stat-item published">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(basicStats.publishedPosts)}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>

        <div className="stat-item draft">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(basicStats.draftPosts)}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>

        <div className="stat-item featured">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(basicStats.featuredPosts)}</div>
            <div className="stat-label">Featured</div>
          </div>
        </div>

        <div className="stat-item views">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(basicStats.totalViews)}</div>
            <div className="stat-label">Views</div>
          </div>
        </div>

        <div className="stat-item likes">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(basicStats.totalLikes)}</div>
            <div className="stat-label">Likes</div>
          </div>
        </div>
      </div>

      {showDetailed && (
        <div className="detailed-stats">
          {statsLoading ? (
            <div className="detailed-loading">
              <div className="loading-spinner"></div>
              <p>Loading detailed statistics...</p>
            </div>
          ) : (
            <div className="detailed-grid">
              <div className="detailed-item">
                <span className="detailed-label">Comments</span>
                <span className="detailed-value">{formatNumber(basicStats.totalComments)}</span>
              </div>
              <div className="detailed-item">
                <span className="detailed-label">Categories</span>
                <span className="detailed-value">{basicStats.uniqueCategories}</span>
              </div>
              <div className="detailed-item">
                <span className="detailed-label">Avg Reading Time</span>
                <span className="detailed-value">{basicStats.avgReadingTime} min</span>
              </div>
              <div className="detailed-item">
                <span className="detailed-label">Archived</span>
                <span className="detailed-value">{formatNumber(basicStats.archivedPosts)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Stats;
