// frontend/src/components/admin/Users.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/includes/Session';

interface AdminUser {
  admin_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'editor' | 'moderator';
  posts_count: number;
  status: string;
  created_at: string;
  last_login?: string;
}

interface CreateUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

interface EditUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

const Users: React.FC = () => {
  const { user, isAuthenticated, isLoading: sessionLoading } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateUserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'editor'
  });

  const [editForm, setEditForm] = useState<EditUserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'editor'
  });

  useEffect(() => {
    if (!sessionLoading && isAuthenticated) {
      fetchUsers();
    }
  }, [sessionLoading, isAuthenticated]);

  const fetchUsers = async () => {
    if (sessionLoading) return;
    if (!isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        setError(errorData.message || `Failed to fetch users: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(`Network error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowCreateModal(false);
        setCreateForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          password: '',
          role: 'editor'
        });
        await fetchUsers();
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error creating user: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !editingUser) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users?id=${editingUser.admin_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowEditModal(false);
        setEditingUser(null);
        await fetchUsers();
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error updating user: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchUsers();
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error deleting user: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (userToEdit: AdminUser) => {
    setEditingUser(userToEdit);
    setEditForm({
      first_name: userToEdit.first_name,
      last_name: userToEdit.last_name,
      email: userToEdit.email,
      phone: userToEdit.phone || '',
      role: userToEdit.role
    });
    setShowEditModal(true);
    setError(''); // Clear any existing errors
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError('');
    setCreateForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'editor'
    });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setError('');
    setEditingUser(null);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin': return 'role-super-admin';
      case 'admin': return 'role-admin';
      case 'editor': return 'role-editor';
      case 'moderator': return 'role-moderator';
      default: return 'role-editor';
    }
  };

  const formatRoleDisplay = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (sessionLoading) {
    return (
      <div className="retrieve-loading">
        <div className="loading-spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="retrieve-posts">
        <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>Authentication Required</h3>
          <p>Please log in to access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="retrieve-posts">
      {/* Header */}
      <div className="retrieve-header">
        <div className="header-left">
          <h1>Admin Users</h1>
          <div className="quick-stats">
            <div className="stat-item">Total: {users.length}</div>
            <div className="stat-item">Active: {users.filter(u => u.status === 'active').length}</div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="new-post-btn" 
            onClick={() => setShowCreateModal(true)}
            disabled={isSubmitting}
          >
            Create User
          </button>
          <button 
            className="refresh-btn" 
            onClick={fetchUsers}
            disabled={isLoading || isSubmitting}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => { setError(''); fetchUsers(); }}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="retrieve-loading">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && (
        <div className="posts-table">
          <div className="table-header">
            <div className="column-content">User Details</div>
            <div className="column-stats">Role & Activity</div>
            <div className="column-actions">Actions</div>
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
              <p>There are no admin users available.</p>
            </div>
          ) : (
            users.map(item => (
              <div key={item.admin_id} className="post-row">
                <div className="column-content">
                  <div className="post-image">
                    <div className="image-placeholder">
                      {item.first_name.charAt(0).toUpperCase()}
                      {item.last_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="post-details">
                    <h3 className="post-title">
                      {item.first_name} {item.last_name}
                    </h3>
                    <p className="post-excerpt">{item.email}</p>
                    
                    <div className="post-meta">
                      <div className="author-info">
                        {item.phone && <span>Phone: {item.phone}</span>}
                        <span className="date">
                          Joined: {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="column-stats">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className={`status-badge ${getRoleBadgeClass(item.role)}`}>
                        {formatRoleDisplay(item.role)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{item.posts_count}</span>
                      <span className="stat-label">Posts</span>
                    </div>
                    {item.last_login && (
                      <div className="stat-item">
                        <span className="stat-label">Last Login</span>
                        <span className="stat-value" style={{ fontSize: '0.7rem' }}>
                          {new Date(item.last_login).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="column-actions">
                  <div className="action-buttons">
                    <button 
                      className="action-btn edit-btn" 
                      title="Edit User"
                      onClick={() => openEditModal(item)}
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      title="Delete User"
                      disabled={user?.admin_id === item.admin_id || isSubmitting}
                      onClick={() => handleDeleteUser(item.admin_id, `${item.first_name} ${item.last_name}`)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Admin User</h3>
              <button 
                className="close-btn"
                onClick={closeCreateModal}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateUser}>
              <div className="form-grid">
                <div className="form-field">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({...createForm, first_name: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-field">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({...createForm, last_name: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label>Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="editor">Editor</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    {user?.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>
              </div>

              {error && (
                <div className="warning-message">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="confirm-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Admin User</h3>
              <button 
                className="close-btn"
                onClick={closeEditModal}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditUser}>
              <div className="form-grid">
                <div className="form-field">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-field">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field">
                  <label>Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    required
                    disabled={isSubmitting || (editingUser.admin_id === user?.admin_id && editingUser.role === 'super_admin')}
                  >
                    <option value="editor">Editor</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    {user?.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                  {editingUser.admin_id === user?.admin_id && editingUser.role === 'super_admin' && (
                    <small>You cannot change your own super admin role</small>
                  )}
                </div>
              </div>

              {error && (
                <div className="warning-message">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={closeEditModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="confirm-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
