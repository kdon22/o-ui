"use client";

import React, { useState, useMemo } from 'react';
import { Calendar, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoModal } from '../../modal/auto-modal';
import { 
  SCHEDULE_CONFIG_SCHEMA,
  type ScheduleConfigData,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_MODAL_DATA
} from '@/features/queues/schedule-config.schema';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleBuilderProps {
  value?: string | null; // JSON string from main form
  onChange: (value: string | null) => void; // Update main form
  placeholder?: string;
  disabled?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS  
// ============================================================================

/**
 * Parse JSON string to structured schedule data
 */
function parseScheduleConfig(jsonString: string | null | undefined): ScheduleConfigData {
  if (!jsonString || jsonString.trim() === '') {
    return DEFAULT_SCHEDULE_CONFIG;
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Ensure the parsed data has the expected structure
    return {
      type: parsed.type || 'single',
      checkInterval: parsed.checkInterval || 5,
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [{
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC'
      }]
    };
  } catch (error) {
    console.warn('Failed to parse schedule config JSON, using defaults:', error);
    return DEFAULT_SCHEDULE_CONFIG;
  }
}

/**
 * Convert structured schedule data to JSON string
 */
function stringifyScheduleConfig(data: ScheduleConfigData): string {
  try {
    return JSON.stringify(data, null, 0); // Compact JSON
  } catch (error) {
    console.error('Failed to stringify schedule config:', error);
    return JSON.stringify(DEFAULT_SCHEDULE_CONFIG);
  }
}

/**
 * Generate a human-readable summary of the schedule
 */
function getScheduleSummary(data: ScheduleConfigData): string {
  if (!data.schedules || data.schedules.length === 0) {
    return 'No schedule configured';
  }
  
  const schedule = data.schedules[0]; // For now, only handle single schedule
  const dayCount = schedule.days?.length || 0;
  const interval = data.checkInterval || 5;
  
  if (dayCount === 0) {
    return `Every ${interval} minutes (no specific days)`;
  }
  
  if (dayCount === 7) {
    return `Every ${interval} minutes, daily ${schedule.startTime || '09:00'}-${schedule.endTime || '17:00'}`;
  }
  
  if (dayCount === 5 && 
      schedule.days?.includes('monday') && 
      schedule.days?.includes('tuesday') && 
      schedule.days?.includes('wednesday') && 
      schedule.days?.includes('thursday') && 
      schedule.days?.includes('friday')) {
    return `Every ${interval} minutes, weekdays ${schedule.startTime || '09:00'}-${schedule.endTime || '17:00'}`;
  }
  
  const dayNames = schedule.days?.join(', ') || 'no days';
  return `Every ${interval} minutes on ${dayNames}, ${schedule.startTime || '09:00'}-${schedule.endTime || '17:00'}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({
  value,
  onChange,
  placeholder = "Click to configure schedule",
  disabled = false
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ============================================================================
  // PARSED DATA
  // ============================================================================
  const scheduleData = useMemo(() => parseScheduleConfig(value), [value]);
  const scheduleSummary = useMemo(() => getScheduleSummary(scheduleData), [scheduleData]);
  const hasConfiguration = Boolean(value && value.trim() !== '');
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Open the schedule configuration modal
   */
  const handleOpenModal = () => {
    if (disabled) return;
    setIsModalOpen(true);
  };
  
  /**
   * Handle successful modal submission
   */
  const handleModalSuccess = (formData: Record<string, any>) => {
    // Extract days from matrix field format: { schedule: ["monday", "tuesday", ...] }
    const matrixDays = formData['schedules.0.days'];
    let selectedDays = matrixDays?.schedule || [];
    
    // Handle "All" checkbox - if selected, include all individual days
    if (selectedDays.includes('all')) {
      selectedDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    }
    // Remove 'all' from the final array since it's not a real day
    selectedDays = selectedDays.filter((day: string) => day !== 'all');
    
    // The modal form data needs to be converted to our ScheduleConfigData structure
    const scheduleConfigData: ScheduleConfigData = {
      type: formData.type || 'single',
      checkInterval: formData.checkInterval || 5,
      schedules: [{
        days: selectedDays,
        startTime: formData['schedules.0.startTime'] || '09:00',
        endTime: formData['schedules.0.endTime'] || '17:00',
        timezone: formData['schedules.0.timezone'] || 'UTC'
      }]
    };
    
    // Convert to JSON string and update main form
    const jsonString = stringifyScheduleConfig(scheduleConfigData);
    onChange(jsonString);
    
    // Close modal
    setIsModalOpen(false);
  };
  
  /**
   * Handle modal cancellation/close
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  
  /**
   * Clear the schedule configuration
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  };
  
  // ============================================================================
  // MODAL INITIAL DATA
  // ============================================================================
  
  // Convert current schedule data to modal form format
  const modalInitialData = useMemo(() => {
    if (!hasConfiguration) return DEFAULT_MODAL_DATA;
    
    const schedule = scheduleData.schedules?.[0] || {};
    const currentDays = schedule.days || [];
    
    // Check if all days are selected (should show "All" checkbox as checked)
    const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const hasAllDays = allDays.every(day => currentDays.includes(day));
    
    // If all days are selected, include "all" in the matrix selection
    const matrixDays = hasAllDays 
      ? [...currentDays, 'all'] 
      : currentDays;
    
    return {
      type: scheduleData.type || 'single',
      checkInterval: scheduleData.checkInterval || 5,
      // Matrix field expects: { schedule: ["monday", "tuesday", ...] }
      'schedules.0.days': { schedule: matrixDays },
      'schedules.0.startTime': schedule.startTime || '09:00',
      'schedules.0.endTime': schedule.endTime || '17:00', 
      'schedules.0.timezone': schedule.timezone || 'UTC'
    };
  }, [scheduleData, hasConfiguration]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <>
      {/* Schedule Builder Button */}
      <div className="space-y-2">
        <Button
          type="button"
          variant={hasConfiguration ? "secondary" : "outline"}
          size="sm"
          onClick={handleOpenModal}
          disabled={disabled}
          className="w-full justify-start text-left h-auto py-3 px-4"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {hasConfiguration ? (
                <Clock className="w-4 h-4 text-blue-600" />
              ) : (
                <Calendar className="w-4 h-4 text-gray-500" />
              )}
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">
                  {hasConfiguration ? 'Schedule Configured' : 'Configure Schedule'}
                </span>
                {hasConfiguration && (
                  <span className="text-xs text-gray-600 font-normal">
                    {scheduleSummary}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasConfiguration && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                  title="Clear schedule"
                >
                  ×
                </Button>
              )}
              <Settings className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </Button>
        
        {!hasConfiguration && (
          <p className="text-xs text-gray-500 px-1">
            {placeholder}
          </p>
        )}
      </div>
      
      {/* Schedule Configuration Modal */}
      <AutoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        schema={SCHEDULE_CONFIG_SCHEMA}
        config={{
          resource: 'scheduleConfig',
          action: 'create', // Always treat as create (we're not saving to DB)
          title: 'Configure Queue Schedule',
          width: 'md'
        }}
        initialData={modalInitialData}
        onSuccess={handleModalSuccess}
        onError={(error) => {
          console.error('Schedule configuration error:', error);
          // Could show toast notification here
        }}
      />
    </>
  );
};
