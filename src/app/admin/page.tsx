'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/includes/Session';
import CreatePosts from '@/components/admin/CreatePosts';
import EditPosts from '@/components/admin/EditPosts';
import LogoutButton from '@/components/admin/Logout';
import RetrievePosts from '@/components/admin/RetrievePosts';
import SharePosts from '@/components/admin/SharePosts';
import Users from '@/components/admin/Users';

// API Base URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://vybeztribe.com'
  : 'http://localhost:5000';

// Placeholder components for future features
const Analytics: React.FC = () => (
  <div className="admin-placeholder">
    <div className="placeholder-content">
      <h2>Analytics Dashboard</h2>
      <p>Comprehensive analytics and reporting tools coming soon...</p>
      <div className="placeholder-features">
        <ul>
          <li>User engagement metrics</li>
          <li>Content performance analytics</li>
          <li>Traffic and conversion tracking</li>
          <li>Real-time dashboard updates</li>
        </ul>
      </div>
    </div>
  </div>
);

const Boosts: React.FC = () => (
  <div className="admin-placeholder">
    <div className="placeholder-content">
      <h2>Content Boosts</h2>
      <p>Promotion and content amplification tools coming soon...</p>
      <div className="placeholder-features">
        <ul>
          <li>Sponsored content management</li>
          <li>Social media promotion</li>
          <li>Newsletter integration</li>
          <li>SEO optimization tools</li>
        </ul>
      </div>
    </div>
  </div>
);

const SEO: React.FC = () => (
  <div className="admin-placeholder">
    <div className="placeholder-content">
      <h2>SEO Management</h2>
      <p>Search engine optimization tools coming soon...</p>
      <div className="placeholder-features">
        <ul>
          <li>Keyword research and tracking</li>
          <li>Meta tag optimization</li>
          <li>Sitemap management</li>
          <li>Performance monitoring</li>
        </ul>
      </div>
    </div>
  </div>
);

// Type definitions
interface AdminUser {
  admin_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  component: React.FC;
  description: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('retrieve-posts');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [initComplete, setInitComplete] = useState<boolean>(false);
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading: sessionLoading, logout, error: sessionError } = useSession();

  // Admin menu items configuration
  const adminMenuItems: MenuItem[] = [
    { id: 'analytics', label: 'Analytics', icon: '📊', component: Analytics, description: 'Dashboard overview and insights' },
    { id: 'retrieve-posts', label: 'All Posts', icon: '📰', component: RetrievePosts, description: 'View and manage all posts' },
    { id: 'create-posts', label: 'Create Post', icon: '✏️', component: CreatePosts, description: 'Create new content' },
    { id: 'users', label: 'Users', icon: '👥', component: Users, description: 'Manage admin users' },
    { id: 'share-posts', label: 'Share Posts', icon: '📤', component: SharePosts, description: 'Social media sharing tools' },
    { id: 'boosts', label: 'Boosts', icon: '🚀', component: Boosts, description: 'Promote and amplify content' },
    { id: 'seo', label: 'SEO', icon: '🔍', component: SEO, description: 'Search optimization tools' },
  ];

  // Initialize admin user when session data is available
  useEffect(() => {
    console.log('Admin Dashboard - Session state:', {
      sessionLoading,
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      sessionError
    });

    if (sessionLoading) {
      console.log('Session still loading, waiting...');
      return;
    }

    if (sessionError) {
      console.error('Session error:', sessionError);
      setAuthError(sessionError);
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    // Check admin authorization
    const authorizedRoles = ['admin', 'super_admin', 'editor', 'moderator'];
    const isAuthorized = authorizedRoles.includes(user.role);
    
    console.log('Authorization check:', {
      userRole: user.role,
      isAuthorized,
      authorizedRoles
    });

    if (!isAuthorized) {
      setAuthError(`Access denied. Role '${user.role}' is not authorized for admin access.`);
      setIsLoading(false);
      setTimeout(() => {
        router.push('/client');
      }, 3000);
      return;
    }

    // Set admin user data
    setAdminUser({
      admin_id: user.admin_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    });
    
    setAuthError('');
    setIsLoading(false);
    setInitComplete(true);
    
    console.log('Admin dashboard initialized successfully for:', user.email);
  }, [sessionLoading, isAuthenticated, user, sessionError, router]);

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    try {
      console.log('Initiating logout...');
      setIsLoading(true);
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  // Handle edit post navigation
  const handleEditPost = useCallback((postId: number): void => {
    console.log('Editing post:', postId);
    setEditingPostId(postId);
    setActiveTab('edit-post');
  }, []);

  // Handle back from edit
  const handleBackFromEdit = useCallback((): void => {
    console.log('Returning from edit post');
    setEditingPostId(null);
    setActiveTab('retrieve-posts');
  }, []);

  // Handle navigation between tabs
  const handleNavigation = useCallback((tabId: string): void => {
    console.log('Navigating to tab:', tabId);
    setActiveTab(tabId);
    setSidebarOpen(false);
    setEditingPostId(null);
  }, []);

  // Get the active component to render
  const getActiveComponent = useCallback((): React.FC => {
    if (activeTab === 'edit-post' && editingPostId) {
      return () => (
        <EditPosts 
          newsId={editingPostId}
          onBack={handleBackFromEdit}
        />
      );
    }
    
    const menuItem = adminMenuItems.find(item => item.id === activeTab);
    return menuItem?.component || Analytics;
  }, [activeTab, editingPostId, handleBackFromEdit]);

  // Show loading while initializing
  if (sessionLoading || isLoading || !initComplete) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading Admin Dashboard...</p>
        {sessionError && (
          <div className="error-message">
            <p>Session Error: {sessionError}</p>
          </div>
        )}
      </div>
    );
  }

  // Show error if authentication failed
  if (authError) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>{authError}</p>
          <p>Redirecting you to the appropriate page...</p>
          <button onClick={() => router.push('/client')}>Go to Home</button>
        </div>
      </div>
    );
  }

  // Show error if user data is missing
  if (!adminUser) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>User role: {user?.role || 'Unknown'}</p>
          <button onClick={() => router.push('/client')}>Return to Home</button>
        </div>
      </div>
    );
  }

  const ActiveComponent = getActiveComponent();

  return (
    <div className="admin-dashboard" data-theme="dark">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-brand">
          <h1>VybezTribe Admin</h1>
        </div>
        <div className="mobile-controls">
          <LogoutButton 
            onLogout={handleLogout}
            variant="icon"
            showText={false}
            className="mobile-logout-btn"
          />
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-brand">
            <h2>VybezTribe</h2>
            <span className="admin-badge">Admin</span>
          </div>
          <button 
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="admin-profile">
          <div className="profile-avatar">
            <span>{adminUser.first_name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="profile-info">
            <h3>{`${adminUser.first_name} ${adminUser.last_name}`}</h3>
            <p>{adminUser.role.replace('_', ' ').toUpperCase()}</p>
            <small>ID: {adminUser.admin_id}</small>
          </div>
        </div>

        <nav className="admin-nav">
          <ul>
            {adminMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.id)}
                  title={item.description}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <LogoutButton 
            onLogout={handleLogout}
            variant="full"
            showText={true}
            className="sidebar-logout-btn"
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content">
          <header className="content-header">
            <div className="header-left">
              <h1>
                {activeTab === 'edit-post' ? 'Edit Post' : 
                 adminMenuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              {activeTab === 'edit-post' && (
                <button 
                  className="back-btn"
                  onClick={handleBackFromEdit}
                >
                  ← Back to Posts
                </button>
              )}
            </div>
            <div className="header-actions">
              <div className="admin-stats">
                <span className="stat-item">
                  <span className="stat-icon">👤</span>
                  <span>Admin: {`${adminUser.first_name} ${adminUser.last_name}`}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-icon">🏷️</span>
                  <span>Role: {adminUser.role}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-icon">🕐</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </span>
              </div>
              <LogoutButton 
                onLogout={handleLogout}
                variant="button"
                showText={true}
                className="desktop-logout-btn"
              />
            </div>
          </header>

          <div className="content-body">
            {React.createElement(ActiveComponent)}
          </div>
        </div>
      </main>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSidebarOpen(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
