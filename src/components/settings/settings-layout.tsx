/**
 * Settings Layout - Enterprise Settings Management
 * 
 * Features:
 * - Clean sidebar navigation matching marketplace UX
 * - Content-first design without heavy cards
 * - Scalable navigation structure
 * - Mobile-responsive with collapsible sidebar (overlay)
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, Shield, Settings, Cog, MessageSquare, Bell, 
  Target, Zap, Workflow, ChevronLeft, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsDashboard } from './settings-dashboard';
import { SettingsUsers } from './settings-users';
import { SettingsCredentials } from './settings-credentials';
import { SettingsPermissionGroups } from './settings-permission-groups';
import { SettingsCustomers } from './settings-customers';
import { SettingsCommunications } from './settings-communications';
import { SettingsRuntimeNotifications } from './settings-runtime-notifications';
import { SettingsHitSettings } from './settings-hit-settings';
import { SettingsEndTransactSettings } from './settings-end-transact-settings';
import { SettingsWorkflows } from './settings-workflows';

interface SettingsLayoutProps {
  initialView?: 'dashboard' | 'users' | 'credentials' | 'permission-groups' | 'customers' | 'communications' | 'runtime-notifications' | 'hit-settings' | 'end-transact-settings' | 'workflows';
}

const NAVIGATION_ITEMS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard',
    icon: Settings, 
    description: 'Overview and highlights' 
  },
  { 
    id: 'users', 
    label: 'Users', 
    icon: Users, 
    description: 'User management' 
  },
  // Security section
  { 
    id: 'security-header', 
    label: 'Security', 
    isHeader: true 
  },
  { 
    id: 'credentials', 
    label: 'Credentials', 
    icon: Shield, 
    description: 'API credentials and connections',
    indent: true
  },
  { 
    id: 'permission-groups', 
    label: 'Permission Groups', 
    icon: Users, 
    description: 'User roles and permissions',
    indent: true 
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: Users, 
    description: 'Customer management' 
  },
  { 
    id: 'communications', 
    label: 'Communications', 
    icon: MessageSquare, 
    description: 'Communication settings' 
  },
  { 
    id: 'runtime-notifications', 
    label: 'Runtime Notifications', 
    icon: Bell, 
    description: 'System notification settings' 
  },
  { 
    id: 'hit-settings', 
    label: 'Hit Settings', 
    icon: Target, 
    description: 'Hit configuration' 
  },
  { 
    id: 'end-transact-settings', 
    label: 'End Transact Settings', 
    icon: Zap, 
    description: 'Transaction end settings' 
  },
  { 
    id: 'workflows', 
    label: 'Workflows', 
    icon: Workflow, 
    description: 'Workflow management' 
  },
];

export function SettingsLayout({ initialView = 'dashboard' }: SettingsLayoutProps) {
  
  const [activeView, setActiveView] = useState(initialView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <SettingsUsers />;
      case 'credentials':
        return <SettingsCredentials />;
      case 'permission-groups':
        return <SettingsPermissionGroups />;
      case 'customers':
        return <SettingsCustomers />;
      case 'communications':
        return <SettingsCommunications />;
      case 'runtime-notifications':
        return <SettingsRuntimeNotifications />;
      case 'hit-settings':
        return <SettingsHitSettings />;
      case 'end-transact-settings':
        return <SettingsEndTransactSettings />;
      case 'workflows':
        return <SettingsWorkflows />;
      default:
        return <SettingsDashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900 relative">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarCollapsed ? 'w-16' : 'w-64'} 
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transition-all duration-300 flex flex-col
        md:relative fixed inset-y-0 left-0 z-50
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSidebarCollapsed(!sidebarCollapsed);
                if (mobileSidebarOpen) setMobileSidebarOpen(false);
              }}
              className="p-1"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              if (item.isHeader) {
                return !sidebarCollapsed ? (
                  <div key={item.id} className="px-2 py-2 mt-4 first:mt-0">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {item.label}
                    </h3>
                  </div>
                ) : (
                  <div key={item.id} className="h-4" />
                );
              }

              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (mobileSidebarOpen) setMobileSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${item.indent ? 'ml-4' : ''}
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header for sidebar toggle */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
