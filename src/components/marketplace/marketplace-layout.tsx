/**
 * Marketplace Layout - Mac App Store Style Sidebar Navigation
 * 
 * Features:
 * - Clean sidebar navigation matching Mac App Store UX
 * - Content-first design without heavy cards
 * - Scalable navigation structure
 * - Mobile-responsive with collapsible sidebar
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Home, Search, Package, Download, Heart, Grid, 
  ChevronLeft, Menu, Bell, Settings, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarketplaceDashboard } from './marketplace-dashboard';
import { MarketplaceBrowse } from './marketplace-browse';
import { MarketplaceMyPackages } from './marketplace-my-packages';
import { MarketplaceUpdates } from './marketplace-updates';
import { MarketplaceCollections } from './marketplace-collections';
import { PackageDetail } from './package-detail';

interface MarketplaceLayoutProps {
  initialView?: 'dashboard' | 'browse' | 'my-packages' | 'updates' | 'collections' | 'detail';
}

const NAVIGATION_ITEMS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: Home, 
    description: 'Overview and highlights' 
  },
  { 
    id: 'browse', 
    label: 'Browse', 
    icon: Search, 
    description: 'Discover new packages' 
  },
  { 
    id: 'my-packages', 
    label: 'My Packages', 
    icon: Package, 
    description: 'Installed packages' 
  },
  { 
    id: 'updates', 
    label: 'Updates', 
    icon: Download, 
    description: 'Available updates',
    showBadge: true 
  },
  { 
    id: 'collections', 
    label: 'Collections', 
    icon: Heart, 
    description: 'Saved packages' 
  },
];

export function MarketplaceLayout({ initialView = 'dashboard' }: MarketplaceLayoutProps) {
  const [activeView, setActiveView] = useState(initialView);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch update count for badge using consolidated dashboard API
  const { data: dashboardData } = useQuery({
    queryKey: ['marketplace-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const updateCount = dashboardData?.updateCount || 0;

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    setActiveView('detail');
  };

  const handleBack = () => {
    setSelectedPackageId(null);
    setActiveView('dashboard');
  };

  const renderContent = () => {
    if (selectedPackageId && activeView === 'detail') {
      return (
        <PackageDetail 
          packageId={selectedPackageId}
          onBack={handleBack}
        />
      );
    }

    switch (activeView) {
      case 'browse':
        return <MarketplaceBrowse onPackageSelect={handlePackageSelect} />;
      case 'my-packages':
        return <MarketplaceMyPackages onPackageSelect={handlePackageSelect} />;
      case 'updates':
        return <MarketplaceUpdates onPackageSelect={handlePackageSelect} />;
      case 'collections':
        return <MarketplaceCollections onPackageSelect={handlePackageSelect} />;
      default:
        return <MarketplaceDashboard onPackageSelect={handlePackageSelect} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Marketplace
              </h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const showUpdateBadge = item.showBadge && updateCount && updateCount > 0;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start h-10 ${sidebarCollapsed ? 'px-2' : 'px-3'} ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveView(item.id as any)}
                >
                  <Icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {showUpdateBadge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center"
                        >
                          {updateCount}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Marketplace v2.0</span>
              <Button variant="ghost" size="sm" className="p-1">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedPackageId && activeView === 'detail' 
                  ? 'Package Details'
                  : NAVIGATION_ITEMS.find(item => item.id === activeView)?.label || 'Dashboard'
                }
              </h2>
              {!selectedPackageId && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {NAVIGATION_ITEMS.find(item => item.id === activeView)?.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
