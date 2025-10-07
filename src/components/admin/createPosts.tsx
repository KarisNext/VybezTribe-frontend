'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@/components/includes/Session';

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

const CreatePosts: React.FC = () => {
  const { user, csrfToken } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
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
    image_file: null
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: fileInput.files?.[0] || null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Enhanced formatting functions with improved editing capability
  const wrapText = (tag: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let wrappedText = '';
    let placeholderText = '';
    
    switch(tag) {
      case 'QUOTE':
        placeholderText = 'Your quote here';
        break;
      case 'HIGHLIGHT':
        placeholderText = 'Important text';
        break;
      case 'BOLD':
        placeholderText = 'Bold text';
        break;
      case 'ITALIC':
        placeholderText = 'Italic text';
        break;
      case 'HEADING':
        placeholderText = 'Heading text';
        break;
      default:
        placeholderText = 'Text';
    }
    
    wrappedText = `[${tag}]${selectedText || placeholderText}[/${tag}]`;
    
    const newContent = 
      textarea.value.substring(0, start) + 
      wrappedText + 
      textarea.value.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      if (!selectedText) {
        // Select the placeholder text so user can immediately type
        const newStart = start + tag.length + 2;
        const newEnd = newStart + placeholderText.length;
        textarea.setSelectionRange(newStart, newEnd);
      } else {
        const newCursorPos = start + wrappedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Quick remove formatting
  const removeFormatting = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    // Remove all formatting tags from selected text
    const cleanedText = selectedText
      .replace(/\[(QUOTE|HIGHLIGHT|BOLD|ITALIC|HEADING)\]/g, '')
      .replace(/\[\/(QUOTE|HIGHLIGHT|BOLD|ITALIC|HEADING)\]/g, '');
    
    const newContent = 
      textarea.value.substring(0, start) + 
      cleanedText + 
      textarea.value.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + cleanedText.length);
    }, 0);
  };

  // Insert line break
  const insertLineBreak = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const newContent = 
      textarea.value.substring(0, start) + 
      '\n\n' + 
      textarea.value.substring(start);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const submitFormData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'image_file' && value) {
          submitFormData.append('image', value);
        } else if (value !== null) {
          submitFormData.append(key, value.toString());
        }
      });
      
      submitFormData.append('status', status);
      submitFormData.append('author_id', user.admin_id.toString());

      const response = await fetch('/api/createposts', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: submitFormData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: `News ${status} successfully! Article ID: ${result.news?.news_id || 'N/A'}` });
        setFormData({
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
          image_file: null
        });
        
        const fileInput = document.getElementById('image_file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to create news' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreviewContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      let processedParagraph = paragraph
        .replace(/\[QUOTE\](.*?)\[\/QUOTE\]/g, '<span class="preview-quote">$1</span>')
        .replace(/\[HIGHLIGHT\](.*?)\[\/HIGHLIGHT\]/g, '<span class="preview-highlight">$1</span>')
        .replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
        .replace(/\[ITALIC\](.*?)\[\/ITALIC\]/g, '<em>$1</em>')
        .replace(/\[HEADING\](.*?)\[\/HEADING\]/g, '<span class="preview-heading">$1</span>');
      
      return (
        <p 
          key={index}
          dangerouslySetInnerHTML={{ __html: processedParagraph }}
        />
      );
    });
  };

  if (isLoading) {
    return (
      <div className="create-posts-loading">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="create-posts">
      <div className="create-posts-header">
        <h1>Create New Post</h1>
        <div className="header-info">
          <span>Author: {user?.first_name} {user?.last_name}</span>
          <span className="author-id">ID: {user?.admin_id}</span>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'draft')} className="create-form">
        <div className="form-grid">
          <div className="form-column-left">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={200}
                placeholder="Enter post title..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="excerpt">Excerpt</label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief summary of the post..."
                maxLength={500}
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Main Content</label>
              
              {/* Enhanced Content Editor Toolbar */}
              <div className="content-editor-toolbar">
                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() => wrapText('BOLD')}
                    className="toolbar-btn"
                    title="Bold Text"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapText('ITALIC')}
                    className="toolbar-btn"
                    title="Italic Text"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapText('HEADING')}
                    className="toolbar-btn"
                    title="Insert Heading"
                  >
                    H
                  </button>
                </div>
                
                <div className="toolbar-divider"></div>
                
                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() => wrapText('QUOTE')}
                    className="toolbar-btn toolbar-btn-special"
                    title="Insert Large Quote"
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapText('HIGHLIGHT')}
                    className="toolbar-btn toolbar-btn-special"
                    title="Highlight Important Text"
                  >
                    Highlight
                  </button>
                </div>
                
                <div className="toolbar-divider"></div>
                
                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={insertLineBreak}
                    className="toolbar-btn"
                    title="Insert Line Break"
                  >
                    Para
                  </button>
                  <button
                    type="button"
                    onClick={removeFormatting}
                    className="toolbar-btn toolbar-btn-remove"
                    title="Remove Formatting from Selection"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="toolbar-info">
                  <small>
                    Select text and click buttons to format • Use Clear to remove formatting
                  </small>
                </div>
              </div>

              <textarea
                ref={contentRef}
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={18}
                required
                placeholder="Write your post content here...

Tips:
- Select text and click formatting buttons
- [QUOTE]text[/QUOTE] for large quotes
- [HIGHLIGHT]text[/HIGHLIGHT] for important text
- [BOLD]text[/BOLD] for bold
- [ITALIC]text[/ITALIC] for italic
- [HEADING]text[/HEADING] for headings
- Use Clear button to remove formatting from selected text"
                className="content-editor"
              />
              
              {/* Enhanced Preview area */}
              {formData.content && (
                <div className="content-preview">
                  <div className="preview-header">
                    <h4>Live Preview:</h4>
                    <span className="preview-note">This is how your content will appear</span>
                  </div>
                  <div className="preview-content">
                    {renderPreviewContent(formData.content)}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="politics, news, kenya (comma separated)"
              />
            </div>
          </div>

          <div className="form-column-right">
            <div className="form-group">
              <label htmlFor="category_id">Category</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority (Headlines Type)</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="high">High Value (Hot Headlines)</option>
                <option value="medium">Medium</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                />
                <span>Featured Post</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="image_file">Featured Image</label>
              <input
                type="file"
                id="image_file"
                name="image_file"
                onChange={handleInputChange}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="file-input"
              />
              <small>Max size: 5MB. Formats: JPG, PNG, WebP</small>
            </div>

            <div className="form-group">
              <label htmlFor="youtube_url">YouTube Video URL</label>
              <input
                type="url"
                id="youtube_url"
                name="youtube_url"
                value={formData.youtube_url}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="meta_description">Meta Description (SEO)</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleInputChange}
                rows={3}
                maxLength={160}
                placeholder="SEO meta description..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="seo_keywords">SEO Keywords</label>
              <input
                type="text"
                id="seo_keywords"
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleInputChange}
                placeholder="kenya news, politics, economy"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={isSubmitting}
            className="btn btn-outline"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      </form>

    </div>
  );
};

export default CreatePosts;
