/**
 * Sleep Dialog - Schedule queue sleep with date/time picker
 * 
 * Features:
 * - Quick sleep options (30min, 1h, 2h, 4h, 8h)
 * - Custom date/time picker for precise scheduling
 * - Relative time input (e.g., "45 minutes", "2.5 hours")
 * - Timezone awareness
 * - Validation and error handling
 * - Integration with action system
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useActionMutation } from '@/hooks/use-action-api';
import { Moon, Clock, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

interface SleepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowData: Record<string, any>;
  action: any; // RowActionConfig type
  onSuccess?: () => void;
}

// Quick sleep options in minutes
const QUICK_OPTIONS = [
  { label: '30 min', minutes: 30, description: 'Short break' },
  { label: '1 hour', minutes: 60, description: 'Standard pause' },
  { label: '2 hours', minutes: 120, description: 'Lunch break' },
  { label: '4 hours', minutes: 240, description: 'Half day' },
  { label: '8 hours', minutes: 480, description: 'Overnight' },
  { label: '24 hours', minutes: 1440, description: 'Daily pause' }
];

type SleepMode = 'quick' | 'datetime' | 'relative';

export const SleepDialog: React.FC<SleepDialogProps> = ({
  open,
  onOpenChange,
  rowData,
  action,
  onSuccess
}) => {
  const [sleepMode, setSleepMode] = useState<SleepMode>('quick');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [relativeInput, setRelativeInput] = useState('');
  const [sleepReason, setSleepReason] = useState('');

  // Action mutation
  const updateMutation = useActionMutation(action.dialog.action, {
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSleepMode('quick');
      setSelectedMinutes(60);
      setCustomDate('');
      setCustomTime('');
      setRelativeInput('');
      setSleepReason('Scheduled maintenance');
      
      // Set default date/time to 1 hour from now
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setCustomDate(oneHourLater.toISOString().split('T')[0]);
      setCustomTime(oneHourLater.toTimeString().slice(0, 5));
    }
  }, [open]);

  // Calculate sleep until datetime
  const calculateSleepUntil = (): Date => {
    const now = new Date();
    
    switch (sleepMode) {
      case 'quick':
        return new Date(now.getTime() + selectedMinutes * 60 * 1000);
      
      case 'datetime':
        if (customDate && customTime) {
          const sleepUntil = new Date(`${customDate}T${customTime}`);
          return sleepUntil;
        }
        return new Date(now.getTime() + 60 * 60 * 1000);
      
      case 'relative':
        const minutes = parseRelativeTime(relativeInput);
        return new Date(now.getTime() + minutes * 60 * 1000);
      
      default:
        return new Date(now.getTime() + 60 * 60 * 1000);
    }
  };

  // Parse relative time input like "45 minutes", "2.5 hours", "1d"
  const parseRelativeTime = (input: string): number => {
    const trimmed = input.trim().toLowerCase();
    
    // Match patterns like "45 minutes", "2.5 hours", "1d", "30m"
    const patterns = [
      { regex: /^(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)$/i, multiplier: 1 },
      { regex: /^(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)$/i, multiplier: 60 },
      { regex: /^(\d+(?:\.\d+)?)\s*(?:days?|d)$/i, multiplier: 1440 }
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern.regex);
      if (match) {
        const value = parseFloat(match[1]);
        return Math.round(value * pattern.multiplier);
      }
    }

    // Default to 60 minutes if can't parse
    return 60;
  };

  // Validate inputs
  const isValid = (): boolean => {
    const sleepUntil = calculateSleepUntil();
    const now = new Date();
    
    // Must be in the future
    if (sleepUntil <= now) return false;
    
    // Must be within reasonable limits (max 30 days)
    const maxSleep = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (sleepUntil > maxSleep) return false;
    
    return true;
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!isValid()) return;
    
    const sleepUntil = calculateSleepUntil();
    
    try {
      await updateMutation.mutateAsync({
        id: rowData.id,
        updates: {
          status: 'sleeping',
          sleepUntil: sleepUntil.toISOString(),
          pauseReason: sleepReason || 'Scheduled sleep'
        }
      });
    } catch (error) {
      console.error('Failed to schedule sleep:', error);
    }
  };

  // Format display time
  const formatSleepUntil = (): string => {
    const sleepUntil = calculateSleepUntil();
    const now = new Date();
    const diffMs = sleepUntil.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (60 * 1000));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    } else if (diffMinutes < 1440) {
      const hours = Math.round(diffMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(diffMinutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-blue-600" />
            Sleep Queue: {rowData.name || rowData.displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sleep Mode Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <Button
              size="sm"
              variant={sleepMode === 'quick' ? 'default' : 'ghost'}
              onClick={() => setSleepMode('quick')}
              className="flex-1"
            >
              <Zap className="h-3 w-3 mr-1" />
              Quick
            </Button>
            <Button
              size="sm"
              variant={sleepMode === 'datetime' ? 'default' : 'ghost'}
              onClick={() => setSleepMode('datetime')}
              className="flex-1"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Date/Time
            </Button>
            <Button
              size="sm"
              variant={sleepMode === 'relative' ? 'default' : 'ghost'}
              onClick={() => setSleepMode('relative')}
              className="flex-1"
            >
              <Clock className="h-3 w-3 mr-1" />
              Relative
            </Button>
          </div>

          {/* Quick Options */}
          {sleepMode === 'quick' && (
            <div className="space-y-3">
              <Label>Quick Sleep Options</Label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_OPTIONS.map((option) => (
                  <Button
                    key={option.minutes}
                    size="sm"
                    variant={selectedMinutes === option.minutes ? 'default' : 'outline'}
                    onClick={() => setSelectedMinutes(option.minutes)}
                    className="flex flex-col h-auto py-3"
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs opacity-70">{option.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Date/Time Picker */}
          {sleepMode === 'datetime' && (
            <div className="space-y-3">
              <Label>Sleep Until</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sleep-date" className="text-xs">Date</Label>
                  <Input
                    id="sleep-date"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sleep-time" className="text-xs">Time</Label>
                  <Input
                    id="sleep-time"
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Relative Time Input */}
          {sleepMode === 'relative' && (
            <div className="space-y-3">
              <Label htmlFor="relative-time">Sleep Duration</Label>
              <Input
                id="relative-time"
                placeholder="e.g., 45 minutes, 2.5 hours, 1d"
                value={relativeInput}
                onChange={(e) => setRelativeInput(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Examples: 30m, 1.5h, 45 minutes, 2 hours, 1 day
              </p>
            </div>
          )}

          {/* Sleep Reason */}
          <div className="space-y-2">
            <Label htmlFor="sleep-reason">Reason (Optional)</Label>
            <Input
              id="sleep-reason"
              placeholder="e.g., Scheduled maintenance"
              value={sleepReason}
              onChange={(e) => setSleepReason(e.target.value)}
            />
          </div>

          {/* Summary */}
          {isValid() && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Will sleep for: 
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatSleepUntil()}
                </Badge>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Queue will resume at {calculateSleepUntil().toLocaleString()}
              </p>
            </div>
          )}

          {!isValid() && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                Please select a valid future time within 30 days.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid() || updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateMutation.isPending ? (
              <>
                <Moon className="h-4 w-4 mr-2 animate-pulse" />
                Scheduling...
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Schedule Sleep
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
