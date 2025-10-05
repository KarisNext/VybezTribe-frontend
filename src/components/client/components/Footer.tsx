'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Define categories directly in component
const MAIN_CATEGORIES = [
  'politics',
  'counties',
  'opinion',
  'business',
  'sports',
  'technology'
] as const;

export default function Footer() {
  const router = useRouter();

  const handleCategoryClick = (slug: string) => {
    router.push(`/client/categories/${slug}`);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <footer className="site-footer">
      <div className="main-container">
        <div className="footer-grid">
          <div className="footer-col footer-about">
            <h3 className="footer-heading">VybesTribe News</h3>
            <p className="footer-desc">
              Your trusted source for African news. Stay informed with the latest stories from across the continent.
            </p>
            <div className="footer-socials">
              <a href="https://facebook.com/vybeztribe" className="social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">📘</a>
              <a href="https://twitter.com/vybeztribe" className="social-icon" aria-label="Twitter" target="_blank" rel="noopener noreferrer">🦅</a>
              <a href="https://instagram.com/vybeztribe" className="social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">📷</a>
              <a href="https://linkedin.com/company/vybeztribe" className="social-icon" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">💼</a>
              <a href="https://youtube.com/@vybeztribe" className="social-icon" aria-label="YouTube" target="_blank" rel="noopener noreferrer">📺</a>
              <a href="https://tiktok.com/@vybeztribe" className="social-icon" aria-label="TikTok" target="_blank" rel="noopener noreferrer">🎵</a>
            </div>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Categories</h3>
            <ul className="footer-list">
              {MAIN_CATEGORIES.map((slug) => (
                <li key={slug}>
                  <button 
                    onClick={() => handleCategoryClick(slug)} 
                    className="footer-link"
                  >
                    {slug.charAt(0).toUpperCase() + slug.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-list">
              <li><button onClick={() => handleNavigation('/client')} className="footer-link">Home</button></li>
              <li><button onClick={() => handleNavigation('/about')} className="footer-link">About Us</button></li>
              <li><button onClick={() => handleNavigation('/contact')} className="footer-link">Contact</button></li>
              <li><button onClick={() => handleNavigation('/advertise')} className="footer-link">Advertise</button></li>
              <li><button onClick={() => handleNavigation('/privacy')} className="footer-link">Privacy Policy</button></li>
              <li><button onClick={() => handleNavigation('/terms')} className="footer-link">Terms of Service</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-heading">Newsletter</h3>
            <p className="newsletter-text">Subscribe for daily news updates</p>
            <div className="newsletter-box">
              <input 
                type="email" 
                placeholder="Your email" 
                className="newsletter-input" 
              />
              <button className="newsletter-button">Subscribe</button>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p className="newsletter-text" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Download Our App</p>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <a href="#" className="footer-link" style={{ fontSize: '0.85rem' }}>📱 iOS App Store</a>
                <a href="#" className="footer-link" style={{ fontSize: '0.85rem' }}>🤖 Google Play Store</a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright-text">&copy; {new Date().getFullYear()} VybesTribe News. All rights reserved.</p>
          <p className="made-with-love">Made with ❤️ in Africa</p>
        </div>
      </div>
    </footer>
  );
}