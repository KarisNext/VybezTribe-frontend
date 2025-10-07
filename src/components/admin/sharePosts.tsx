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
  published_at: string;
  author_name?: string;
  tags?: string;
  views: number;
  likes_count: number;
  comments_count: number;
  share_count?: {
    facebook: number;
    twitter: number;
    linkedin: number;
    whatsapp: number;
    total: number;
  };
}

interface ShareTemplate {
  platform: string;
  template: string;
  hashtags: string[];
}

const SharePosts: React.FC = () => {
  const { csrfToken } = useSession();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('published_at');
  
  // Share tracking
  const [shareStats, setShareStats] = useState<{[key: number]: any}>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NewsItem | null>(null);
  const [shareTemplates, setShareTemplates] = useState<ShareTemplate[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  
  // Bulk sharing
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [showBulkShare, setShowBulkShare] = useState(false);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'published',
        limit: '50',
        order: 'DESC'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (sortBy) params.append('sort', sortBy);

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
        // Fetch share stats for each post
        fetchShareStats(data.news || []);
      } else {
        console.error('Failed to fetch news:', response.status);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken, searchTerm, categoryFilter, sortBy]);

  const fetchShareStats = async (posts: NewsItem[]) => {
    try {
      const postIds = posts.map(p => p.news_id);
      const response = await fetch('/api/admin/share-stats', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ post_ids: postIds })
      });
      
      if (response.ok) {
        const stats = await response.json();
        setShareStats(stats);
      }
    } catch (error) {
      console.error('Error fetching share stats:', error);
    }
  };

  const logShare = async (postId: number, platform: string) => {
    try {
      await fetch('/api/admin/log-share', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({
          post_id: postId,
          platform: platform,
          shared_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging share:', error);
    }
  };

  const generateShareUrl = (slug: string, platform: string) => {
    const baseUrl = `${window.location.origin}/news/${slug}`;
    const utmParams = new URLSearchParams({
      utm_source: platform,
      utm_medium: 'social',
      utm_campaign: 'admin_share'
    });
    return `${baseUrl}?${utmParams.toString()}`;
  };

  const generateHashtags = (post: NewsItem): string[] => {
    const tags = [];
    if (post.category_name) {
      tags.push(`#${post.category_name.replace(/\s+/g, '')}`);
    }
    if (post.tags) {
      const postTags = post.tags.split(',').map(tag => `#${tag.trim().replace(/\s+/g, '')}`);
      tags.push(...postTags.slice(0, 3)); // Limit to 3 additional tags
    }
    return tags;
  };

  const generateShareText = (post: NewsItem, platform: string): string => {
    const hashtags = generateHashtags(post).join(' ');
    const url = generateShareUrl(post.slug, platform);
    
    switch (platform) {
      case 'twitter':
        // Twitter has character limit, so keep it concise
        const twitterText = post.title.length > 200 
          ? `${post.title.substring(0, 200)}...` 
          : post.title;
        return `🔥 ${twitterText} ${hashtags} ${url}`;
        
      case 'facebook':
        return `${post.title}\n\n${post.excerpt}\n\nRead more: ${url}\n\n${hashtags}`;
        
      case 'linkedin':
        return `${post.title}\n\n${post.excerpt}\n\nRead the full article: ${url}\n\n${hashtags}`;
        
      case 'whatsapp':
        return `📰 ${post.title}\n\n${post.excerpt}\n\nRead more: ${url}`;
        
      default:
        return `${post.title} - ${url}`;
    }
  };

  const handleCopyLink = (post: NewsItem) => {
    const url = generateShareUrl(post.slug, 'copy');
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(post.slug);
      setTimeout(() => setCopiedLink(null), 2000);
      logShare(post.news_id, 'copy');
    });
  };

  const shareOnFacebook = (post: NewsItem) => {
    const url = generateShareUrl(post.slug, 'facebook');
    const shareText = generateShareText(post, 'facebook');
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
    logShare(post.news_id, 'facebook');
  };

  const shareOnTwitter = (post: NewsItem) => {
    const shareText = generateShareText(post, 'twitter');
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
    logShare(post.news_id, 'twitter');
  };

  const shareOnLinkedIn = (post: NewsItem) => {
    const url = generateShareUrl(post.slug, 'linkedin');
    const shareText = generateShareText(post, 'linkedin');
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.excerpt)}`,
      '_blank',
      'width=600,height=400'
    );
    logShare(post.news_id, 'linkedin');
  };

  const shareOnWhatsApp = (post: NewsItem) => {
    const shareText = generateShareText(post, 'whatsapp');
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    logShare(post.news_id, 'whatsapp');
  };

  const openShareModal = (post: NewsItem) => {
    setSelectedPost(post);
    setCustomMessage(generateShareText(post, 'custom'));
    setShowShareModal(true);
  };

  const handleBulkShare = (platform: string) => {
    if (selectedPosts.length === 0) return;
    
    selectedPosts.forEach(postId => {
      const post = news.find(p => p.news_id === postId);
      if (post) {
        switch (platform) {
          case 'facebook':
            shareOnFacebook(post);
            break;
          case 'twitter':
            shareOnTwitter(post);
            break;
          case 'linkedin':
            shareOnLinkedIn(post);
            break;
          case 'whatsapp':
            shareOnWhatsApp(post);
            break;
        }
      }
    });
    
    setSelectedPosts([]);
    setShowBulkShare(false);
  };

  const handleSelectPost = (postId: number) => {
    setSelectedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === news.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(news.map(post => post.news_id));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews();
  };

  const exportShareReport = async () => {
    try {
      const response = await fetch('/api/admin/share-report', {
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken || ''
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `share-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting share report:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    setShowBulkShare(selectedPosts.length > 0);
  }, [selectedPosts]);

  if (isLoading) {
    return (
      <div className="retrieve-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts for sharing...</p>
      </div>
    );
  }

  return (
    <div className="retrieve-posts">
      {/* Header */}
      <div className="retrieve-header">
        <div className="header-left">
          <h1>Share Posts</h1>
          <div className="quick-stats">
            <div className="stat-item">Published: {news.length}</div>
            <div className="stat-item">
              Total Shares: {Object.values(shareStats).reduce((total: number, stats: any) => 
                total + (stats?.total || 0), 0)}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="filters">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search posts..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="news">News</option>
              <option value="sports">Sports</option>
              <option value="politics">Politics</option>
              <option value="business">Business</option>
            </select>
            
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="published_at">Latest First</option>
              <option value="views">Most Views</option>
              <option value="shares">Most Shared</option>
              <option value="engagement">Most Engaged</option>
            </select>
          </div>
          
          <button className="new-post-btn" onClick={exportShareReport}>
            Export Report
          </button>
        </div>
      </div>

      {/* Actions Widget */}
      <div className="actions-widget">
        <div className="actions-header">
          <h3>Share Actions</h3>
          {selectedPosts.length > 0 && (
            <div className="selected-count">
              {selectedPosts.length} selected
            </div>
          )}
        </div>
        
        <div className="actions-grid">
          <div className="action-section">
            <h4>Bulk Share</h4>
            <div className="bulk-actions">
              <button
                className="action-btn facebook-btn"
                onClick={() => handleBulkShare('facebook')}
                disabled={selectedPosts.length === 0}
              >
                Facebook ({selectedPosts.length})
              </button>
              <button
                className="action-btn twitter-btn"
                onClick={() => handleBulkShare('twitter')}
                disabled={selectedPosts.length === 0}
              >
                Twitter ({selectedPosts.length})
              </button>
              <button
                className="action-btn linkedin-btn"
                onClick={() => handleBulkShare('linkedin')}
                disabled={selectedPosts.length === 0}
              >
                LinkedIn ({selectedPosts.length})
              </button>
            </div>
          </div>
          
          <div className="action-section">
            <h4>Analytics</h4>
            <div className="export-actions">
              <button className="export-btn csv-btn" onClick={exportShareReport}>
                Export CSV
              </button>
              <button className="export-btn refresh-btn" onClick={fetchNews}>
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkShare && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected for sharing
          </div>
          <div className="bulk-buttons">
            <button className="bulk-btn publish" onClick={() => handleBulkShare('facebook')}>
              Share All on Facebook
            </button>
            <button className="bulk-btn draft" onClick={() => handleBulkShare('twitter')}>
              Share All on Twitter
            </button>
            <button className="clear-selection" onClick={() => setSelectedPosts([])}>
              Clear Selection
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
          <div className="column-stats">Share Stats</div>
          <div className="column-actions">Share Actions</div>
        </div>

        {news.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📢</div>
            <h3>No published posts found</h3>
            <p>Publish some posts to start sharing them on social media</p>
          </div>
        ) : (
          news.map(post => {
            const postStats = shareStats[post.news_id] || { facebook: 0, twitter: 0, linkedin: 0, whatsapp: 0, total: 0 };
            
            return (
              <div
                key={post.news_id}
                className={`post-row ${selectedPosts.includes(post.news_id) ? 'selected' : ''}`}
              >
                <div className="column-select">
                  <input
                    type="checkbox"
                    className="post-checkbox"
                    checked={selectedPosts.includes(post.news_id)}
                    onChange={() => handleSelectPost(post.news_id)}
                  />
                </div>
                
                <div className="column-content">
                  <div className="post-image">
                    {post.image_url ? (
                      <img src={`http://localhost:5000${post.image_url}`} alt={post.title} />
                    ) : (
                      <div className="image-placeholder">📰</div>
                    )}
                  </div>
                  
                  <div className="post-details">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-excerpt">{post.excerpt}</p>
                    
                    <div className="post-meta">
                      <div className="badges">
                        {post.category_name && (
                          <span className="category-tag">{post.category_name}</span>
                        )}
                      </div>
                      
                      <div className="author-info">
                        {post.author_name && <span className="author">By {post.author_name}</span>}
                        <span className="date">
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="column-stats">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{postStats.facebook}</div>
                      <div className="stat-label">Facebook</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{postStats.twitter}</div>
                      <div className="stat-label">Twitter</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{postStats.linkedin}</div>
                      <div className="stat-label">LinkedIn</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{postStats.whatsapp}</div>
                      <div className="stat-label">WhatsApp</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{postStats.total}</div>
                      <div className="stat-label">Total</div>
                    </div>
                  </div>
                </div>
                
                <div className="column-actions">
                  <div className="action-buttons">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => shareOnFacebook(post)}
                      title="Share on Facebook"
                    >
                      f
                    </button>
                    <button
                      className="action-btn preview-btn"
                      onClick={() => shareOnTwitter(post)}
                      title="Share on Twitter"
                    >
                      X
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => shareOnLinkedIn(post)}
                      title="Share on LinkedIn"
                      style={{ backgroundColor: '#0077b5' }}
                    >
                      in
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => shareOnWhatsApp(post)}
                      title="Share on WhatsApp"
                      style={{ backgroundColor: '#25d366' }}
                    >
                      💬
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleCopyLink(post)}
                      title="Copy Link"
                      style={{ backgroundColor: '#6c757d' }}
                    >
                      {copiedLink === post.slug ? '✓' : '🔗'}
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => openShareModal(post)}
                      title="Custom Share"
                      style={{ backgroundColor: '#28a745' }}
                    >
                      ⚙️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Share Modal */}
      {showShareModal && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header">
              <h3>Custom Share: {selectedPost.title}</h3>
              <button className="close-btn" onClick={() => setShowShareModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ffffff' }}>
                  Custom Message:
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#ffffff' }}>Generated Hashtags:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {generateHashtags(selectedPost).map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        color: '#00ff88',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        margin: '0.25rem 0.25rem 0 0',
                        fontSize: '0.8rem'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#ffffff' }}>Share URL:</strong>
                <div style={{
                  backgroundColor: '#333',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#ccc',
                  wordBreak: 'break-all'
                }}>
                  {generateShareUrl(selectedPost.slug, 'custom')}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowShareModal(false)}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  navigator.clipboard.writeText(`${customMessage}\n\n${generateShareUrl(selectedPost.slug, 'custom')}`);
                  setShowShareModal(false);
                  logShare(selectedPost.news_id, 'custom');
                }}
              >
                Copy Custom Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharePosts;
