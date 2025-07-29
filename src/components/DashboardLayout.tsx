import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ConversationsList } from './ConversationsList';
import { ConversationThread } from './ConversationThread';
import { Conversation } from '@/types/conversation';
import { BarChart3 } from 'lucide-react';

const pageContent = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your SMS lead qualification activities",
    dataSection: "dashboard"
  },
  "all-leads": {
    title: "All Leads",
    subtitle: "Complete list of all leads in your system",
    dataSection: "leads-all"
  },
  qualified: {
    title: "Qualified Leads",
    subtitle: "Leads that meet your qualification criteria",
    dataSection: "leads-qualified"
  },
  unqualified: {
    title: "Unqualified Leads",
    subtitle: "Leads that don't meet qualification criteria",
    dataSection: "leads-unqualified"
  },
  "no-response": {
    title: "No Response",
    subtitle: "Leads that haven't responded to messages",
    dataSection: "leads-no-response"
  },
  blocked: {
    title: "Blocked",
    subtitle: "Leads that have opted out or blocked messages",
    dataSection: "leads-blocked"
  },
  analytics: {
    title: "Analytics",
    subtitle: "Performance metrics and trend analysis",
    dataSection: "analytics"
  },
  "saved-lists": {
    title: "Saved Lists",
    subtitle: "Your saved lead lists for future campaigns",
    dataSection: "upload-saved"
  },
  "used-lists": {
    title: "Used Lists",
    subtitle: "Previously used lead lists and their performance",
    dataSection: "upload-used"
  },
  templates: {
    title: "Templates",
    subtitle: "Manage your SMS message templates",
    dataSection: "templates"
  },
  automations: {
    title: "Automations",
    subtitle: "Configure automated SMS sequences",
    dataSection: "automations"
  },
  users: {
    title: "Users & Permissions",
    subtitle: "Manage team access and permissions",
    dataSection: "admin-users"
  },
  webhooks: {
    title: "Webhooks & Integrations",
    subtitle: "Configure external integrations and webhooks",
    dataSection: "admin-webhooks"
  },
  settings: {
    title: "Account Settings",
    subtitle: "Manage your account preferences",
    dataSection: "admin-account"
  },
  help: {
    title: "Help & Docs",
    subtitle: "Documentation and support resources",
    dataSection: "help"
  },
};

const KPICards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-muted-foreground mb-2">Response Rate</div>
      <div className="text-3xl font-bold text-foreground">68.4%</div>
      <div className="text-sm text-emerald-600 mt-1 font-medium">↗ +5.2% vs last week</div>
    </div>
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-muted-foreground mb-2">Qualification Rate</div>
      <div className="text-3xl font-bold text-foreground">32.1%</div>
      <div className="text-sm text-emerald-600 mt-1 font-medium">↗ +2.8% vs last week</div>
    </div>
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-muted-foreground mb-2">Block Rate</div>
      <div className="text-3xl font-bold text-foreground">4.2%</div>
      <div className="text-sm text-red-500 mt-1 font-medium">↘ -1.1% vs last week</div>
    </div>
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-muted-foreground mb-2">Time to Qualify</div>
      <div className="text-3xl font-bold text-foreground">2.3 hrs</div>
      <div className="text-sm text-emerald-600 mt-1 font-medium">↘ -0.4 hrs vs last week</div>
    </div>
  </div>
);

const ChartPlaceholder = () => (
  <div className="bg-card border border-border rounded-xl h-80 flex items-center justify-center text-muted-foreground text-lg shadow-sm">
    <div className="text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p>Analytics Dashboard Coming Soon</p>
    </div>
  </div>
);

export const DashboardLayout = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConversationUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const currentPage = pageContent[activePage as keyof typeof pageContent] || pageContent.dashboard;

  const renderPageContent = () => {
    const currentPageData = pageContent[activePage as keyof typeof pageContent];
    
    return (
      <div className="space-y-6">
        {/* Dashboard Section */}
        <div className={`section ${activePage === 'dashboard' ? '' : 'hidden'}`} id="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
            <div className="lg:col-span-1 overflow-hidden">
              <h3 className="text-lg font-semibold mb-4">Recent Conversations</h3>
              <div className="h-full overflow-y-auto">
                <ConversationsList 
                  onSelectConversation={setSelectedConversation} 
                  selectedConversationId={selectedConversation?.id} 
                  key={refreshKey} 
                />
              </div>
            </div>
            
            <div className="lg:col-span-2 overflow-hidden">
              <ConversationThread 
                conversation={selectedConversation} 
                onConversationUpdate={handleConversationUpdate} 
              />
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className={`section ${activePage === 'analytics' ? '' : 'hidden'}`} id="analytics">
          <KPICards />
          <ChartPlaceholder />
        </div>

        {/* All other sections */}
        {Object.entries(pageContent).map(([key, content]) => {
          if (key === 'dashboard' || key === 'analytics') return null;
          return (
            <div key={key} className={`section ${activePage === key ? '' : 'hidden'}`} id={content.dataSection}>
              <div className="bg-card rounded-xl p-8 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">{content.title}</h3>
                <p className="text-muted-foreground">
                  This section will contain the relevant content for {content.title.toLowerCase()}.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onPageChange={setActivePage} activePage={activePage} />
      
      <div className="flex-1 p-8 bg-background">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">{currentPage.title}</h1>
          <p className="text-lg text-muted-foreground">{currentPage.subtitle}</p>
        </div>
        
        {renderPageContent()}
      </div>
    </div>
  );
};