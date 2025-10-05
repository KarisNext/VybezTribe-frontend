// app/client/categories/[slug]/layout.tsx

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.vybeztribe.com/api/categories/slugs'
      : 'http://localhost:5000/api/categories/slugs';
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 86400 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    
    const categories = await response.json();
    
    return categories.map((category: { slug: string }) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Failed to fetch category slugs:', error);
    return [
      { slug: 'politics' },
      { slug: 'business' },
      { slug: 'counties' },
      { slug: 'opinion' },
      { slug: 'sports' },
      { slug: 'technology' },
    ];
  }
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}