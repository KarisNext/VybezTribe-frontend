// File: frontend/src/components/admin/Actions.tsx
'use client';

import React, { useState } from 'react';
import { useSession } from '@/components/includes/Session';
import { toast } from 'react-toastify';

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

interface ActionsProps {
  selectedPosts: number[];
  allPosts: NewsItem[];
  onBulkAction: (action: string, postIds: number[]) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const Actions: React.FC<ActionsProps> = ({ 
  selectedPosts, 
  allPosts, 
  onBulkAction, 
  onRefresh, 
  isLoading 
}) => {
  const { user, csrfToken } = useSession();
  const [actionLoading, setActionLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  const handleBulkAction = async (action: string) => {
    if (!selectedPosts.length || !user) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({
          action,
          post_ids: selectedPosts,
          admin_id: user.admin_id
        })
      });

      if (response.ok) {
        onBulkAction(action, selectedPosts);
        setShowBulkModal(false);
        setSelectedAction('');
        toast.success(`Successfully performed ${action} action.`);
      } else {
        toast.error(`Failed to perform ${action} action.`);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Error performing bulk action.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmBulkAction = (action: string) => {
    setSelectedAction(action);
    setShowBulkModal(true);
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      publish: 'Publish Posts',
      draft: 'Move to Draft',
      archive: 'Archive Posts',
      delete: 'Delete Posts',
      feature: 'Mark as Featured',
      unfeature: 'Remove Featured'
    };
    return labels[action] || action;
  };

  const isActionDisabled = selectedPosts.length === 0;

  return (
    <div className="actions-widget">
      <div className="actions-header">
        <h3>🎯 Quick Actions</h3>
        <div className="selected-count">
          {selectedPosts.length > 0 && (
            <span>{selectedPosts.length} selected</span>
          )}
        </div>
      </div>
      <div className="actions-grid">
        <div className="action-section">
          <h4>Bulk Actions</h4>
          <div className="bulk-actions">
            <button
              className="action-btn-secondary"
              onClick={() => confirmBulkAction('publish')}
              disabled={isActionDisabled}
            >
              Publish
            </button>
            <button
              className="action-btn-secondary"
              onClick={() => confirmBulkAction('draft')}
              disabled={isActionDisabled}
            >
              To Draft
            </button>
            <button
              className="action-btn-secondary"
              onClick={() => confirmBulkAction('archive')}
              disabled={isActionDisabled}
            >
              Archive
            </button>
            <button
              className="action-btn-secondary danger"
              onClick={() => confirmBulkAction('delete')}
              disabled={isActionDisabled}
            >
              Delete
            </button>
            <button
              className="action-btn-secondary"
              onClick={() => confirmBulkAction('feature')}
              disabled={isActionDisabled}
            >
              Feature
            </button>
            <button
              className="action-btn-secondary"
              onClick={() => confirmBulkAction('unfeature')}
              disabled={isActionDisabled}
            >
              Unfeature
            </button>
          </div>
        </div>
      </div>

      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content bulk-modal">
            <h3>Confirm Bulk Action</h3>
            <p>
              Are you sure you want to perform the action:{' '}
              <strong>{getActionLabel(selectedAction)}</strong> on {selectedPosts.length}{' '}
              post(s)?
            </p>
            <div className="selected-posts-preview">
              <p>Selected Posts:</p>
              <div className="post-list">
                {selectedPosts.slice(0, 5).map(postId => {
                  const post = allPosts.find(p => p.news_id === postId);
                  return post ? (
                    <div key={postId} className="post-preview">
                      <span className="post-title">{post.title}</span>
                      <span className="post-status">{post.status}</span>
                    </div>
                  ) : null;
                })}
                {selectedPosts.length > 5 && (
                  <div className="more-posts">
                    ...and {selectedPosts.length - 5} more
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowBulkModal(false);
                  setSelectedAction('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`confirm-btn ${selectedAction === 'delete' ? 'danger' : ''}`}
                onClick={() => handleBulkAction(selectedAction)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Confirm ${getActionLabel(selectedAction)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actions;
