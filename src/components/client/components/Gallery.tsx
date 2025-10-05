// components/client/components/Gallery.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NewsItem {
  news_id: string;
  title: string;
  image_url: string;
  category_name: string;
  first_name: string;
  last_name: string;
  published_at: string;
  views: number;
  excerpt?: string;
  category_slug?: string;
}

interface GalleryProps {
  allNews?: NewsItem[];
  onArticleClick?: (article: NewsItem) => void;
}

const Gallery: React.FC<GalleryProps> = ({ 
  allNews = [], 
  onArticleClick 
}) => {
  const router = useRouter();
  
  // Gallery State
  const [galleryItems, setGalleryItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

  // Initialize gallery items from props
  useEffect(() => {
    const mediaItems = allNews.filter(item => 
      item.image_url && item.image_url.trim() !== ''
    );
    
    setGalleryItems(mediaItems);
    setIsLoading(false);
  }, [allNews]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Get image URL helper
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `/${imageUrl.replace(/^\//, '')}`;
  };

  // Handle image clicks
  const handleImageClick = (item: NewsItem) => {
    setSelectedItem(item);
  };

  const handleArticleClick = (item: NewsItem) => {
    if (onArticleClick) {
      onArticleClick(item);
    } else {
      router.push(`/client/articles/${item.news_id}`);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    target.parentElement?.classList.add('error');
  };

  if (isLoading) {
    return (
      <div className="gallery-container">
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      {/* Gallery Header */}
      <div className="gallery-header">
        <h1 className="gallery-title">📸 Media Gallery</h1>
        <p className="gallery-subtitle">
          {galleryItems.length} images from across Kenya and beyond
        </p>
      </div>

      {/* Gallery Grid */}
      {galleryItems.length > 0 ? (
        <div className="gallery-grid">
          {galleryItems.map((item) => (
            <div
              key={item.news_id}
              className="gallery-item"
              onClick={() => handleImageClick(item)}
            >
              <img
                src={getImageUrl(item.image_url)}
                alt={item.title}
                className="gallery-image"
                loading="lazy"
                onError={handleImageError}
              />
              <div className="gallery-overlay">
                <div className="overlay-title">
                  {item.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="gallery-empty">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📷</div>
          <h3>No Images Available</h3>
          <p>Check back later for new content.</p>
        </div>
      )}

      {/* Image Modal */}
      {selectedItem && (
        <div 
          className="media-modal-overlay" 
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '8px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              cursor: 'default',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #ddd'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.25rem',
                flex: 1,
                marginRight: '16px'
              }}>
                {selectedItem.title}
              </h3>
              <button 
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              maxHeight: '70vh'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                padding: '20px'
              }}>
                <img
                  src={getImageUrl(selectedItem.image_url)}
                  alt={selectedItem.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    objectFit: 'contain'
                  }}
                />
              </div>
              
              <div style={{
                padding: '20px',
                borderTop: '1px solid #ddd'
              }}>
                <div style={{
                  display: 'inline-block',
                  background: '#0078d4',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  {selectedItem.category_name}
                </div>
                
                {selectedItem.excerpt && (
                  <p style={{ 
                    color: '#666',
                    lineHeight: '1.6',
                    marginBottom: '16px'
                  }}>
                    {selectedItem.excerpt}
                  </p>
                )}
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '0.875rem',
                  color: '#666',
                  marginBottom: '20px'
                }}>
                  <span>By {selectedItem.first_name} {selectedItem.last_name}</span>
                  <span>{formatDate(selectedItem.published_at)}</span>
                  <span>👁️ {selectedItem.views?.toLocaleString() || 0} views</span>
                </div>
                
                <button
                  onClick={() => handleArticleClick(selectedItem)}
                  style={{
                    background: '#0078d4',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    width: '100%',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#106ebe'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#0078d4'}
                >
                  📖 Read Full Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;