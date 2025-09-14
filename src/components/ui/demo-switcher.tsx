'use client'

import { useState } from 'react'
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'

interface DemoSwitcherProps {
  currentPage?: 'original' | 'demo' | 'comparison'
}

export function DemoSwitcher({ currentPage = 'original' }: DemoSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
      >
        {isOpen ? (
          <EyeOff className="w-6 h-6 group-hover:scale-110 transition-transform" />
        ) : (
          <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Options Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 shadow-xl w-64">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">UI Demo</h3>
          </div>
          
          <div className="space-y-2">
            <a
              href="/"
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all group",
                currentPage === 'original'
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="text-sm font-medium">Original Version</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            <a
              href="/demo"
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all group",
                currentPage === 'demo'
                  ? "bg-red-50 text-red-900 border border-red-200"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-900"
              )}
            >
              <span className="text-sm font-medium">Modern Demo</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            <a
              href="/demo/comparison"
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all group",
                currentPage === 'comparison'
                  ? "bg-blue-50 text-blue-900 border border-blue-200"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-900"
              )}
            >
              <span className="text-sm font-medium">Comparison</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Switch between versions to compare
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 