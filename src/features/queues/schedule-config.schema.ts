import { z } from 'zod';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

// TypeScript types for schedule configuration
export interface ScheduleEntry {
  days?: string[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export interface ScheduleConfigData {
  type?: 'single' | 'multiple';
  checkInterval?: number;
  schedules?: ScheduleEntry[];
}

// Zod validation schema
export const ScheduleConfigZodSchema = z.object({
  type: z.enum(['single', 'multiple']).optional().default('single'),
  checkInterval: z.number().min(1).max(1440).optional().default(5), // 1 minute to 24 hours
  schedules: z.array(z.object({
    days: z.array(z.string()).optional().default([]),
    startTime: z.string().optional().default('09:00'),
    endTime: z.string().optional().default('17:00'),
    timezone: z.string().optional().default('UTC')
  })).optional().default([])
});

// Resource schema for auto-modal
export const SCHEDULE_CONFIG_SCHEMA: ResourceSchema = {
  databaseKey: 'scheduleConfig', // Not a real database table, just for form
  modelName: 'ScheduleConfig',
  actionPrefix: 'scheduleConfig',
  notHasBranchContext: true, // This is configuration data, not branched
  
  display: {
    title: 'Schedule Configuration',
    description: 'Configure queue scheduling parameters',
    icon: 'Calendar'
  },
  
  form: {
    width: 'md',
    layout: 'compact',
    showDescriptions: true,
    submitButtonText: 'Apply Schedule',
    cancelButtonText: 'Cancel'
  },
  
  // Required properties (minimal implementation since this is modal-only)
  search: {
    fields: ['type'],
    placeholder: 'Search schedules...',
    fuzzy: false
  },
  
  actions: {
    create: true,
    update: false,
    delete: false
  },
  
  mobile: {
    cardFormat: 'compact' as const,
    primaryField: 'type',
    secondaryFields: ['checkInterval'],
    showSearch: false,
    showFilters: false,
    fabPosition: 'bottom-right' as const
  },
  
  desktop: {},
  
  fields: [
    // Schedule Type
    {
      key: 'type',
      label: 'Schedule Type',
      type: 'select' as const,
      required: false,
      defaultValue: 'single',
      form: {
        row: 1,
        width: 'full',
        order: 1
      },
      options: {
        static: [
          { value: 'single', label: 'Single Schedule' },
          { value: 'multiple', label: 'Multiple Schedules' }
        ]
      },
      description: 'Choose between a single schedule or multiple time periods'
    },
    
    // Check Interval
    {
      key: 'checkInterval',
      label: 'Check Interval (minutes)',
      type: 'number' as const,
      required: false,
      defaultValue: 5,
      placeholder: '5',
      form: {
        row: 2,
        width: 'half',
        order: 1
      },
      validation: [
        { type: 'min', value: 1, message: 'Minimum 1 minute' },
        { type: 'max', value: 1440, message: 'Maximum 24 hours (1440 minutes)' }
      ],
      description: 'How often to check for new items (1-1440 minutes)'
    },
    
    // Days Selection - Matrix with checkboxes
    {
      key: 'schedules.0.days',
      label: 'Active Days',
      type: 'matrix' as const,
      required: false,
      form: {
        row: 3,
        width: 'full',
        order: 1
      },
      template: 'day-selector',
      config: {
        sections: [{
          id: 'weekdays',
          label: 'Days of the Week',
          resources: [{
            key: 'schedule',
            label: '', // Removed "Schedule" text
            description: 'Select active days'
          }],
          actions: [
            { key: 'all', label: 'All', description: 'Select/deselect all days' },
            { key: 'sunday', label: 'Sun', description: 'Sunday' },
            { key: 'monday', label: 'Mon', description: 'Monday' },
            { key: 'tuesday', label: 'Tue', description: 'Tuesday' },
            { key: 'wednesday', label: 'Wed', description: 'Wednesday' },
            { key: 'thursday', label: 'Thu', description: 'Thursday' },
            { key: 'friday', label: 'Fri', description: 'Friday' },
            { key: 'saturday', label: 'Sat', description: 'Saturday' }
          ]
        }],
        layout: 'stacked',
        showHeaders: false,
        compact: true
      },
      description: 'Select the days when the queue should be active'
    },
    
    // Start Time
    {
      key: 'schedules.0.startTime',
      label: 'Start Time',
      type: 'text' as const,
      required: false,
      defaultValue: '09:00',
      placeholder: '09:00',
      form: {
        row: 4,
        width: 'half',
        order: 1
      },
      validation: [
        { 
          type: 'pattern', 
          value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 
          message: 'Use HH:MM format (e.g., 09:00)' 
        }
      ],
      description: 'Start time in the selected timezone (HH:MM format)'
    },
    
    // End Time
    {
      key: 'schedules.0.endTime',
      label: 'End Time',
      type: 'text' as const,
      required: false,
      defaultValue: '17:00',
      placeholder: '17:00',
      form: {
        row: 4,
        width: 'half',
        order: 2
      },
      validation: [
        { 
          type: 'pattern', 
          value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 
          message: 'Use HH:MM format (e.g., 17:00)' 
        }
      ],
      description: 'End time in the selected timezone (HH:MM format)'
    },
    
    // Timezone
    {
      key: 'schedules.0.timezone',
      label: 'Timezone',
      type: 'select' as const,
      required: false,
      defaultValue: 'UTC',
      form: {
        row: 5,
        width: 'full',
        order: 1
      },
      options: {
        static: [
          { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
          { value: 'America/New_York', label: 'Eastern Time (ET)' },
          { value: 'America/Chicago', label: 'Central Time (CT)' },
          { value: 'America/Denver', label: 'Mountain Time (MT)' },
          { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
          { value: 'America/Phoenix', label: 'Mountain Standard Time (MST)' },
          { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
          { value: 'Pacific/Honolulu', label: 'Hawaii Standard Time (HST)' },
          { value: 'Europe/London', label: 'London (GMT/BST)' },
          { value: 'Europe/Paris', label: 'Central European Time (CET)' },
          { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
          { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
          { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
          { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
          { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
          { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
          { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
          { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (HKT)' },
          { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
          { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)' },
          { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
          { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
          { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
          { value: 'Australia/Melbourne', label: 'Australian Eastern Time (AET)' },
          { value: 'Australia/Perth', label: 'Australian Western Time (AWT)' },
          { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)' }
        ],
        searchable: true
      },
      description: 'Select the timezone for the schedule'
    },
    
    // Note for multiple schedules (when type = 'multiple')
    {
      key: 'multipleScheduleNote',
      label: 'Multiple Schedules',
      type: 'text' as const,
      form: {
        row: 6,
        width: 'full',
        order: 1,
        showInForm: false // Hidden field, just for display
      },
      defaultValue: 'Multiple schedule support will be available in the next update. For now, configure a single schedule above.',
      description: 'Support for multiple time periods will be added soon'
    }
  ]
};

// Default schedule data
export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfigData = {
  type: 'single',
  checkInterval: 5,
  schedules: [{
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'UTC'
  }]
};

// Default form data for the modal (with matrix field format)
export const DEFAULT_MODAL_DATA = {
  type: 'single',
  checkInterval: 5,
  'schedules.0.days': { schedule: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
  'schedules.0.startTime': '09:00',
  'schedules.0.endTime': '17:00',
  'schedules.0.timezone': 'UTC'
};
