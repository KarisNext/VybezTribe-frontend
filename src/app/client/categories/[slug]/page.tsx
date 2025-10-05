'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClientSession } from '../../../../components/client/hooks/ClientSessions';
import { useCategory } from '../../../../components/client/hooks/useCategory';
import Gallery from '../../../../components/client/components/Gallery';


export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: sessionLoading } = useClientSession();
  
  const categorySlug = params?.['slug'] as string;
  const [showGallery, setShowGallery] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');

  const {
    category,
    news: categoryNews,
    isLoading,
    error,
    notFound,
    hasMore,
    fetchCategory,
    loadMore,
    formatDate,
    formatNumber,
    getImageUrl,
    getCategoryColor,
    getCategoryIcon
  } = useCategory();

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
    if (!sessionLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (categorySlug && isAuthenticated && !sessionLoading) {
      console.log('CategoryPage: Fetching category:', categorySlug);
      fetchCategory(categorySlug);
    }
  }, [categorySlug, isAuthenticated, sessionLoading, router, fetchCategory]);

  const handleArticleClick = (article: any) => {
    router.push(`/client/articles/${article.slug}`);
  };

  const handleBackToHome = () => {
    router.push('/client');
  };

  const handleCategoryClick = (slug: string) => {
    if (slug !== categorySlug) {
      router.push(`/client/categories/${slug}`);
    }
  };

  const getExcerpt = (article: any) => {
    if (article.excerpt) {
      return article.excerpt;
    }
    if (article.content) {
      const plainText = article.content.replace(/<[^>]+>/g, '').trim();
      return plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
    return '';
  };

  if (sessionLoading || (isLoading && categoryNews.length === 0)) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading {categorySlug} news...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (showGallery) {
    const galleryNews = categoryNews.map(article => ({
      ...article,
      news_id: String(article.news_id)
    }));
    return <Gallery allNews={galleryNews} onArticleClick={handleArticleClick} />;
  }

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1>Category Not Found</h1>
        <p>The category "{categorySlug}" could not be found.</p>
        <button onClick={handleBackToHome} style={{ padding: '10px 20px', margin: '10px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  const config = {
    color: getCategoryColor(categorySlug),
    icon: getCategoryIcon(categorySlug),
    name: category?.name || categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
  };

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
                <button
                  className={`theme-btn theme-white ${currentTheme === 'white' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('white')}
                  aria-label="Light theme"
                  title="Light Theme"
                />
                <button
                  className={`theme-btn theme-dark ${currentTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                  aria-label="Dark theme"
                  title="Dark Theme"
                />
                <button
                  className={`theme-btn theme-african ${currentTheme === 'african' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('african')}
                  aria-label="African theme"
                  title="African Theme"
                />
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
            <button className={`nav-category ${categorySlug === 'politics' ? 'active' : ''}`} onClick={() => handleCategoryClick('politics')}>Politics</button>
            <button className={`nav-category ${categorySlug === 'counties' ? 'active' : ''}`} onClick={() => handleCategoryClick('counties')}>Counties</button>
            <button className={`nav-category ${categorySlug === 'opinion' ? 'active' : ''}`} onClick={() => handleCategoryClick('opinion')}>Opinion</button>
            <button className={`nav-category ${categorySlug === 'business' ? 'active' : ''}`} onClick={() => handleCategoryClick('business')}>Business</button>
            <button className={`nav-category ${categorySlug === 'sports' ? 'active' : ''}`} onClick={() => handleCategoryClick('sports')}>Sports</button>
            <button className={`nav-category ${categorySlug === 'technology' ? 'active' : ''}`} onClick={() => handleCategoryClick('technology')}>Technology</button>
          </div>
        </div>
      </nav>

      <main className="main-container">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0', borderBottom: '2px solid var(--border-color)', marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', color: config.color }}>{config.icon}</div>
          <h1 className="hero-title" style={{ color: config.color, marginBottom: 'var(--spacing-md)' }}>{config.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto var(--spacing-lg)' }}>
            {category?.description || `Latest ${config.name.toLowerCase()} news and updates`}
          </p>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: 'var(--spacing-lg)' }}>
            <span>{formatNumber(categoryNews.length)} articles</span>
            <span>•</span>
            <span>Updated {formatDate(new Date().toISOString())}</span>
          </div>
        </div>

        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'red', background: '#fee', borderRadius: '8px', margin: '20px 0' }}>
            Error: {error}
          </div>
        )}

        {categoryNews.length > 0 ? (
          <section>
            {categoryNews[0] && (
              <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div 
                  onClick={() => handleArticleClick(categoryNews[0])} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 'var(--spacing-xl)', 
                    background: 'var(--background-secondary)', 
                    borderRadius: 'var(--border-radius-lg)', 
                    overflow: 'hidden', 
                    cursor: 'pointer', 
                    transition: 'var(--transition-smooth)', 
                    border: '1px solid var(--border-light)' 
                  }}
                >
                  <div style={{ height: '400px', overflow: 'hidden' }}>
                    {categoryNews[0].image_url ? (
                      <img 
                        src={getImageUrl(categoryNews[0].image_url) || ''} 
                        alt={categoryNews[0].title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: config.color, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '4rem', 
                        color: 'white' 
                      }}>
                        {config.icon}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 'var(--spacing-2xl)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ 
                      background: config.color, 
                      color: 'white', 
                      padding: '6px 12px', 
                      borderRadius: 'var(--border-radius-sm)', 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px', 
                      display: 'inline-block', 
                      marginBottom: 'var(--spacing-lg)', 
                      width: 'fit-content' 
                    }}>
                      Featured
                    </div>
                    <h2 style={{ 
                      fontSize: '2rem', 
                      marginBottom: 'var(--spacing-lg)', 
                      lineHeight: '1.2', 
                      fontWeight: '800', 
                      color: 'var(--text-primary)' 
                    }}>
                      {categoryNews[0].title}
                    </h2>
                    {getExcerpt(categoryNews[0]) && (
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: 'var(--spacing-xl)', 
                        lineHeight: '1.7', 
                        fontSize: '1.1rem' 
                      }}>
                        {getExcerpt(categoryNews[0])}
                      </p>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '0.875rem', 
                      color: 'var(--text-muted)', 
                      marginTop: 'auto' 
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                          By {categoryNews[0].first_name} {categoryNews[0].last_name}
                        </div>
                        <div>{formatDate(categoryNews[0].published_at)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>{formatNumber(categoryNews[0].likes_count)} likes</div>
                        <div>{formatNumber(categoryNews[0].views)} views</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: 'var(--spacing-xl)', 
              marginBottom: 'var(--spacing-2xl)' 
            }}>
              {categoryNews.slice(1).map((article) => (
                <article 
                  key={article.news_id} 
                  onClick={() => handleArticleClick(article)} 
                  className="category-page-card"
                >
                  <div className="article-card-image">
                    {article.image_url ? (
                      <img 
                        src={getImageUrl(article.image_url) || ''} 
                        alt={article.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div className="image-placeholder" style={{ color: config.color, fontSize: '3rem' }}>
                        {config.icon}
                      </div>
                    )}
                    <div style={{ 
                      position: 'absolute', 
                      top: 'var(--spacing-sm)', 
                      left: 'var(--spacing-sm)', 
                      background: config.color, 
                      color: 'white', 
                      padding: '4px 10px', 
                      borderRadius: 'var(--border-radius-sm)', 
                      fontSize: '0.7rem', 
                      fontWeight: '600', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px' 
                    }}>
                      {article.category_name}
                    </div>
                  </div>
                  
                  <div className="article-card-content">
                    <h3 className="article-card-title">{article.title}</h3>
                    
                    {getExcerpt(article) && (
                      <p className="article-excerpt">{getExcerpt(article)}</p>
                    )}
                    
                    <div className="article-meta">
                      <div className="article-author">
                        By {article.first_name} {article.last_name}
                      </div>
                      <div className="article-date">
                        {formatDate(article.published_at)}
                      </div>
                      <div className="article-stats">
                        <span>{formatNumber(article.likes_count)} likes</span>
                        <span>•</span>
                        <span>{formatNumber(article.views)} views</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                <button 
                  onClick={loadMore} 
                  disabled={isLoading} 
                  className="view-all-btn" 
                  style={{ 
                    padding: 'var(--spacing-lg) var(--spacing-2xl)', 
                    fontSize: '1rem', 
                    background: isLoading ? 'var(--text-muted)' : config.color, 
                    cursor: isLoading ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {isLoading ? 'Loading More...' : 'Load More Articles'}
                </button>
              </div>
            )}
          </section>
        ) : !isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)', color: config.color }}>
              {config.icon}
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
              No articles found
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 var(--spacing-2xl) 0' }}>
              There are currently no articles in the {config.name} category.
            </p>
            <button onClick={handleBackToHome} className="view-all-btn">
              Browse Other Categories
            </button>
          </div>
        ) : null}
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