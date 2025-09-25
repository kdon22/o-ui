/**
 * Settings Dashboard - Overview of all settings areas
 * 
 * Features:
 * - Quick access to all settings sections
 * - System status overview  
 * - Recent activity
 */

'use client';

import React from 'react';
import { 
  Users, Shield, MessageSquare, Bell, Target, Zap, Workflow, 
  ChevronRight, Activity, Clock, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsDashboardProps {
  onNavigate?: (section: string) => void;
}

const SETTINGS_SECTIONS = [
  {
    id: 'users',
    title: 'Users',
    description: 'Manage user accounts and access',
    icon: Users,
    stats: '12 active users'
  },
  {
    id: 'credentials',
    title: 'Credentials',
    description: 'API credentials and connections',
    icon: Shield,
    stats: '5 configured'
  },
  {
    id: 'permission-groups',
    title: 'Permission Groups',
    description: 'User roles and permissions',
    icon: Users,
    stats: '3 groups'
  },
  {
    id: 'customers',
    title: 'Customers',
    description: 'Customer management',
    icon: Users,
    stats: '24 customers'
  },
  {
    id: 'communications',
    title: 'Communications',
    description: 'Email and notification settings',
    icon: MessageSquare,
    stats: 'Active'
  },
  {
    id: 'runtime-notifications',
    title: 'Runtime Notifications',
    description: 'System alerts and monitoring',
    icon: Bell,
    stats: 'Enabled'
  },
  {
    id: 'hit-settings',
    title: 'Hit Settings',
    description: 'Hit configuration and rules',
    icon: Target,
    stats: 'Configured'
  },
  {
    id: 'end-transact-settings',
    title: 'End Transact Settings',
    description: 'Transaction completion settings',
    icon: Zap,
    stats: 'Active'
  },
  {
    id: 'workflows',
    title: 'Workflows',
    description: 'Automated business processes',
    icon: Workflow,
    stats: '8 workflows'
  }
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    action: 'User added',
    target: 'john.doe@example.com',
    timestamp: '2 hours ago',
    status: 'success'
  },
  {
    id: 2,
    action: 'Credential updated',
    target: 'Amadeus API',
    timestamp: '5 hours ago',
    status: 'success'
  },
  {
    id: 3,
    action: 'Permission changed',
    target: 'Admin group',
    timestamp: '1 day ago',
    status: 'success'
  }
];

export function SettingsDashboard({ onNavigate }: SettingsDashboardProps) {
  
  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your workspace configuration and preferences
          </p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Status</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Activity className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Calls</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1.2K</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Workflow className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workflows</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Sections */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Settings Sections</CardTitle>
                <CardDescription>
                  Quick access to all configuration areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SETTINGS_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => onNavigate?.(section.id)}
                        className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left group"
                      >
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-100">
                            {section.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {section.description}
                          </p>
                          {section.stats && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {section.stats}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest configuration changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {RECENT_ACTIVITY.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {activity.target}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-400">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
