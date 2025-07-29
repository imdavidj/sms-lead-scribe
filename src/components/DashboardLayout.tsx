import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { ConversationsList } from './ConversationsList';
import { ConversationThread } from './ConversationThread';
import { LeadsView } from './LeadsView';
import { UploadLists } from './UploadLists';
import { Templates } from './Templates';
import { Automations } from './Automations';
import { Admin } from './Admin';
import { Help } from './Help';
import { Conversation } from '@/types/conversation';
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock, Users, Calendar, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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

// Analytics hook for Supabase data
const useAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    responseRate: '0%',
    qualificationRate: '0%',
    blockRate: '0%',
    timeToQualify: '0h 0m',
    leadsPerDay: '0'
  });
  const [loading, setLoading] = useState(true);

  const updateAnalyticsUI = (obj: any) => {
    setAnalytics({
      responseRate: obj.responseRate || '0%',
      qualificationRate: obj.qualificationRate || '0%',
      blockRate: obj.blockRate || '0%',
      timeToQualify: obj.timeToQualify || '0h 0m',
      leadsPerDay: obj.leadsPerDay || '0'
    });
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // assume you've stored KPIs in a table named 'analytics_metrics'
      const { data, error } = await supabase
        .from('analytics_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error(error);
        return;
      }
      
      const latest = data[0] || {};
      updateAnalyticsUI({
        responseRate: (latest as any).response_rate,
        qualificationRate: (latest as any).qualification_rate,
        blockRate: (latest as any).block_rate,
        timeToQualify: (latest as any).avg_time_to_qualify,
        leadsPerDay: (latest as any).leads_per_day
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return { analytics, loading, refetch: loadAnalytics };
};

const DateRangeSelector = ({ onDateRangeChange }: { onDateRangeChange: (range: string) => void }) => {
  const [selectedRange, setSelectedRange] = useState('Past 7 days');
  const [customFromDate, setCustomFromDate] = useState<Date>();
  const [customToDate, setCustomToDate] = useState<Date>();
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    if (range !== 'Custom date range') {
      setShowCustomPicker(false);
    } else {
      setShowCustomPicker(true);
    }
    onDateRangeChange(range);
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Date Range:</span>
      </div>
      
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Today">Today</SelectItem>
          <SelectItem value="Past 7 days">Past 7 days</SelectItem>
          <SelectItem value="Monthly">Monthly</SelectItem>
          <SelectItem value="All Time">All Time</SelectItem>
          <SelectItem value="Custom date range">Custom date range</SelectItem>
        </SelectContent>
      </Select>

      {showCustomPicker && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !customFromDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {customFromDate ? format(customFromDate, "MMM dd") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={customFromDate}
                onSelect={setCustomFromDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <span className="text-gray-400">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !customToDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {customToDate ? format(customToDate, "MMM dd") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={customToDate}
                onSelect={setCustomToDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

const AnalyticsKPICards = () => {
  const { analytics, loading } = useAnalytics();
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm border-l-4 border-l-gray-200 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <div className="text-sm font-medium text-gray-600">Response Rate</div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{analytics.responseRate}</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div className="text-sm font-medium text-gray-600">Qualification Rate</div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{analytics.qualificationRate}</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <div className="flex items-center gap-3 mb-3">
          <XCircle className="h-6 w-6 text-red-500" />
          <div className="text-sm font-medium text-gray-600">Block Rate</div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{analytics.blockRate}</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <div className="text-sm font-medium text-gray-600">Time to Qualify</div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{analytics.timeToQualify}</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <div className="flex items-center gap-3 mb-3">
          <Users className="h-6 w-6 text-purple-600" />
          <div className="text-sm font-medium text-gray-600">Leads per Day</div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{analytics.leadsPerDay}</div>
      </div>
    </div>
  );
};

const AnalyticsChart = () => {
  const chartInstance = useRef<any>(null);

  const loadChartData = async () => {
    const { data, error } = await supabase
      .from('analytics_metrics')
      .select('date, response_rate')
      .order('date', { ascending: true })
      .limit(14);
    if (error) {
      console.error(error);
      return [];
    }
    return data.map(r => ({ date: r.date, value: parseFloat(r.response_rate) }));
  };

  useEffect(() => {
    const initChart = async () => {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      loadChartData().then(points => {
        const ctx = (document.getElementById('analyticsChart') as HTMLCanvasElement)?.getContext('2d');
        if (!ctx) return;
        
        chartInstance.current = new (window as any).Chart(ctx, {
          type: 'line',
          data: {
            labels: points.map(p => p.date),
            datasets: [{
              label: 'Response Rate (%)',
              data: points.map(p => p.value),
              fill: false,
              tension: 0.1
            }]
          },
          options: {
            scales: {
              y: { beginAtZero: true, ticks: { callback: (v: any) => v + '%' } }
            }
          }
        });
      });
    };

    initChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm border-l-4 border-l-green-500">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance Trends</h3>
      <div className="w-full h-96 relative">
        <canvas id="analyticsChart" width="400" height="200"></canvas>
      </div>
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
          <DateRangeSelector onDateRangeChange={(range) => console.log('Date range changed to:', range)} />
          <AnalyticsKPICards />
          <AnalyticsChart />
        </div>

        {/* Leads Sections */}
        {['all-leads', 'qualified', 'unqualified', 'no-response', 'blocked'].includes(activePage) && (
          <div className={`section`}>
            <LeadsView />
          </div>
        )}

        {/* Upload Lists Sections */}
        {['saved-lists', 'used-lists'].includes(activePage) && (
          <div className={`section`}>
            <UploadLists />
          </div>
        )}

        {/* Templates Section */}
        {activePage === 'templates' && (
          <div className={`section`}>
            <Templates />
          </div>
        )}

        {/* Automations Section */}
        {activePage === 'automations' && (
          <div className={`section`}>
            <Automations />
          </div>
        )}

        {/* Admin Sections */}
        {['users', 'webhooks', 'settings'].includes(activePage) && (
          <div className={`section`}>
            <Admin />
          </div>
        )}

        {/* Help Section */}
        {activePage === 'help' && (
          <div className={`section`}>
            <Help />
          </div>
        )}

        {/* All other sections */}
        {Object.entries(pageContent).map(([key, content]) => {
          if (key === 'dashboard' || key === 'analytics' || key === 'templates' || key === 'automations' || key === 'help' ||
              ['all-leads', 'qualified', 'unqualified', 'no-response', 'blocked', 'saved-lists', 'used-lists', 'users', 'webhooks', 'settings'].includes(key)) return null;
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