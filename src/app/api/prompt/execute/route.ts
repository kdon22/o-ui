import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { CreateExecutionRequest, CreateExecutionResponse } from '@/components/editor/components/prompt/types';

// Run on the edge and always treat as dynamic to minimize latency and avoid caching issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 🔓 Python script bypass for programmatic access
    const bypassHeader = request.headers.get('x-python-script-access');
    const shouldBypassAuth = bypassHeader === 'python-script';
    
    let userId: string;
    
    if (shouldBypassAuth) {
      // Use the admin user ID for Python script access (from seed data)
      userId = 'admin';
      
    } else {
      // Normal authentication flow
      const session = await getServerSession();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    const body: CreateExecutionRequest = await request.json();
    const { ruleName, promptNames, sessionId } = body;
    

    // Convert single prompt to array and normalize input (trim, collapse empties)
    const promptNamesArray = Array.isArray(promptNames) ? promptNames : [promptNames];
    const normalizedInput = promptNamesArray
      .map((n) => (typeof n === 'string' ? n.trim() : n))
      .filter((n): n is string => Boolean(n && typeof n === 'string'));
    

    // TODO: Get tenant ID from session/context
    const tenantId = '1BD'; // Temporary - should come from session
    

    // Find the rule by name
    
    const rule = await prisma.rule.findFirst({
      where: {
        name: ruleName,
        tenantId,
        isActive: true
      }
    });

    
    if (!rule) {
      return NextResponse.json(
        { error: `Rule '${ruleName}' not found` },
        { status: 404 }
      );
    }

    // Find all prompts for this rule using case-insensitive matching
    // Prisma does not support mode on `in`, so build OR equals filters
    const nameFilters = normalizedInput.map((name) => ({
      promptName: { equals: name, mode: 'insensitive' as const }
    }));

    const prompts = await prisma.prompt.findMany({
      where: {
        ruleId: rule.id,
        tenantId,
        OR: nameFilters
      }
    });

    
    if (prompts.length === 0) {
      return NextResponse.json(
        { error: `No prompts found for rule '${ruleName}' with names: ${normalizedInput.join(', ')}` },
        { status: 404 }
      );
    }

    // Validate that all requested prompts were found (case-insensitive)
    const foundLower = new Set(prompts.map((p) => p.promptName.toLowerCase()));
    const missingNames = normalizedInput.filter((n) => !foundLower.has(n.toLowerCase()));
    const hasPartial = missingNames.length > 0;

    // Preserve caller order
    const orderIndex: Record<string, number> = {};
    normalizedInput.forEach((name, idx) => {
      orderIndex[name.toLowerCase()] = idx;
    });
    prompts.sort((a, b) => {
      const ai = orderIndex[a.promptName.toLowerCase()] ?? 0;
      const bi = orderIndex[b.promptName.toLowerCase()] ?? 0;
      return ai - bi;
    });

    // Create the prompt execution
    
    const execution = await prisma.promptExecution.create({
      data: {
        sessionId: sessionId || `session-${Date.now()}`,
        status: 'PENDING',
        createdById: userId,
        executionUrl: `/prompt/execute/{id}`, // Will be updated with actual ID
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
      }
    });
    

    // Update execution URL with actual ID
    
    await prisma.promptExecution.update({
      where: { id: execution.id },
      data: {
        executionUrl: `/prompt/execute/${execution.id}`
      }
    });

    // Create prompt execution associations
    const promptExecutionPrompts = prompts.map((prompt, index) => ({
      promptExecId: execution.id,
      promptId: prompt.id,
      order: index + 1
    }));
    

    await prisma.promptExecutionPrompt.createMany({
      data: promptExecutionPrompts
    });
    

    const response: CreateExecutionResponse = {
      execution: {
        id: execution.id,
        status: execution.status,
        executionUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/prompt/execute/${execution.id}`,
        expiresAt: execution.expiresAt?.toISOString()
      }
    };

    // Attach warnings if any prompts were missing, but still return 200 so clients can open the page
    if (hasPartial) {
      return NextResponse.json({ ...response, warnings: { missingNames, requestedPromptNames: normalizedInput } });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error creating prompt execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}