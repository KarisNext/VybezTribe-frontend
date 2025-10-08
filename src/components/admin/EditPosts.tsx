// File: frontend/src/components/admin/EditPosts.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/includes/Session';
import { useRouter } from 'next/navigation';
import {
  FileUp,
  Image,
  Tag,
  Book,
  Youtube,
  Trash,
  Check,
  Pencil,
  Eye,
  Star,
  Globe,
} from 'lucide-react';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://vybeztribe.com'
  : 'http://localhost:5000';

interface Category {
  category_id: number;
  name: string;
  slug: string;
}

interface NewsFormData {
  title: string;
  content: string;
  excerpt: string;
  category_id: string;
  priority: 'high' | 'medium' | 'short';
  featured: boolean;
  tags: string;
  meta_description: string;
  seo_keywords: string;
  youtube_url: string;
  image_file: File | null;
}

interface PostData {
  title: string;
  content: string;
  excerpt: string;
  category_id: number;
  priority: 'high' | 'medium' | 'short';
  featured: boolean;
  tags: string;
  meta_description: string;
  seo_keywords: string;
  youtube_url: string;
  image_url: string | null;
}

interface ApiResponse {
  news: PostData;
}

interface CategoriesResponse {
  categories: Category[];
}

// Props interface for EditPosts component - NOW WITH onBack
interface EditPostsProps {
  newsId: number;
  onBack?: () => void;
}

const EditPosts: React.FC<EditPostsProps> = ({ newsId, onBack }) => {
  const { user, csrfToken } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [initialData, setInitialData] = useState<NewsFormData | null>(null);
  
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    priority: 'medium',
    featured: false,
    tags: '',
    meta_description: '',
    seo_keywords: '',
    youtube_url: '',
    image_file: null,
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState<boolean>(false);

  // Memoize the API calls for fetching data
  const memoizedFetch = useCallback(
    async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
          ...options.headers,
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      return response.json() as Promise<T>;
    },
    [csrfToken],
  );

  // Fetch initial post data and categories
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!user || !csrfToken) {
        router.push('/auth/login');
        return;
      }
      setIsLoading(true);
      try {
        const [postData, categoriesData] = await Promise.all([
          memoizedFetch<ApiResponse>(`${API_BASE_URL}/api/admin/edit?id=${newsId}`),
          memoizedFetch<CategoriesResponse>(`${API_BASE_URL}/api/admin/categories`),
        ]);

        const post = postData.news;
        if (!post) {
          throw new Error('Post not found');
        }

        const formattedData: NewsFormData = {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          category_id: post.category_id.toString(),
          priority: post.priority,
          featured: post.featured,
          tags: post.tags,
          meta_description: post.meta_description,
          seo_keywords: post.seo_keywords,
          youtube_url: post.youtube_url,
          image_file: null,
        };

        setInitialData(formattedData);
        setFormData(formattedData);
        setCategories(categoriesData.categories);
        setCurrentImageUrl(post.image_url);

      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: 'Failed to load post data.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [newsId, user, csrfToken, router, memoizedFetch]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, image_file: file }));
      setImagePreviewUrl(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  // Handle image removal
  const handleRemoveImage = (): void => {
    setFormData((prev) => ({ ...prev, image_file: null }));
    setImagePreviewUrl(null);
    setCurrentImageUrl(null);
    setRemoveImage(true);
  };

  // Handle back navigation
  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!user || !csrfToken) {
      setMessage({ type: 'error', text: 'You are not authenticated.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const data = new FormData();
    data.append('news_id', newsId.toString());
    data.append('title', formData.title);
    data.append('content', formData.content);
    data.append('excerpt', formData.excerpt);
    data.append('category_id', formData.category_id);
    data.append('priority', formData.priority);
    data.append('featured', formData.featured ? 'true' : 'false');
    data.append('tags', formData.tags);
    data.append('meta_description', formData.meta_description);
    data.append('seo_keywords', formData.seo_keywords);
    data.append('youtube_url', formData.youtube_url);
    data.append('author_id', user.admin_id.toString());
    
    if (removeImage) {
      data.append('image_action', 'remove');
    } else if (formData.image_file) {
      data.append('image_file', formData.image_file);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/edit`, {
        method: 'PUT',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: data,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Post updated successfully!' });
        // Optionally navigate back after a delay
        setTimeout(() => {
          handleBack();
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update post.' });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
        <p>Loading post data...</p>
      </div>
    );
  }

  return (
    <div className="edit-posts">
      <div className="edit-posts-header">
        <h1>Edit Post</h1>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleBack}
          >
            <Pencil size={16} /> Back to Posts
          </button>
          <button
            type="submit"
            form="edit-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Post'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message-box ${message.type}`}>
          {message.text}
        </div>
      )}

      <form id="edit-form" onSubmit={handleSubmit} className="edit-form">
        <div className="form-grid">
          <div className="main-content">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="excerpt">Excerpt</label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={15}
                required
              />
            </div>
          </div>

          <div className="sidebar">
            <div className="form-group">
              <label htmlFor="category_id">Category</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
              />
              <label htmlFor="featured">Featured Post</label>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="meta_description">Meta Description</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="seo_keywords">SEO Keywords</label>
              <input
                type="text"
                id="seo_keywords"
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="youtube_url">YouTube URL</label>
              <input
                type="url"
                id="youtube_url"
                name="youtube_url"
                value={formData.youtube_url}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="image_file">Post Image</label>
              <div className="image-preview-container">
                {(imagePreviewUrl || currentImageUrl) ? (
                  <>
                    <img
                      src={imagePreviewUrl || `${API_BASE_URL}${currentImageUrl}`}
                      alt="Post Preview"
                      className="image-preview"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="remove-image-btn"
                    >
                      <Trash size={16} /> Remove
                    </button>
                  </>
                ) : (
                  <div className="image-placeholder">
                    <Image size={40} />
                    <p>No image selected</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="image_file"
                name="image_file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleBack}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPosts;
