// app/client/articles/[slug]/layout.tsx
import { ReactNode } from 'react';

// This tells Next.js to use dynamic rendering for unmatched slugs
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only generate static params in production builds
  if (process.env.NEXT_PUBLIC_SKIP_STATIC_GENERATION === 'true') {
    console.log('Skipping static generation for articles');
    return [];
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    console.log(`Fetching article slugs from: ${apiUrl}/api/articles/slugs`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${apiUrl}/api/articles/slugs`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch article slugs: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const slugs = Array.isArray(data) ? data : data.slugs || [];
    
    console.log(`Generated ${slugs.length} article paths`);
    
    return slugs.map((item: any) => ({
      slug: typeof item === 'string' ? item : item.slug,
    }));
    
  } catch (error) {
    console.warn('Failed to generate static article params:', error);
    // Return empty array - all pages will be generated on-demand
    return [];
  }
}

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}