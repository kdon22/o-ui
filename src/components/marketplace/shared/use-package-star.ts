/**
 * usePackageStar Hook - Reusable Star/Unstar Logic
 * 
 * Eliminates duplication of star mutation logic across marketplace components.
 * Provides consistent star/unstar functionality with proper cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/hooks/useToast';

interface UsePackageStarOptions {
  /**
   * Additional query keys to invalidate after starring/unstarring
   */
  additionalInvalidationKeys?: string[][];
}

export function usePackageStar(options: UsePackageStarOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { additionalInvalidationKeys = [] } = options;

  const starMutation = useMutation({
    mutationFn: async ({ packageId, starred }: { packageId: string; starred: boolean }) => {
      const response = await fetch(`/api/marketplace/packages/${packageId}/star`, {
        method: starred ? 'POST' : 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to update star status');
      return response.json();
    },
    onSuccess: (_, { starred }) => {
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update star status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleStar = (packageId: string, currentlyStarred: boolean) => {
    starMutation.mutate({ packageId, starred: !currentlyStarred });
  };

  return {
    handleStar,
    isStarring: starMutation.isPending,
    starError: starMutation.error,
  };
}
