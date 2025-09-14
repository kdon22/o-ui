/**
 * Branch Identity Utilities
 *
 * Single source of truth for:
 * - Base identity of entities (CoW-aware)
 * - Lineage keys for junctions
 * - Deterministic tie-break for overlay winner selection
 */

export interface BranchContextLite {
	currentBranchId?: string
	defaultBranchId?: string
}

/**
 * Returns the first available original*Id (e.g., originalRuleId, originalProcessId),
 * then falls back to generic originalId, else undefined.
 */
export function getOriginalAnyId(entity: Record<string, any> | null | undefined): string | undefined {
	if (!entity || typeof entity !== 'object') return undefined
	if (typeof (entity as any).originalId === 'string') return (entity as any).originalId
	const originalKey = Object.keys(entity).find(k => k.startsWith('original') && k.endsWith('Id') && typeof (entity as any)[k] === 'string')
	return originalKey ? (entity as any)[originalKey] : undefined
}

/**
 * Canonical base identity for CoW lineages: original*Id if present, else id.
 */
export function getBaseId(entity: { id: string } & Record<string, any>): string {
	const original = getOriginalAnyId(entity)
	return original || entity.id
}

/**
 * Lineage key for junctions by store name.
 * Uses base identities so overlays treat branched clones as one lineage.
 */
export function getJunctionLineageKey(storeName: string, record: Record<string, any>): string {
	const safe = (v: any) => String(v ?? '')
	switch (storeName) {
		case 'processRules':
			return `${safe(record.processBaseId ?? record.processId)}:${safe(record.ruleBaseId ?? record.ruleId)}`
		case 'nodeProcesses':
			return `${safe(record.nodeBaseId ?? record.nodeId)}:${safe(record.processBaseId ?? record.processId)}`
		case 'ruleIgnores':
			return `${safe(record.nodeBaseId ?? record.nodeId)}:${safe(record.ruleBaseId ?? record.ruleId)}`
		default: {
			// Fallback: if precomputed lineage exists, use it; otherwise use id/baseId
			if (record.__lineageKey) return String(record.__lineageKey)
			const base = (record && typeof record === 'object' && 'id' in record)
				? getBaseId(record as any)
				: String(record)
			return base
		}
	}
}

/**
 * Deterministic tie-breaker: updatedAt desc -> createdAt desc -> id asc
 */
export function tieBreakCompare(a: any, b: any): number {
	const aUpdated = toTimestamp(a?.updatedAt)
	const bUpdated = toTimestamp(b?.updatedAt)
	if (aUpdated !== bUpdated) return bUpdated - aUpdated
	const aCreated = toTimestamp(a?.createdAt)
	const bCreated = toTimestamp(b?.createdAt)
	if (aCreated !== bCreated) return bCreated - aCreated
	const aId = String(a?.id ?? '')
	const bId = String(b?.id ?? '')
	return aId.localeCompare(bId)
}

function toTimestamp(val: any): number {
	if (!val) return 0
	if (typeof val === 'number') return val
	const t = Date.parse(val)
	return isNaN(t) ? 0 : t
}

/**
 * Returns overlay score for branch selection: current(3) > default(2) > unscoped(1)
 */
export function branchScore(rec: any, ctx?: BranchContextLite): number {
	const bid = rec?.branchId
	if (!bid) return 1
	if (ctx?.currentBranchId && bid === ctx.currentBranchId) return 3
	if (ctx?.defaultBranchId && bid === ctx.defaultBranchId) return 2
	return 1
}


