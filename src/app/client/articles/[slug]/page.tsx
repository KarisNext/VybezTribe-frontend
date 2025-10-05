'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClientSession } from '../../../../components/client/hooks/ClientSessions';
import { useArticle } from '../../../../components/client/hooks/useArticle';
import Gallery from '../../../../components/client/components/Gallery';

// Note: generateStaticParams must be exported from a separate server component file
// Create a file at app/client/articles/[slug]/layout.tsx with this function

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: sessionLoading } = useClientSession();
  
  const articleSlug = params?.['slug'] as string;
  const [showGallery, setShowGallery] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');

  const {
    article,
    relatedArticles,
    isLoading: articleLoading,
    error: articleError,
    notFound,
    fetchArticle,
    trackLike,
    formatDate,
    formatNumber,
    getImageUrl
  } = useArticle();

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vybes-theme', theme);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('vybes-theme') || 'white';
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isAuthenticated && articleSlug) {
      fetchArticle(articleSlug);
    }
  }, [sessionLoading, isAuthenticated, articleSlug, fetchArticle]);

  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, sessionLoading, router]);

  const handleRelatedClick = (relatedArticle: any) => {
    router.push(`/client/articles/${relatedArticle.slug}`);
  };

  const handleBackToHome = () => {
    router.push('/client');
  };

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/client/categories/${categorySlug}`);
  };

  const handleLikeClick = async () => {
    if (article?.slug) {
      await trackLike(article.slug);
    }
  };

  const renderArticleContent = (content: string) => {
    if (!content) return null;

    const paragraphs = content.split('\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      let processedParagraph = paragraph
        .replace(/\[QUOTE\](.*?)\[\/QUOTE\]/g, '<blockquote style="background: var(--background-secondary); border-left: 4px solid var(--primary-color); padding: 1.5rem; margin: 2rem 0; font-size: 1.05rem; font-style: italic; color: var(--text-secondary); border-radius: 4px;">$1</blockquote>')
        .replace(/\[HIGHLIGHT\](.*?)\[\/HIGHLIGHT\]/g, '<mark style="background: var(--primary-color); color: white; padding: 0.2rem 0.4rem; border-radius: 3px; font-weight: 600;">$1</mark>')
        .replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong style="font-weight: 700; color: var(--text-primary);">$1</strong>')
        .replace(/\[ITALIC\](.*?)\[\/ITALIC\]/g, '<em style="font-style: italic;">$1</em>')
        .replace(/\[HEADING\](.*?)\[\/HEADING\]/g, '<h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 2rem 0 1rem; font-family: var(--font-heading);">$1</h3>');

      const isFirstParagraph = index === 0;
      
      if (isFirstParagraph && processedParagraph.length > 0 && !processedParagraph.startsWith('<')) {
        const firstChar = processedParagraph.charAt(0);
        const restOfContent = processedParagraph.slice(1);

        return (
          <p key={index} style={{ fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem', color: 'var(--text-primary)', textAlign: 'justify' }}>
            <span style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--primary-color)', float: 'left', lineHeight: '0.85', marginRight: '10px', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>{firstChar}</span>
            <span dangerouslySetInnerHTML={{ __html: restOfContent }} />
          </p>
        );
      }

      return (
        <p key={index} style={{ fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem', color: 'var(--text-primary)', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: processedParagraph }} />
      );
    });
  };

  if (sessionLoading || articleLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (showGallery) {
    const galleryNews = relatedArticles.map(article => ({
      ...article,
      news_id: String(article.news_id)
    }));
    return <Gallery allNews={galleryNews} onArticleClick={handleRelatedClick} />;
  }

  if (notFound || articleError || !article) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1>Article Not Found</h1>
        <p>{articleError || 'The requested article could not be found.'}</p>
        <button onClick={handleBackToHome} style={{ padding: '10px 20px', margin: '10px' }}>Back to Home</button>
      </div>
    );
  }

  return (
    <div>
      <header className="site-header">
        <div className="header-top-bar">
          <div className="main-container">
            <div className="header-top-content">
              <div className="breaking-ticker">
                Breaking News • Latest Updates • {formatDate(new Date().toISOString())}
              </div>
              <div className="theme-switcher desktop-only">
                <button className={`theme-btn theme-white ${currentTheme === 'white' ? 'active' : ''}`} onClick={() => handleThemeChange('white')} aria-label="Light theme" title="Light Theme" />
                <button className={`theme-btn theme-dark ${currentTheme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeChange('dark')} aria-label="Dark theme" title="Dark Theme" />
                <button className={`theme-btn theme-african ${currentTheme === 'african' ? 'active' : ''}`} onClick={() => handleThemeChange('african')} aria-label="African theme" title="African Theme" />
              </div>
            </div>
          </div>
        </div>

        <div className="main-container">
          <div className="header-main">
            <div className="logo-section" onClick={handleBackToHome} style={{ cursor: 'pointer' }}>
              <h1 className="site-title">VybesTribe News</h1>
              <div className="site-tagline">Your trusted source for African news</div>
            </div>
            <div className="search-container desktop-only">
              <input type="text" placeholder="Search news..." className="search-input" />
              <button className="search-btn">🔍</button>
            </div>
          </div>
        </div>
      </header>

      <nav className="category-navigation desktop-only">
        <div className="main-container">
          <div className="nav-categories">
            <button className="nav-category" onClick={handleBackToHome}>Home</button>
            <button className={`nav-category ${article.category_slug === 'politics' ? 'active' : ''}`} onClick={() => handleCategoryClick('politics')}>Politics</button>
            <button className={`nav-category ${article.category_slug === 'counties' ? 'active' : ''}`} onClick={() => handleCategoryClick('counties')}>Counties</button>
            <button className={`nav-category ${article.category_slug === 'opinion' ? 'active' : ''}`} onClick={() => handleCategoryClick('opinion')}>Opinion</button>
            <button className={`nav-category ${article.category_slug === 'business' ? 'active' : ''}`} onClick={() => handleCategoryClick('business')}>Business</button>
            <button className={`nav-category ${article.category_slug === 'sports' ? 'active' : ''}`} onClick={() => handleCategoryClick('sports')}>Sports</button>
            <button className={`nav-category ${article.category_slug === 'technology' ? 'active' : ''}`} onClick={() => handleCategoryClick('technology')}>Technology</button>
          </div>
        </div>
      </nav>

      <main className="main-container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-2xl)', marginTop: 'var(--spacing-xl)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {article.image_url && (
              <div style={{ marginBottom: 'var(--spacing-2xl)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
                <img src={getImageUrl(article.image_url) || ''} alt={article.title} style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            <article style={{ padding: '0 1.5rem' }}>
              <div style={{ display: 'inline-block', background: 'var(--gradient-primary)', color: 'white', padding: '8px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--spacing-xl)' }}>
                {article.category_name}
              </div>

              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: '900', lineHeight: '1.2', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xl)', letterSpacing: '-0.02em' }}>
                {article.title}
              </h1>

              {article.excerpt && (
                <p style={{ fontSize: '1.15rem', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2xl)', fontWeight: '500', fontStyle: 'italic', borderLeft: '4px solid var(--primary-color)', paddingLeft: '1.5rem', background: 'var(--background-secondary)', padding: '1.5rem 1.5rem 1.5rem 2rem', borderRadius: 'var(--border-radius-md)' }}>
                  {article.excerpt}
                </p>
              )}
              
              <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', paddingBottom: 'var(--spacing-xl)', borderBottom: '2px solid var(--border-color)', marginBottom: 'var(--spacing-2xl)' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>By {article.first_name} {article.last_name}</span>
                <span>{formatDate(article.published_at)}</span>
                <span>{formatNumber(article.views)} views</span>
                <button onClick={handleLikeClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                  ❤️ {formatNumber(article.likes_count)}
                </button>
              </div>

              <div style={{ fontFamily: 'var(--font-body)', maxWidth: '680px', margin: '0 auto' }}>
                {renderArticleContent(article.content)}
              </div>
            </article>
          </div>

          <div style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
            <div style={{ background: 'var(--background-secondary)', padding: 'var(--spacing-xl)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-light)' }}>
              <h3 className="section-title" style={{ marginBottom: 'var(--spacing-lg)', fontSize: '1.2rem' }}>Recommended</h3>
              {relatedArticles.slice(0, 6).map((recommended) => (
                <div key={recommended.news_id} onClick={() => handleRelatedClick(recommended)} style={{ display: 'flex', gap: 'var(--spacing-md)', padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'var(--transition-fast)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--background-primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  {recommended.image_url && (
                    <img src={getImageUrl(recommended.image_url) || ''} alt={recommended.title} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', flexShrink: 0 }} />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', lineHeight: '1.3', fontWeight: '600', color: 'var(--text-primary)' }}>{recommended.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{recommended.category_name} • {formatDate(recommended.published_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {relatedArticles.length > 6 && (
          <section style={{ marginTop: 'var(--spacing-3xl)', paddingTop: 'var(--spacing-2xl)', borderTop: '2px solid var(--border-color)' }}>
            <h3 className="section-title" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>More Stories</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-xl)' }}>
              {relatedArticles.slice(6, 14).map((story) => (
                <div key={story.news_id} onClick={() => handleRelatedClick(story)} className="article-card" style={{ cursor: 'pointer' }}>
                  <div className="article-card-image" style={{ height: '180px' }}>
                    {story.image_url ? (
                      <img src={getImageUrl(story.image_url) || ''} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="image-placeholder">📰</div>
                    )}
                  </div>
                  <div className="article-card-content">
                    <h4 className="article-card-title" style={{ fontSize: '1rem' }}>{story.title}</h4>
                    {story.excerpt && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '8px' }}>{story.excerpt.substring(0, 100)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <button className="stories-btn" onClick={() => setShowGallery(true)} title="View Gallery">
        <div className="stories-icon">📸</div>
        <div className="stories-text">Stories</div>
      </button>

      <footer className="site-footer">
        <div className="main-container">
          <div className="footer-grid">
            <div className="footer-col footer-about">
              <h3 className="footer-heading">VybesTribe News</h3>
              <p className="footer-desc">Your trusted source for African news. Stay informed with the latest stories from across the continent.</p>
              <div className="footer-socials">
                <a href="https://facebook.com" className="social-icon" aria-label="Facebook" target="_blank" rel="noopener">📘</a>
                <a href="https://twitter.com" className="social-icon" aria-label="Twitter" target="_blank" rel="noopener">🦅</a>
                <a href="https://instagram.com" className="social-icon" aria-label="Instagram" target="_blank" rel="noopener">📷</a>
                <a href="https://linkedin.com" className="social-icon" aria-label="LinkedIn" target="_blank" rel="noopener">💼</a>
              </div>
            </div>
            <div className="footer-col">
              <h3 className="footer-heading">Categories</h3>
              <ul className="footer-list">
                <li><button onClick={() => handleCategoryClick('politics')} className="footer-link">Politics</button></li>
                <li><button onClick={() => handleCategoryClick('counties')} className="footer-link">Counties</button></li>
                <li><button onClick={() => handleCategoryClick('opinion')} className="footer-link">Opinion</button></li>
                <li><button onClick={() => handleCategoryClick('business')} className="footer-link">Business</button></li>
                <li><button onClick={() => handleCategoryClick('sports')} className="footer-link">Sports</button></li>
                <li><button onClick={() => handleCategoryClick('technology')} className="footer-link">Technology</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3 className="footer-heading">Quick Links</h3>
              <ul className="footer-list">
                <li><button onClick={handleBackToHome} className="footer-link">Home</button></li>
                <li><button onClick={() => router.push('/about')} className="footer-link">About Us</button></li>
                <li><button onClick={() => router.push('/contact')} className="footer-link">Contact</button></li>
                <li><button onClick={() => router.push('/privacy')} className="footer-link">Privacy Policy</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3 className="footer-heading">Newsletter</h3>
              <p className="newsletter-text">Subscribe for daily news updates</p>
              <div className="newsletter-box">
                <input type="email" placeholder="Your email" className="newsletter-input" />
                <button className="newsletter-button">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom-bar">
            <p className="copyright-text">&copy; {new Date().getFullYear()} VybesTribe News. All rights reserved.</p>
            <p className="made-with-love">Made with ❤️ in Africa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}