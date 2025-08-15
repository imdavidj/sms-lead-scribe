import React from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
      toast({ title: "Logged out successfully" });
    } catch (error: any) {
      toast({ 
        title: "Error logging out", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg font-bold text-xl">
              AI Qualify
            </div>
            <span className="text-sm text-gray-500 hidden sm:inline">Lead Intelligence Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">AI Processing: 47 Active</span>
          </div>
          <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-gray-100"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </Button>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};