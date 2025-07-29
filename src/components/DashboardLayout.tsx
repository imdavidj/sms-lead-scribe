import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ConversationsList } from './ConversationsList';
import { ConversationThread } from './ConversationThread';
import { LeadsView } from './LeadsView';
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

// Analytics data
const analytics = {
  responseRate: '45%',
  qualificationRate: '30%',
  blockRate: '5%',
  timeToQualify: '12h 30m',
  leadsPerDay: '120'
};

const AnalyticsKPICards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">📈</span>
        <div className="text-sm font-medium text-gray-600">Response Rate</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{analytics.responseRate}</div>
    </div>
    
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">✅</span>
        <div className="text-sm font-medium text-gray-600">Qualification Rate</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{analytics.qualificationRate}</div>
    </div>
    
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🚫</span>
        <div className="text-sm font-medium text-gray-600">Block Rate</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{analytics.blockRate}</div>
    </div>
    
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">⏱️</span>
        <div className="text-sm font-medium text-gray-600">Time to Qualify</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{analytics.timeToQualify}</div>
    </div>
    
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">👥</span>
        <div className="text-sm font-medium text-gray-600">Leads per Day</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{analytics.leadsPerDay}</div>
    </div>
  </div>
);

const AnalyticsChart = () => {
  React.useEffect(() => {
    const canvas = document.getElementById('analyticsChart') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 400;
        
        // Chart placeholder
        ctx.fillStyle = '#374151';
        ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Chart Placeholder - Integrate your preferred chart library', canvas.width / 2, 200);
        
        ctx.fillStyle = '#6B7280';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('(Chart.js, D3.js, Recharts, etc.)', canvas.width / 2, 230);
      }
    }
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm border-l-4 border-l-green-500">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance Trends</h3>
      <canvas 
        id="analyticsChart" 
        className="w-full h-96 bg-gray-50 rounded-lg"
        style={{ height: '400px' }}
      >
        Chart will render here
      </canvas>
    </div>
  );
};

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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
            <p className="text-gray-600">Key Performance Indicators</p>
          </div>
          <AnalyticsKPICards />
          <AnalyticsChart />
        </div>

        {/* Leads Sections */}
        {['all-leads', 'qualified', 'unqualified', 'no-response', 'blocked'].includes(activePage) && (
          <div className={`section`}>
            <LeadsView />
          </div>
        )}

        {/* All other sections */}
        {Object.entries(pageContent).map(([key, content]) => {
          if (key === 'dashboard' || key === 'analytics' || ['all-leads', 'qualified', 'unqualified', 'no-response', 'blocked'].includes(key)) return null;
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