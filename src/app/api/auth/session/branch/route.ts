import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * Update current branch in user session
 * POST /api/auth/session/branch
 */
export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('🔄 [API] POST /api/auth/session/branch called:', { timestamp });
    
    const session = await getServerSession(authOptions);
    
    console.log('🔍 [API] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      currentBranchId: session?.user?.branchContext?.currentBranchId,
      availableBranchesCount: session?.user?.branchContext?.availableBranches?.length || 0,
      timestamp
    });
    
    if (!session?.user) {
      console.error('❌ [API] Unauthorized - no session or user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestBody = await req.json();
    const { branchId } = requestBody;
    
    console.log('📥 [API] Request body:', {
      branchId,
      branchIdType: typeof branchId,
      fullRequestBody: requestBody,
      timestamp
    });
    
    if (!branchId || typeof branchId !== 'string') {
      console.error('❌ [API] Invalid branchId:', { branchId, type: typeof branchId });
      return NextResponse.json(
        { error: 'Invalid branchId' },
        { status: 400 }
      );
    }

    // Validate that the branch exists in user's available branches
    const availableBranches = session.user.branchContext?.availableBranches || [];
    const targetBranch = availableBranches.find((branch: any) => branch.id === branchId);
    
    console.log('🎯 [API] Branch validation:', {
      targetBranchId: branchId,
      availableBranchesCount: availableBranches.length,
      availableBranches: availableBranches.map((b: any) => ({ id: b.id, name: b.name })),
      targetBranchFound: !!targetBranch,
      targetBranchName: targetBranch?.name || 'NOT FOUND',
      timestamp
    });
    
    if (!targetBranch) {
      console.error('❌ [API] Branch not found or not accessible:', {
        branchId,
        availableBranchIds: availableBranches.map((b: any) => b.id),
        timestamp
      });
      return NextResponse.json(
        { error: 'Branch not found or not accessible' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Branch validation successful:', {
      oldCurrentBranchId: session.user.branchContext?.currentBranchId,
      newCurrentBranchId: branchId,
      targetBranchName: targetBranch.name,
      timestamp
    });

    // Update the server session to persist the branch change
    // This ensures the session survives NextAuth refreshes
    if (session.user.branchContext) {
      const oldBranchId = session.user.branchContext.currentBranchId;
      session.user.branchContext.currentBranchId = branchId;
      
      console.log('🔄 [API] Server session branch context updated:', {
        oldBranchId,
        newBranchId: branchId,
        branchName: targetBranch.name,
        timestamp
      });
    } else {
      console.warn('⚠️ [API] No branchContext in session to update');
    }

    const response = {
      success: true,
      branchId,
      branchName: targetBranch.name,
      message: 'Branch updated successfully in server session',
      serverSessionUpdated: true
    };

    console.log('📤 [API] Sending successful response:', {
      response,
      timestamp
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Branch session update error:', {
      error: error instanceof Error ? error.message : error,
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}