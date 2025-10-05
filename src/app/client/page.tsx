'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClientSession } from '../../components/client/hooks/ClientSessions';
import { useHome } from '../../components/client/hooks/useHome';
import Gallery from '../../components/client/components/Gallery';
import HeroSlider from '../../components/client/components/HeroSlider';

export default function Homepage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: sessionLoading } = useClientSession();
  
  const {
    breakingNews,
    featuredNews,
    categoryPreviews,
    isLoading,
    error,
    fetchHomeContent,
    formatDate,
    formatNumber,
    getImageUrl,
    getCategoryIcon
  } = useHome();

  const [showGallery, setShowGallery] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (isAuthenticated && !sessionLoading) {
      fetchHomeContent();
    }
  }, [isAuthenticated, sessionLoading, fetchHomeContent]);

  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, sessionLoading, router]);

  const handleArticleClick = useCallback((article: any) => {
    console.log('Article clicked:', article?.slug, article);
    if (article?.slug) {
      router.push(`/client/articles/${article.slug}`);
    } else {
      console.error('Article slug is missing or invalid:', article);
    }
  }, [router]);

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/client/categories/${categorySlug}`);
    setMobileMenuOpen(false);
  };

  const getAuthorName = useCallback((article: any): string => {
    if (!article) return 'Anonymous';
    
    if (article.author_name) return article.author_name;
    if (article.first_name || article.last_name) {
      return `${article.first_name || ''} ${article.last_name || ''}`.trim() || 'Anonymous';
    }
    if (article.author?.first_name || article.author?.last_name) {
      return `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() || 'Anonymous';
    }
    
    return 'Anonymous';
  }, []);

  if (sessionLoading || isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading your news feed...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (showGallery) {
    const allNewsItems = [
      ...breakingNews,
      ...featuredNews,
      ...Object.values(categoryPreviews).flat()
    ];
    return <Gallery allNews={allNewsItems as any} onArticleClick={handleArticleClick} />;
  }

  const sliderSlides = [...featuredNews, ...breakingNews].slice(0, 5);
  const headlines = [...featuredNews, ...breakingNews].slice(5, 11);
  const topArticles = [...featuredNews, ...breakingNews].slice(11, 15);

  const politicsNews = categoryPreviews['politics'] || [];
  const countiesNews = categoryPreviews['counties'] || [];
  const opinionNews = categoryPreviews['opinion'] || [];
  const businessNews = categoryPreviews['business'] || [];
  const sportsNews = categoryPreviews['sports'] || [];
  const technologyNews = categoryPreviews['technology'] || [];

  return (
    <div className="news-homepage">
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
            <div className="logo-section" onClick={() => router.push('/client')}>
              <h1 className="site-title">VybesTribe News</h1>
              <div className="site-tagline">Your trusted source for African news</div>
            </div>

            <div className="search-container desktop-only">
              <input
                type="text"
                placeholder="Search news..."
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>

            <button className="mobile-menu-btn mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav className="category-navigation desktop-only">
        <div className="main-container">
          <div className="nav-categories">
            <button className="nav-category active" onClick={() => router.push('/client')}>Home</button>
            <button className="nav-category" onClick={() => handleCategoryClick('politics')}>Politics</button>
            <button className="nav-category" onClick={() => handleCategoryClick('counties')}>Counties</button>
            <button className="nav-category" onClick={() => handleCategoryClick('opinion')}>Opinion</button>
            <button className="nav-category" onClick={() => handleCategoryClick('business')}>Business</button>
            <button className="nav-category" onClick={() => handleCategoryClick('sports')}>Sports</button>
            <button className="nav-category" onClick={() => handleCategoryClick('technology')}>Technology</button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-fullscreen-menu">
          <div className="mobile-menu-content">
            <div className="mobile-search">
              <input type="text" placeholder="Search news..." className="search-input" />
              <button className="search-btn">🔍</button>
            </div>

            <nav className="mobile-categories">
              <button className="mobile-nav-item active" onClick={() => { router.push('/client'); setMobileMenuOpen(false); }}>
                🏠 Home
              </button>
              <button className="mobile-nav-item" onClick={() => handleCategoryClick('politics')}>🏛️ Politics</button>
              <button className="mobile-nav-item" onClick={() => handleCategoryClick('counties')}>🏢 Counties</button>
              <button className="mobile-nav-item" onClick={() => handleCategoryClick('opinion')}>💭 Opinion</button>
              <button className="mobile-nav-item" onClick={() => handleCategoryClick('business')}>💼 Business</button>
              <button className="mobile-nav-item" onClick={() => handleCategoryClick('sports')}>⚽ Sports</button>
              <button className="mobile-nav-item" onClick={() => handleCategoryClick('technology')}>💻 Technology</button>
            </nav>

            <div className="mobile-theme-section">
              <h3>Choose Theme</h3>
              <div className="mobile-theme-switcher">
                <button
                  className={`mobile-theme-btn ${currentTheme === 'white' ? 'active' : ''}`}
                  onClick={() => { handleThemeChange('white'); setMobileMenuOpen(false); }}
                >
                  <span className="theme-indicator theme-white"></span>
                  Light
                </button>
                <button
                  className={`mobile-theme-btn ${currentTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => { handleThemeChange('dark'); setMobileMenuOpen(false); }}
                >
                  <span className="theme-indicator theme-dark"></span>
                  Dark
                </button>
                <button
                  className={`mobile-theme-btn ${currentTheme === 'african' ? 'active' : ''}`}
                  onClick={() => { handleThemeChange('african'); setMobileMenuOpen(false); }}
                >
                  <span className="theme-indicator theme-african"></span>
                  African
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="main-container">
        <section className="hero-section">
          <div className="hero-slider-col">
            <HeroSlider
              slides={sliderSlides}
              onSlideClick={handleArticleClick}
              formatDate={formatDate}
              formatNumber={formatNumber}
              getImageUrl={getImageUrl}
            />
          </div>

          <div className="headlines-sidebar">
            <h3 className="headlines-title">Top Headlines</h3>
            {headlines.map((headline, index) => (
              <div key={headline.news_id} className="headline-item" onClick={() => handleArticleClick(headline)}>
                <div className="headline-number">{index + 1}</div>
                <div className="headline-content">
                  <div className="headline-link">{headline.title}</div>
                  <div className="headline-meta">
                    {headline.category_name} • {formatDate(headline.published_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {topArticles.length > 0 && (
          <section className="top-articles-section">
            <div className="top-articles-grid">
              {topArticles.map((article) => (
                <div key={article.news_id} className="article-card-large" onClick={() => handleArticleClick(article)}>
                  <div className="article-image-container">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">📰</div>
                    )}
                  </div>
                  <div className="article-content-box">
                    <span className="category-badge">{article.category_name}</span>
                    <h3 className="article-title-clear">{article.title}</h3>
                    <div className="article-meta-clear">
                      <span>By {getAuthorName(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {politicsNews.length > 0 && (
          <section className="category-section">
            <div className="category-header-bar">
              <h2 className="category-title-clear">
                <span className="category-icon">🏛️</span>
                Politics
              </h2>
              <button className="view-all-button" onClick={() => handleCategoryClick('politics')}>
                View All →
              </button>
            </div>
            <div className="politics-grid">
              {politicsNews.slice(0, 6).map((article) => (
                <div key={article.news_id} className="article-card-standard" onClick={() => handleArticleClick(article)}>
                  <div className="card-image-box">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">🏛️</div>
                    )}
                  </div>
                  <div className="card-text-box">
                    <span className="small-category-badge">{article.category_name}</span>
                    <h3 className="card-title-text">{article.title}</h3>
                    <div className="card-meta-info">
                      <span>By {getAuthorName(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {countiesNews.length > 0 && (
          <section className="category-section">
            <div className="category-header-bar">
              <h2 className="category-title-clear">
                <span className="category-icon">🏢</span>
                Counties
              </h2>
              <button className="view-all-button" onClick={() => handleCategoryClick('counties')}>
                View All →
              </button>
            </div>
            <div className="other-categories-grid">
              {countiesNews.slice(0, 4).map((article) => (
                <div key={article.news_id} className="article-card-standard" onClick={() => handleArticleClick(article)}>
                  <div className="card-image-box">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">🏢</div>
                    )}
                  </div>
                  <div className="card-text-box">
                    <span className="small-category-badge">{article.category_name}</span>
                    <h3 className="card-title-text">{article.title}</h3>
                    <div className="card-meta-info">
                      <span>By {getAuthorName(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {opinionNews.length > 0 && (
          <section className="category-section">
            <div className="category-header-bar">
              <h2 className="category-title-clear">
                <span className="category-icon">💭</span>
                Opinion
              </h2>
              <button className="view-all-button" onClick={() => handleCategoryClick('opinion')}>
                View All →
              </button>
            </div>
            <div className="other-categories-grid">
              {opinionNews.slice(0, 4).map((article) => (
                <div key={article.news_id} className="article-card-standard" onClick={() => handleArticleClick(article)}>
                  <div className="card-image-box">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">💭</div>
                    )}
                  </div>
                  <div className="card-text-box">
                    <span className="small-category-badge">{article.category_name}</span>
                    <h3 className="card-title-text">{article.title}</h3>
                    <div className="card-meta-info">
                      <span>By {getAuthorName(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {businessNews.length > 0 && (
          <section className="category-section">
            <div className="category-header-bar">
              <h2 className="category-title-clear">
                <span className="category-icon">💼</span>
                Business
              </h2>
              <button className="view-all-button" onClick={() => handleCategoryClick('business')}>
                View All →
              </button>
            </div>
            <div className="other-categories-grid">
              {businessNews.slice(0, 4).map((article) => (
                <div key={article.news_id} className="article-card-standard" onClick={() => handleArticleClick(article)}>
                  <div className="card-image-box">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">💼</div>
                    )}
                  </div>
                  <div className="card-text-box">
                    <span className="small-category-badge">{article.category_name}</span>
                    <h3 className="card-title-text">{article.title}</h3>
                    <div className="card-meta-info">
                      <span>By {getAuthorName(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {sportsNews.length > 0 && (
          <section className="category-section">
            <div className="category-header-bar">
              <h2 className="category-title-clear">
                <span className="category-icon">⚽</span>
                Sports
              </h2>
              <button className="view-all-button" onClick={() => handleCategoryClick('sports')}>
                View All →
              </button>
            </div>
            <div className="other-categories-grid">
              {sportsNews.slice(0, 4).map((article) => (
                <div key={article.news_id} className="article-card-standard" onClick={() => handleArticleClick(article)}>
                  <div className="card-image-box">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">⚽</div>
                    )}
                  </div>
                  <div className="card-text-box">
                    <span className="small-category-badge">{article.category_name}</span>
                    <h3 className="card-title-text">{article.title}</h3>
                    <div className="card-meta-info">
                      <span>By {getAuthorName(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {technologyNews.length > 0 && (
          <section className="category-section">
            <div className="category-header-bar">
              <h2 className="category-title-clear">
                <span className="category-icon">💻</span>
                Technology
              </h2>
              <button className="view-all-button" onClick={() => handleCategoryClick('technology')}>
                View All →
              </button>
            </div>
            <div className="other-categories-grid">
              {technologyNews.slice(0, 4).map((article) => (
                <div key={article.news_id} className="article-card-standard" onClick={() => handleArticleClick(article)}>
                  <div className="card-image-box">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">💻</div>
                    )}
                  </div>
                  <div className="card-text-box">
                    <span className="small-category-badge">{article.category_name}</span>
                    <h3 className="card-title-text">{article.title}</h3>
                    <div className="card-meta-info">
                      <span>By {getAuthorName(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
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
              <p className="footer-desc">
                Your trusted source for African news. Stay informed with the latest stories from across the continent.
              </p>
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
                <li><button onClick={() => router.push('/client')} className="footer-link">Home</button></li>
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