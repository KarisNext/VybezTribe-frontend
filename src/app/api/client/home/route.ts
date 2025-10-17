// app/api/client/home/route.ts - FIXED TO USE CORRECT ENDPOINTS
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://vybeztribe.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    console.log('Home API called with type:', type);

    switch (type) {
      case 'breaking':
        return getBreakingNews(request);
      case 'featured':
        return getFeaturedNews(request);
      case 'trending':
        return getTrendingNews(request);
      case 'categories':
        return getCategories(request);
      case 'category-preview':
        return getCategoryPreview(request);
      case 'all':
      default:
        return getAllHomeContent(request);
    }

  } catch (error) {
    console.error('Home API route error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// FIXED: Use news.js breaking endpoint (it works, just has wrong author table)
// OR use featured from categories as temporary solution
async function getBreakingNews(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';
  
  // Option 1: Still use news/breaking but be aware of author issues
  const backendUrl = `${BACKEND_URL}/api/news/breaking?limit=${limit}`;
  
  const response = await fetch(backendUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || ''
    }
  });

  if (!response.ok) {
    throw new Error(`Breaking news fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return NextResponse.json({
    success: true,
    breaking_news: data.breaking_news || data.news || [],
    total: data.total || 0
  });
}

// FIXED: Use news.js featured endpoint
async function getFeaturedNews(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';
  
  const backendUrl = `${BACKEND_URL}/api/news/featured?limit=${limit}`;
  
  const response = await fetch(backendUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || ''
    }
  });

  if (!response.ok) {
    throw new Error(`Featured news fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return NextResponse.json({
    success: true,
    featured_news: data.featured_news || data.news || [],
    total: data.total || 0
  });
}

// FIXED: Use news.js trending endpoint
async function getTrendingNews(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';
  
  const backendUrl = `${BACKEND_URL}/api/news/trending?limit=${limit}`;
  
  const response = await fetch(backendUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || ''
    }
  });

  if (!response.ok) {
    throw new Error(`Trending news fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return NextResponse.json({
    success: true,
    trending_news: data.trending_news || data.news || [],
    total: data.total || 0
  });
}

// FIXED: Use news.js categories endpoint
async function getCategories(request: NextRequest) {
  const backendUrl = `${BACKEND_URL}/api/news/categories`;
  
  const response = await fetch(backendUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || ''
    }
  });

  if (!response.ok) {
    throw new Error(`Categories fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return NextResponse.json({
    success: true,
    categories: data.categories || [],
    total: data.categories?.length || 0
  });
}

// FIXED: Use categories.js endpoint instead of news.js
async function getCategoryPreview(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = searchParams.get('limit') || '4';
  
  if (!category) {
    return NextResponse.json({
      success: false,
      message: 'Category parameter required'
    }, { status: 400 });
  }
  
  // CRITICAL FIX: Use categories.js endpoint which uses admins table
  const backendUrl = `${BACKEND_URL}/api/categories/${category}/news?limit=${limit}`;
  
  const response = await fetch(backendUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || ''
    }
  });

  if (!response.ok) {
    throw new Error(`Category preview fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return NextResponse.json({
    success: true,
    category: data.category,
    news: data.news || [],
    total: data.news?.length || 0
  });
}

// CRITICAL FIX: Use categories.js for category previews
async function getAllHomeContent(request: NextRequest) {
  try {
    // Fetch breaking, featured, and categories in parallel
    const [breakingRes, featuredRes, categoriesRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/news/breaking?limit=10`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        }
      }),
      fetch(`${BACKEND_URL}/api/news/featured?limit=10`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        }
      }),
      fetch(`${BACKEND_URL}/api/news/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        }
      })
    ]);

    const breaking = breakingRes.ok ? await breakingRes.json() : { breaking_news: [] };
    const featured = featuredRes.ok ? await featuredRes.json() : { featured_news: [] };
    const categories = categoriesRes.ok ? await categoriesRes.json() : { categories: [] };

    // CRITICAL FIX: Get category previews using categories.js endpoints (which use admins table)
    const categoryPreviews: { [key: string]: any[] } = {};
    const mainCategories = ['politics', 'counties', 'opinion', 'business', 'sports', 'technology'];
    
    for (const categorySlug of mainCategories) {
      try {
        // Use categories.js endpoint instead of news.js
        const categoryRes = await fetch(
          `${BACKEND_URL}/api/categories/${categorySlug}/news?limit=4`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            }
          }
        );
        
        if (categoryRes.ok) {
          const categoryData = await categoryRes.json();
          categoryPreviews[categorySlug] = categoryData.news || [];
        } else {
          console.warn(`Failed to fetch ${categorySlug}: ${categoryRes.status}`);
          categoryPreviews[categorySlug] = [];
        }
      } catch (err) {
        console.error(`Failed to fetch ${categorySlug} preview:`, err);
        categoryPreviews[categorySlug] = [];
      }
    }

    return NextResponse.json({
      success: true,
      breaking_news: breaking.breaking_news || breaking.news || [],
      featured_news: featured.featured_news || featured.news || [],
      categories: categories.categories || [],
      category_previews: categoryPreviews,
      totals: {
        breaking: breaking.breaking_news?.length || 0,
        featured: featured.featured_news?.length || 0,
        categories: categories.categories?.length || 0
      }
    });

  } catch (error) {
    console.error('All home content fetch error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'track_visit':
        return NextResponse.json({ success: true, message: 'Visit tracked' });
      
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Home API POST error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
