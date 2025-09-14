/**
 * Package Reviews API - Package Review Management
 * 
 * Manages reviews and ratings for marketplace packages:
 * - List package reviews
 * - Create new reviews
 * - Update/delete user reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface RouteParams {
  params: {
    packageId: string;
  };
}

interface PackageReview {
  id: string;
  packageId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Await params to fix Next.js 15 requirement
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, oldest, rating, helpful

    // Mock reviews data - in a real implementation, this would come from the database
    const mockReviews: PackageReview[] = [
      {
        id: 'review-1',
        packageId: resolvedParams.packageId,
        userId: 'user-1',
        userName: 'John Developer',
        userAvatar: undefined,
        rating: 5,
        title: 'Excellent package!',
        content: 'This package saved me hours of work. The validation rules are comprehensive and easy to customize.',
        isVerifiedPurchase: true,
        helpfulCount: 12,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review-2',
        packageId: resolvedParams.packageId,
        userId: 'user-2',
        userName: 'Sarah Analyst',
        userAvatar: undefined,
        rating: 4,
        title: 'Good but could be better',
        content: 'Works well for basic validation. Would love to see more advanced features in future updates.',
        isVerifiedPurchase: true,
        helpfulCount: 8,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review-3',
        packageId: resolvedParams.packageId,
        userId: 'user-3',
        userName: 'Mike Tester',
        userAvatar: undefined,
        rating: 5,
        title: 'Perfect for our use case',
        content: 'Integrated seamlessly with our existing workflow. Documentation is clear and examples are helpful.',
        isVerifiedPurchase: false,
        helpfulCount: 5,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
        updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Sort reviews
    let sortedReviews = [...mockReviews];
    switch (sortBy) {
      case 'oldest':
        sortedReviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rating':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'helpful':
        sortedReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
        break;
      case 'newest':
      default:
        sortedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    // Apply pagination
    const paginatedReviews = sortedReviews.slice(offset, offset + limit);

    // Calculate review statistics
    const totalReviews = mockReviews.length;
    const averageRating = totalReviews > 0 
      ? mockReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const ratingDistribution = {
      5: mockReviews.filter(r => r.rating === 5).length,
      4: mockReviews.filter(r => r.rating === 4).length,
      3: mockReviews.filter(r => r.rating === 3).length,
      2: mockReviews.filter(r => r.rating === 2).length,
      1: mockReviews.filter(r => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      data: paginatedReviews,
      meta: {
        total: totalReviews,
        limit,
        offset,
        sortBy,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        verifiedPurchases: mockReviews.filter(r => r.isVerifiedPurchase).length
      }
    });

  } catch (error) {
    console.error('Package reviews error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch package reviews',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Await params to fix Next.js 15 requirement
    const resolvedParams = await params;
    const body = await request.json();
    
    const { rating, title, content } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'Valid rating (1-5) is required'
      }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Review title is required'
      }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Review content is required'
      }, { status: 400 });
    }

    // Mock review creation - in a real implementation, this would save to database
    const newReview: PackageReview = {
      id: 'review-' + Date.now(),
      packageId: resolvedParams.packageId,
      userId: session.user.id,
      userName: session.user.name || 'Anonymous User',
      userAvatar: session.user.image,
      rating,
      title: title.trim(),
      content: content.trim(),
      isVerifiedPurchase: false, // Would check actual purchase status
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newReview,
      message: 'Review created successfully'
    });

  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create review',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}