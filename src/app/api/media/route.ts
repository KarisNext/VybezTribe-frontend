// src/app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const mockMedia = Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      type: type === 'all' ? ['image', 'video', 'gallery'][i % 3] as const : type as any,
      url: `/api/placeholder/800/600?text=Media+${i + 1}`,
      thumbnail: `/api/placeholder/300/200?text=Thumb+${i + 1}`,
      title: `Media Item ${i + 1}`,
      description: `This is a description for media item ${i + 1}`,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }));

    return NextResponse.json({
      success: true,
      media: mockMedia,
      pagination: {
        page,
        limit,
        total: 100,
        totalPages: Math.ceil(100 / limit)
      }
    });

  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}