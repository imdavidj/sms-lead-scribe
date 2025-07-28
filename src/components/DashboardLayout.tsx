import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ConversationsList } from './ConversationsList';
import { ConversationThread } from './ConversationThread';
import { Conversation } from '@/types/conversation';

const pageContent = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your SMS lead qualification activities",
  },
  "all-leads": {
    title: "All Leads",
    subtitle: "Complete list of all leads in your system",
  },
  qualified: {
    title: "Qualified Leads",
    subtitle: "Leads that meet your qualification criteria",
  },
  unqualified: {
    title: "Unqualified Leads",
    subtitle: "Leads that don't meet qualification criteria",
  },
  "no-response": {
    title: "No Response",
    subtitle: "Leads that haven't responded to messages",
  },
  blocked: {
    title: "Blocked",
    subtitle: "Leads that have opted out or blocked messages",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Performance metrics and trend analysis",
  },
  "saved-lists": {
    title: "Saved Lists",
    subtitle: "Your saved lead lists for future campaigns",
  },
  "used-lists": {
    title: "Used Lists",
    subtitle: "Previously used lead lists and their performance",
  },
  templates: {
    title: "Templates",
    subtitle: "Manage your SMS message templates",
  },
  automations: {
    title: "Automations",
    subtitle: "Configure automated SMS sequences",
  },
  users: {
    title: "Users & Permissions",
    subtitle: "Manage team access and permissions",
  },
  webhooks: {
    title: "Webhooks & Integrations",
    subtitle: "Configure external integrations and webhooks",
  },
  settings: {
    title: "Account Settings",
    subtitle: "Manage your account preferences",
  },
  help: {
    title: "Help & Docs",
    subtitle: "Documentation and support resources",
  },
};

const KPICards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="text-sm text-gray-600 mb-2">Response Rate</div>
      <div className="text-3xl font-bold text-gray-900">68.4%</div>
      <div className="text-sm text-green-600 mt-1">↗ +5.2% vs last week</div>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="text-sm text-gray-600 mb-2">Qualification Rate</div>
      <div className="text-3xl font-bold text-gray-900">32.1%</div>
      <div className="text-sm text-green-600 mt-1">↗ +2.8% vs last week</div>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="text-sm text-gray-600 mb-2">Block Rate</div>
      <div className="text-3xl font-bold text-gray-900">4.2%</div>
      <div className="text-sm text-red-600 mt-1">↘ -1.1% vs last week</div>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="text-sm text-gray-600 mb-2">Time to Qualify</div>
      <div className="text-3xl font-bold text-gray-900">2.3 hrs</div>
      <div className="text-sm text-green-600 mt-1">↘ -0.4 hrs vs last week</div>
    </div>
  </div>
);

const ChartPlaceholder = () => (
  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-80 flex items-center justify-center text-gray-500 text-lg">
    📊 Daily/Weekly Trends Chart Placeholder
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
    if (activePage === 'dashboard') {
      return (
        <div className="space-y-6">
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
      );
    }

    if (activePage === 'analytics') {
      return (
        <div className="space-y-6">
          <KPICards />
          <ChartPlaceholder />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{currentPage.title}</h3>
        <p className="text-gray-600">
          This section will contain the relevant content for {currentPage.title.toLowerCase()}.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onPageChange={setActivePage} activePage={activePage} />
      
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentPage.title}</h1>
          <p className="text-gray-600">{currentPage.subtitle}</p>
        </div>
        
        {renderPageContent()}
      </div>
    </div>
  );
};