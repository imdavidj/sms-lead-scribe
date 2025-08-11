import React from 'react';
import { Brain, Loader2, Bell, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isAIProcessing: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isAIProcessing,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary to-chart-3 text-primary-foreground px-3 py-1 rounded-lg font-bold text-xl">
              N1AI
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Lead Intelligence Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">AI Processing: 47 Active</span>
          </div>
          <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-chart-3 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};