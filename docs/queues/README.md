# Queue System - Developer Guide

This document explains the Queue subsystem end-to-end: schema, actions, UI, and metrics.

## Overview

- QueueConfig: defines a queue and its operational parameters
- QueueMessage: represents a job enqueued/processed
- QueueMessageHistory: append-only status transitions

The UI provides:
- Queues list at `/queues`
- Activity dashboard at `/queues/activity`
- Live work view at `/queues/work`

## Prisma Schema

Key models and enums (see `prisma/schema.prisma`):
- `QueueType`: POSTGRES, REDIS, KAFKA, RABBITMQ, SQS
- `QueueConfigStatus`: active, paused, sleeping
- `QueueOwnerType`: PROCESS, WORKFLOW
- `QueueConfig` fields: operational metadata (status, sleepUntil, ownerType/ownerId, SLA, capacity, concurrency, pauseReason) and soft-delete (isDeleted, deletedAt, deletedById)
- `QueueMessage` fields: type, data, metadata, tenantId, status, priority, scheduling/lock times, retryCount/nextRetryAt, lastError, relations to `QueueConfig` and `ProcessExecution`
- `QueueMessageHistory` fields: messageId, status, processedAt, processorId, error

Indexes are set for common read patterns (status, priority, createdAt, scheduledAt, queueConfigId, tenantId).

## Seeding

`prisma/seed.ts` creates:
- RetryPolicy
- QueueConfig `primary-queue` with SLA and concurrency
- Example ProcessExecution (for linkage)
- QueueMessage samples (completed, in_progress, queued, failed)
- QueueMessageHistory records per message

Run:
```
npx prisma db push --force-reset --accept-data-loss --schema=prisma/schema.prisma
npx prisma db seed --schema=prisma/schema.prisma
```

## Resource Schemas & Actions

`o-ui/src/features/queues/queues.schema.ts` defines two server-only resources:
- `queues` -> `QueueConfig`
- `queueMessages` -> `QueueMessage`

Auto-generated actions via Resource Registry:
- `queues.list|read|create|update|delete`
- `queueMessages.list|read|update`

Use `useActionQuery`/`useActionMutation` to interact:
- Reads: `useActionQuery('queueMessages.list', { filters: {...} }, { skipCache: true })`
- Writes (update): `useActionMutation('queueMessages.update')`

## Activity Dashboard (`/queues/activity`)

Features:
- Live refresh (5s for messages, 15s for configs), focus-aware refresh on window focus
- Range selector: 7/14/30/60 days (filters createdAt)
- Filters: by Queue (including Unassigned) and Status
- Metrics:
  - Totals by status (queued, in_progress, completed, failed, cancelled)
  - Scheduled backlog (future scheduledAt)
  - Retries, Locked count
  - Processing time stats: Average and P95 (createdAt -> processedAt)
  - Average Lock Age (for stuck items)
  - Per-Queue table: total, completed, failed, success %, avg/P95 processing, retries, SLA breaches, SLA % (uses `QueueConfig.slaTargetMinutes`)
  - Throughput (completed per day, last 14 days bar-by-width)
- CSV Export: per-queue metrics including SLA and processing stats

Implementation notes:
- Queries: `queues.list`, `queueMessages.list`
- Client-side computation for flexibility and zero server coupling
- All computations are O(n) per render; with 5s polling, keep datasets reasonable

## Work View (`/queues/work`)

- Lists live messages via `queueMessages.list`
- Updates status using `queueMessages.update`:
  - Requeue -> `{ status: 'queued', lockedBy: null, lockedAt: null }`
  - Cancel -> `{ status: 'cancelled' }`
  - Force Timeout -> `{ status: 'failed', lastError: 'Forced timeout' }`

## Best Practices: Live Refresh

- Live polling at 5–15s is acceptable for small-to-medium datasets; avoid sub-second polling
- Use `refetchOnWindowFocus` to refresh when the user returns
- Consider server pagination for `queueMessages.list` if volume grows
- If throughput is high, add server-side aggregations (e.g., API for metrics) to reduce client compute

## Extensibility

- Add server filters to `queueMessages.list` (status, queueConfigId) to reduce payload
- Introduce worker heartbeat and compute lock staleness
- Implement pause/sleep controls for queues via `queues.update`
- Add webhooks/notifications for failures and SLA breaches

## Troubleshooting

- If queries return empty: verify seed ran and tenant/session context is present
- If UI doesn’t update: check polling options and network tab for action responses
- Validate enums/fields in `queues.schema.ts` align with Prisma enums

## File Map

- Prisma: `prisma/schema.prisma` (QueueConfig/Message/History, enums)
- Seed: `prisma/seed.ts` (queue data)
- UI schemas: `o-ui/src/features/queues/queues.schema.ts`
- Activity: `o-ui/src/app/(main)/queues/activity/page.tsx`
- Work: `o-ui/src/app/(main)/queues/work/page.tsx`
- Registry: `o-ui/src/lib/resource-system/resource-registry.ts`

## Security & Multi-Tenant

- All actions are tenant-scoped. `useActionQuery` passes `tenantId` and `branchContext` automatically.
- Queue resources are marked `serverOnly` and `notHasBranchContext` in schemas.
