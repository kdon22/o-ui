/**
 * usePackageStar Hook - Reusable Star/Unstar Logic
 *
 * Updated to use useActionMutation from the action-system for consistency.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/hooks/use-action-api';
import { useToast } from '@/components/ui/hooks/useToast';

interface UsePackageStarOptions {
    additionalInvalidationKeys?: string[][];
}

export function usePackageStar(options: UsePackageStarOptions = {}) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { additionalInvalidationKeys = [] } = options;

    const starMutation = useActionMutation('marketplacePackages.update', {
        ...( { skipCache: true } as any ),
        onSuccess: (_result: any, variables: any) => {
            const starred = Boolean((variables as any)?.isStarred);
            // Standard invalidations that all components need
            queryClient.invalidateQueries({ queryKey: ['marketplace-starred'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-packages'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-discovery'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-user-data'] });

            // Component-specific invalidations
            additionalInvalidationKeys.forEach(queryKey => {
                queryClient.invalidateQueries({ queryKey });
            });

            toast({
                title: starred ? 'Package starred' : 'Package unstarred',
                description: starred ? 'Added to your starred packages' : 'Removed from starred packages',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to update star status. Please try again.',
                variant: 'destructive',
            });
        },
    });

    const handleStar = (packageId: string, currentlyStarred: boolean) => {
        starMutation.mutate({ id: packageId, isStarred: !currentlyStarred } as any);
    };

    return {
        handleStar,
        isStarring: (starMutation as any).isPending as boolean,
        starError: (starMutation as any).error as Error | null,
    };
}
