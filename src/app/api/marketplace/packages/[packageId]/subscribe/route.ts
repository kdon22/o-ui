/**
 * Package Subscription API - Subscribe to Marketplace Packages
 * 
 * Handles:
 * - Package subscription creation
 * - Billing system integration
 * - License validation
 * - Usage-based subscription setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient, BranchContext } from '@/lib/action-client';

interface RouteParams {
  params: {
    packageId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: 'main',
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(session.user.tenantId);

    // Get the package details
    const packageResult = await actionClient.executeAction({
      action: 'marketplacePackages.getById',
      data: { id: params.packageId },
      branchContext
    });

    if (!packageResult.data) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const pkg = packageResult.data;

    // Check access control
    const hasAccess = (
      pkg.isPublic ||
      pkg.tenantId === tenantId ||
      pkg.allowedTenants.includes(tenantId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this package' }, { status: 403 });
    }

    // Check if already subscribed
    const existingSubscription = await actionClient.executeAction({
      action: 'packageSubscriptions.list',
      data: {
        filters: {
          packageId: params.packageId,
          userId: session.user.id,
          tenantId: tenantId,
          status: 'active'
        }
      },
      branchContext
    });

    if (existingSubscription.data?.length > 0) {
      return NextResponse.json(
        { error: 'Already subscribed to this package' },
        { status: 400 }
      );
    }

    // Handle free packages
    if (pkg.licenseType === 'FREE') {
      const subscription = await actionClient.executeAction({
        action: 'packageSubscriptions.create',
        data: {
          packageId: params.packageId,
          userId: session.user.id,
          tenantId: tenantId,
          status: 'active',
          licenseType: 'FREE',
          price: 0,
          autoRenew: false,
          startDate: new Date().toISOString()
        },
        branchContext
      });

      return NextResponse.json({
        success: true,
        data: subscription.data,
        message: 'Successfully subscribed to free package'
      });
    }

    // Handle paid packages - integrate with billing system
    let billingItemId: string | null = null;
    let nextBillingDate: Date | null = null;

    if (pkg.licenseType === 'SUBSCRIPTION') {
      // TODO: Integrate with your billing system here
      // This would create a recurring billing item
      // billingItemId = await createBillingItem({
      //   userId: session.user.id,
      //   tenantId: tenantId,
      //   amount: pkg.price,
      //   interval: pkg.subscriptionInterval,
      //   description: `Marketplace Package: ${pkg.name}`
      // });

      // Calculate next billing date
      const now = new Date();
      switch (pkg.subscriptionInterval) {
        case 'monthly':
          nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          break;
        case 'quarterly':
          nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
          break;
        case 'yearly':
          nextBillingDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
          break;
      }
    }

    // Create the subscription
    const subscriptionData = {
      packageId: params.packageId,
      userId: session.user.id,
      tenantId: tenantId,
      status: 'active',
      licenseType: pkg.licenseType,
      billingItemId,
      price: pkg.price || 0,
      interval: pkg.subscriptionInterval,
      usageCount: 0,
      usageLimit: body.usageLimit || null,
      autoRenew: body.autoRenew !== false, // Default to true
      startDate: new Date().toISOString(),
      nextBillingDate: nextBillingDate?.toISOString()
    };

    const subscription = await actionClient.executeAction({
      action: 'packageSubscriptions.create',
      data: subscriptionData,
      branchContext
    });

    // Create initial payment transaction for paid packages
    if (pkg.licenseType !== 'FREE' && pkg.price > 0) {
      await actionClient.executeAction({
        action: 'paymentTransactions.create',
        data: {
          packageId: params.packageId,
          subscriptionId: subscription.data.id,
          userId: session.user.id,
          tenantId: tenantId,
          type: pkg.licenseType === 'ONE_TIME' ? 'one_time' : 'subscription',
          status: 'completed', // Assuming billing system handles payment
          amount: pkg.price,
          currency: 'USD',
          billingTransactionId: billingItemId,
          description: `Subscription to ${pkg.name}`
        },
        branchContext
      });
    }

    // Update package metrics
    await actionClient.executeAction({
      action: 'marketplacePackages.update',
      data: {
        id: params.packageId,
        updates: {
          downloadCount: pkg.downloadCount + 1
        }
      },
      branchContext
    });

    return NextResponse.json({
      success: true,
      data: subscription.data,
      message: 'Successfully subscribed to package'
    });

  } catch (error) {
    console.error('Error subscribing to package:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to package' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: 'main',
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(session.user.tenantId);

    // Find the active subscription
    const subscriptions = await actionClient.executeAction({
      action: 'packageSubscriptions.list',
      data: {
        filters: {
          packageId: params.packageId,
          userId: session.user.id,
          tenantId: tenantId,
          status: 'active'
        }
      },
      branchContext
    });

    if (!subscriptions.data?.length) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const subscription = subscriptions.data[0];

    // Cancel the subscription
    await actionClient.executeAction({
      action: 'packageSubscriptions.update',
      data: {
        id: subscription.id,
        updates: {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelReason: 'User requested cancellation',
          autoRenew: false
        }
      },
      branchContext
    });

    // TODO: Cancel billing item in your billing system
    // if (subscription.billingItemId) {
    //   await cancelBillingItem(subscription.billingItemId);
    // }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
