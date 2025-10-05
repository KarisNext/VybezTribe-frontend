'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/includes/Session';

interface NewsItem {
  news_id: number;
  title: string;
  excerpt: string;
  slug: string;
  category_name: string;
  image_url: string;
  status: string;
  views: number;
  likes_count: number;
  comments_count: number;
  published_at: string;
  author_name?: string;
  tags?: string;
  is_featured?: boolean;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_news: number;
  has_next: boolean;
  has_prev: boolean;
}

interface StatsData {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  archived_posts: number;
  featured_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}

const formatNumber = (num: number) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const RetrievePosts: React.FC = () => {
  const { csrfToken } = useSession();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishedWeekFilter, setPublishedWeekFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [categories, setCategories] = useState<{category_id: number, name: string}[]>([]);
  
  // Selection and bulk actions
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<NewsItem | null>(null);
  
  // Stats toggle
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const fetchNews = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        order: sortOrder
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (publishedWeekFilter) {
        // Calculate date range based on selected week
        const now = new Date();
        const weeksAgo = parseInt(publishedWeekFilter);
        const startDate = new Date(now.getTime() - (weeksAgo * 7 * 24 * 60 * 60 * 1000));
        const endDate = weeksAgo === 1 ? now : new Date(now.getTime() - ((weeksAgo - 1) * 7 * 24 * 60 * 60 * 1000));
        params.append('date_start', startDate.toISOString().split('T')[0]);
        params.append('date_end', endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/admin?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
        setStats(data.stats || null);
        setPagination(data.pagination || null);
      } else {
        console.error('Failed to fetch news:', response.status);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken, searchTerm, statusFilter, categoryFilter, publishedWeekFilter, sortOrder]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [csrfToken]);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [fetchNews, fetchCategories]);

  useEffect(() => {
    setShowBulkActions(selectedPosts.length > 0);
  }, [selectedPosts]);

  // Selection handlers
  const handleSelectPost = (postId: number) => {
    setSelectedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === news.length && news.length > 0) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(news.map(item => item.news_id));
    }
  };

  const clearSelection = () => {
    setSelectedPosts([]);
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedPosts.length === 0) return;
    
    try {
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({
          action: bulkAction,
          post_ids: selectedPosts
        })
      });

      if (response.ok) {
        fetchNews(pagination?.current_page || 1);
        setSelectedPosts([]);
        setShowBulkModal(false);
        setBulkAction('');
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // Individual actions
  const handleEdit = (post: NewsItem) => {
    setPostToEdit(post);
    setShowEditModal(true);
  };

  const handleDelete = (postId: number) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/${postToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken || ''
        }
      });

      if (response.ok) {
        fetchNews(pagination?.current_page || 1);
        setShowDeleteModal(false);
        setPostToDelete(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(1);
  };

  const refreshStats = () => {
    fetchNews(pagination?.current_page || 1);
  };

  if (isLoading) {
    return (
      <div className="retrieve-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="retrieve-posts">
      {/* Header */}
      <div className="retrieve-header">
        <div className="header-left">
          <h1>Manage Posts</h1>
          {stats && (
            <div className="quick-stats">
              <div className="stat-item">Total: {formatNumber(stats.total_posts)}</div>
              <div className="stat-item">Published: {formatNumber(stats.published_posts)}</div>
              <div className="stat-item">Drafts: {formatNumber(stats.draft_posts)}</div>
              <div className="stat-item">Views: {formatNumber(stats.total_views)}</div>
              <div className="stat-item">Likes: {formatNumber(stats.total_likes)}</div>
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <div className="filters">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search by title..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              className="filter-select"
              value={publishedWeekFilter}
              onChange={(e) => setPublishedWeekFilter(e.target.value)}
            >
              <option value="">All Time</option>
              <option value="1">This Week</option>
              <option value="2">Last 2 Weeks</option>
              <option value="4">Last Month</option>
              <option value="12">Last 3 Months</option>
            </select>
            
            <select
              className="filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="DESC">Latest First</option>
              <option value="ASC">Oldest First</option>
              <option value="views_desc">Most Views</option>
              <option value="likes_desc">Most Likes</option>
            </select>
          </div>
          
          <a href="/admin/posts/new" className="new-post-btn">
            New Post
          </a>
        </div>
      </div>

      {/* Stats Widget */}
      {stats && (
        <div className="stats-widget">
          <div className="stats-header">
            <h3>Dashboard Overview</h3>
            <div className="stats-actions">
              <button
                className="toggle-detailed-btn"
                onClick={() => setShowDetailedStats(!showDetailedStats)}
              >
                {showDetailedStats ? 'Hide Details' : 'Show Details'}
              </button>
              <button className="refresh-stats-btn" onClick={refreshStats}>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item total">
              <div className="stat-icon"></div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(stats.total_posts)}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            <div className="stat-item published">
              <div className="stat-icon"></div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(stats.published_posts)}</div>
                <div className="stat-label">Published</div>
              </div>
            </div>
            <div className="stat-item draft">
              <div className="stat-icon"></div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(stats.draft_posts)}</div>
                <div className="stat-label">Drafts</div>
              </div>
            </div>
            <div className="stat-item featured">
              <div className="stat-icon"></div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(stats.featured_posts)}</div>
                <div className="stat-label">Featured</div>
              </div>
            </div>
            <div className="stat-item views">
              <div className="stat-icon"></div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(stats.total_views)}</div>
                <div className="stat-label">Views</div>
              </div>
            </div>
            <div className="stat-item likes">
              <div className="stat-icon"></div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(stats.total_likes)}</div>
                <div className="stat-label">Likes</div>
              </div>
            </div>
          </div>
          
          {showDetailedStats && (
            <div className="detailed-stats">
              <div className="detailed-grid">
                <div className="detailed-item">
                  <div className="detailed-label">Archived</div>
                  <div className="detailed-value">{formatNumber(stats.archived_posts)}</div>
                </div>
                <div className="detailed-item">
                  <div className="detailed-label">Comments</div>
                  <div className="detailed-value">{formatNumber(stats.total_comments)}</div>
                </div>
                <div className="detailed-item">
                  <div className="detailed-label">Avg Views</div>
                  <div className="detailed-value">
                    {stats.total_posts > 0 ? formatNumber(Math.round(stats.total_views / stats.total_posts)) : '0'}
                  </div>
                </div>
                <div className="detailed-item">
                  <div className="detailed-label">Engagement</div>
                  <div className="detailed-value">
                    {stats.total_views > 0 ? `${((stats.total_likes / stats.total_views) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
          </div>
          <div className="bulk-buttons">
            <button className="bulk-btn publish" onClick={() => handleBulkAction('publish')}>
              Publish
            </button>
            <button className="bulk-btn draft" onClick={() => handleBulkAction('draft')}>
              Draft
            </button>
            <button className="bulk-btn archive" onClick={() => handleBulkAction('archive')}>
              Archive
            </button>
            <button className="bulk-btn feature" onClick={() => handleBulkAction('feature')}>
              Feature
            </button>
            <button className="bulk-btn delete" onClick={() => handleBulkAction('delete')}>
              Delete
            </button>
            <button className="clear-selection" onClick={clearSelection}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="posts-table">
        <div className="table-header">
          <div className="column-select">
            <input
              type="checkbox"
              className="select-all-checkbox"
              checked={selectedPosts.length === news.length && news.length > 0}
              onChange={handleSelectAll}
            />
          </div>
          <div className="column-content">Post Details</div>
          <div className="column-stats">Engagement Stats</div>
          <div className="column-actions">Actions</div>
        </div>

        {news.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <h3>No posts found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          news.map(item => (
            <div
              key={item.news_id}
              className={`post-row ${selectedPosts.includes(item.news_id) ? 'selected' : ''}`}
            >
              <div className="column-select">
                <input
                  type="checkbox"
                  className="post-checkbox"
                  checked={selectedPosts.includes(item.news_id)}
                  onChange={() => handleSelectPost(item.news_id)}
                />
              </div>
              
              <div className="column-content">
                <div className="post-image">
                  {item.image_url ? (
                    <img src={`http://localhost:5000${item.image_url}`} alt={item.title} />
                  ) : (
                    <div className="image-placeholder">📰</div>
                  )}
                  {item.is_featured && (
                    <div className="featured-indicator">⭐</div>
                  )}
                </div>
                
                <div className="post-details">
                  <h3 className="post-title">{item.title}</h3>
                  {item.excerpt && <p className="post-excerpt">{item.excerpt}</p>}
                  
                  <div className="post-meta">
                    <div className="badges">
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                      {item.category_name && (
                        <span className="category-tag">{item.category_name}</span>
                      )}
                    </div>
                    
                    <div className="author-info">
                      {item.author_name && <span className="author">By {item.author_name}</span>}
                      <span className="date">
                        {new Date(item.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="column-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(item.views)}</span>
                    <span className="stat-label">Views</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(item.likes_count)}</span>
                    <span className="stat-label">Likes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(item.comments_count)}</span>
                    <span className="stat-label">Comments</span>
                  </div>
                </div>
                {item.views > 0 && (
                  <div className="engagement-rate">
                    Engagement: {((item.likes_count + item.comments_count) / item.views * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              
              <div className="column-actions">
                <div className="action-buttons">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(item)}
                    title="Edit Post"
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn preview-btn"
                    onClick={() => window.open(`/news/${item.slug}`, '_blank')}
                    title="View Article"
                  >
                    View
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(item.news_id)}
                    title="Delete Post"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => fetchNews(pagination.current_page - 1)}
            disabled={!pagination.has_prev}
          >
            Previous
          </button>
          <div className="page-info">
            Page {pagination.current_page} of {pagination.total_pages}
          </div>
          <button
            className="page-btn"
            onClick={() => fetchNews(pagination.current_page + 1)}
            disabled={!pagination.has_next}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="warning-message">
                This will permanently remove the post and all associated data.
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Bulk Action</h3>
              <button className="close-btn" onClick={() => setShowBulkModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to {bulkAction} {selectedPosts.length} selected post
                {selectedPosts.length !== 1 ? 's' : ''}?
              </p>
              {bulkAction === 'delete' && (
                <div className="warning-message">
                  This action will permanently delete the selected posts and cannot be undone.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowBulkModal(false)}>
                Cancel
              </button>
              <button
                className={`confirm-btn ${bulkAction === 'delete' ? 'danger' : ''}`}
                onClick={confirmBulkAction}
              >
                Confirm {bulkAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Placeholder */}
      {showEditModal && postToEdit && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header">
              <h3>Edit Post</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Edit functionality for "{postToEdit.title}" would be implemented here.</p>
              <p>This would connect to EditPosts.tsx component or redirect to edit page.</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>
                Close
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  // Redirect to edit page or load EditPosts component
                  window.location.href = `/admin/posts/edit/${postToEdit.news_id}`;
                }}
              >
                Open Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetrievePosts;