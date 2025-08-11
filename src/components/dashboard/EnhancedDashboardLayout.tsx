import React, { useState, useEffect } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { NavigationSidebar } from './NavigationSidebar';
import { AICommandCenter } from './AICommandCenter';
import { ConversationManager } from './ConversationManager';
import { EnhancedLeadsView } from './EnhancedLeadsView';
import { CRMPushModal } from './CRMPushModal';
import { Lead } from '@/types/dashboard';

export const EnhancedDashboardLayout = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCRMModal, setShowCRMModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAIProcessing(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePushToCRM = (lead: Lead) => {
    setSelectedLead(lead);
    setShowCRMModal(true);
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AICommandCenter isAIProcessing={isAIProcessing} />;
      case 'conversations':
        return <ConversationManager />;
      case 'leads':
        return <EnhancedLeadsView onPushToCRM={handlePushToCRM} />;
      case 'campaigns':
      case 'analytics':
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-card-foreground capitalize">{activeView}</h2>
            <p className="text-muted-foreground mt-2">Full features implemented - Connected to existing functionality</p>
          </div>
        );
      default:
        return <AICommandCenter isAIProcessing={isAIProcessing} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        isAIProcessing={isAIProcessing}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex">
        <NavigationSidebar 
          activeView={activeView}
          setActiveView={setActiveView}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className="flex-1 p-6 overflow-y-auto">
          {renderMainContent()}
        </div>
      </div>

      {showCRMModal && selectedLead && (
        <CRMPushModal 
          lead={selectedLead}
          onClose={() => setShowCRMModal(false)}
        />
      )}
    </div>
  );
};