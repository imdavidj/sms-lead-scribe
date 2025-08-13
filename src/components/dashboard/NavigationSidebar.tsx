import React from 'react';
import { 
  Brain, MessageSquare, Database, Workflow, BarChart, Settings,
  Lightbulb, Upload
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { NavigationItem } from '@/types/dashboard';

interface NavigationSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'AI Dashboard', icon: Brain },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare, badge: '12 active' },
  { id: 'leads', label: 'Lead Database', icon: Database, badge: '1,247' },
  { id: 'campaigns', label: 'AI Campaigns', icon: Workflow, badge: '5 active' },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeView,
  setActiveView,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  return (
    <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r border-gray-200 h-[calc(100vh-57px)]`}>
      <div className="p-4">
        <div className="space-y-1">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeView === item.id 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5" />
            <span className="font-bold">AI Insight</span>
          </div>
          <p className="text-sm text-purple-100 mb-3">
            Your AI is 3.2x more effective between 2-4 PM
          </p>
          <Button 
            variant="secondary"
            size="sm"
            className="w-full bg-white text-purple-600 hover:bg-purple-50"
          >
            Optimize Schedule
          </Button>
        </div>
      </div>
    </div>
  );
};