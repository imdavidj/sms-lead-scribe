import React, { useState, useEffect } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { NavigationSidebar } from './NavigationSidebar';
import { AICommandCenter } from './AICommandCenter';
import { ConversationManager } from './ConversationManager';
import { EnhancedLeadsView } from './EnhancedLeadsView';
import ImportLeadsView from './ImportLeadsView';
import { CampaignsView } from './CampaignsView';
import { AnalyticsView } from './AnalyticsView';
import { SettingsView } from './SettingsView';
import { CRMPushModal } from './CRMPushModal';
import { Lead } from '@/types/dashboard';

export const EnhancedDashboardLayout = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [preselectPhone, setPreselectPhone] = useState<string | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAIProcessing(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get('phone');
    if (phone) {
      setPreselectPhone(phone);
      setActiveView('conversations');
    }
  }, []);

  const handlePushToCRM = (lead: Lead) => {
    setSelectedLead(lead);
    setShowCRMModal(true);
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AICommandCenter 
          isAIProcessing={isAIProcessing} 
          onLaunchCampaign={() => setActiveView('campaigns')}
          onImportLeads={() => setActiveView('leads')}
          onTrainModel={() => setActiveView('settings')}
        />;
      case 'conversations':
        return <ConversationManager preselectPhone={preselectPhone || undefined} />;
      case 'leads':
        return <EnhancedLeadsView 
          onPushToCRM={handlePushToCRM}
          onOpenConversation={(phone) => {
            setPreselectPhone(phone || '');
            setActiveView('conversations');
          }}
        />;
      case 'import-leads':
        return <ImportLeadsView />;
      case 'campaigns':
        return <CampaignsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AICommandCenter 
          isAIProcessing={isAIProcessing} 
          onLaunchCampaign={() => setActiveView('campaigns')}
          onImportLeads={() => setActiveView('leads')}
          onTrainModel={() => setActiveView('settings')}
        />;
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