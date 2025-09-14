import { Variable } from '../types'

// 🎯 **RICH SAMPLE DATA** - Showcase advanced variable inspector features
export const ENHANCED_DEBUG_VARIABLES: Variable[] = [
  // Simple types
  {
    name: 'air',
    value: '',
    type: 'string',
    scope: 'local'
  },
  {
    name: 'newVal',
    value: 6,
    type: 'number',
    scope: 'local',
    changed: true,
    previousValue: 4
  },
  {
    name: 'isActive',
    value: true,
    type: 'boolean',
    scope: 'local'
  },

  // Complex objects - showcases expandable tree
  {
    name: 'customer',
    value: {
      id: 'cust_123',
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      },
      orders: [
        { id: 'order_1', total: 99.99, status: 'shipped' },
        { id: 'order_2', total: 149.50, status: 'pending' }
      ]
    },
    type: 'object',
    scope: 'local'
  },

  // Arrays
  {
    name: 'newArray',
    value: [1, 2, 3, 'test', { nested: true }],
    type: 'object',
    scope: 'local'
  },

  // Changed nested object
  {
    name: 'booking',
    value: {
      id: 'book_456',
      totalAmount: 1200,
      passengers: [
        { name: 'Alice Smith', age: 32, seat: '12A' },
        { name: 'Bob Jones', age: 28, seat: '12B' }
      ],
      flight: {
        number: 'AA123',
        departure: '2024-01-15T10:00:00Z',
        arrival: '2024-01-15T14:30:00Z',
        aircraft: 'Boeing 737'
      }
    },
    type: 'object',
    scope: 'global',
    changed: true,
    previousValue: {
      id: 'book_456',
      totalAmount: 1000, // Changed from 1000 to 1200
      passengers: [
        { name: 'Alice Smith', age: 32, seat: '12A' }
      ], // Added passenger
      flight: {
        number: 'AA123',
        departure: '2024-01-15T10:00:00Z',
        arrival: '2024-01-15T14:30:00Z',
        aircraft: 'Boeing 737'
      }
    }
  },

  // Dictionary/Map-like object
  {
    name: 'newDict',
    value: {
      'tahnks': 3,
      'that': 4,
      'config': {
        version: '2.1.0',
        features: ['debug', 'test', 'deploy'],
        enabled: true
      }
    },
    type: 'object',
    scope: 'local'
  },

  // Function (for advanced type detection)
  {
    name: 'calculateDiscount',
    value: function(amount: number) { return amount * 0.1; },
    type: 'function',
    scope: 'builtin'
  },

  // Date object
  {
    name: 'currentDate',
    value: new Date('2024-01-15T15:30:00Z'),
    type: 'object',
    scope: 'global'
  },

  // Null and undefined
  {
    name: 'nullValue',
    value: null,
    type: 'object',
    scope: 'local'
  },

  {
    name: 'undefinedValue',
    value: undefined,
    type: 'undefined',
    scope: 'local'
  },

  // Large string (tests truncation)
  {
    name: 'longDescription',
    value: 'This is a very long string that should be truncated in the preview but can be expanded to see the full content. It contains multiple sentences and should demonstrate how the variable inspector handles long text values gracefully.',
    type: 'string',
    scope: 'local'
  },

  // RegExp
  {
    name: 'emailPattern',
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    type: 'object',
    scope: 'builtin'
  }
]

// 🎯 **SAMPLE BUSINESS RULES** - For testing
export const SAMPLE_BUSINESS_RULES_WITH_RICH_DATA = `air = ""

newVal = 6

if customer.age < 18
    eligibleForDiscount = false
else
    eligibleForDiscount = true

if any passenger in booking.passengers where age > 65
    applySpecialAssistance = true

if booking.totalAmount > 1000
    applyPremiumService = true
    
newArray = [1,2,3]

newDict = {"tahnks": 3, "that": 4}

currentDate = new Date()`

// 🎯 **PYTHON CODE SAMPLE** - Generated code
export const SAMPLE_PYTHON_CODE_WITH_RICH_DATA = `air = ""

newVal = 6

if customer.age < 18:
    eligibleForDiscount = False
else:
    eligibleForDiscount = True

if any(passenger.age > 65 for passenger in booking.passengers):
    applySpecialAssistance = True

if booking.totalAmount > 1000:
    applyPremiumService = True
    
newArray = [1,2,3]

newDict = {"tahnks": 3, "that": 4}

import datetime
currentDate = datetime.datetime.now()` 