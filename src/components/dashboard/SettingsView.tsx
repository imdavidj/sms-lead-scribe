import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Bell, Shield, Smartphone, MessageSquare, 
  Brain, Database, Webhook, Key, Save, RefreshCw, CreditCard
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const settingSections: SettingSection[] = [
  {
    id: 'profile',
    title: 'Profile & Account',
    description: 'Manage your personal information and account settings',
    icon: User
  },
  {
    id: 'ai',
    title: 'AI Configuration',
    description: 'Customize AI behavior and response patterns',
    icon: Brain
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Control how and when you receive alerts',
    icon: Bell
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect external services and APIs',
    icon: Webhook
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    description: 'Manage your plan, payment method, and invoices',
    icon: CreditCard
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Manage authentication and data protection',
    icon: Shield
  }
];

export const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsNotifications: false,
    newLeads: true,
    systemUpdates: true,
    weeklyReports: true
  });

  const [aiSettings, setAiSettings] = useState({
    responseStyle: 'professional',
    autoRespond: true,
    learningMode: true,
    languageDetection: true
  });

  const [portalLoading, setPortalLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subscription, setSubscription] = useState<{ subscribed: boolean } | null>(null);
  const [subStatusLoading, setSubStatusLoading] = useState(false);

  useEffect(() => {
    setSubStatusLoading(true);
    supabase.functions.invoke('check-subscription')
      .then(({ data, error }) => {
        if (error) throw error;
        setSubscription({ subscribed: !!data?.subscribed });
      })
      .catch(() => setSubscription({ subscribed: false }))
      .finally(() => setSubStatusLoading(false));
  }, []);

  const handleManageSubscription = async () => (
    setPortalLoading(true),
    supabase.functions.invoke('customer-portal')
      .then(({ data, error }) => {
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, '_blank');
        } else {
          toast.error('No portal URL returned');
        }
      })
      .catch((e: any) => {
        toast.error(e?.message || 'No subscription found. Please start a subscription first.');
      })
      .finally(() => setPortalLoading(false))
  );

  const handleStartSubscription = async () => {
    setSubLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('No checkout URL returned');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to start checkout');
    } finally {
      setSubLoading(false);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <Input defaultValue="John" className="border-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <Input defaultValue="Smith" className="border-gray-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input defaultValue="john.smith@realestate.com" className="border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <Input defaultValue="+1 (555) 123-4567" className="border-gray-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <Input defaultValue="Premium Real Estate" className="border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number
            </label>
            <Input defaultValue="RE-12345678" className="border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Areas
            </label>
            <Input defaultValue="San Francisco, Oakland, Berkeley" className="border-gray-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">AI Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-Response</h4>
              <p className="text-sm text-gray-600">Automatically respond to new leads within 2 minutes</p>
            </div>
            <Switch
              checked={aiSettings.autoRespond}
              onCheckedChange={(checked) => setAiSettings({...aiSettings, autoRespond: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Learning Mode</h4>
              <p className="text-sm text-gray-600">Allow AI to learn from your manual responses</p>
            </div>
            <Switch
              checked={aiSettings.learningMode}
              onCheckedChange={(checked) => setAiSettings({...aiSettings, learningMode: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Language Detection</h4>
              <p className="text-sm text-gray-600">Automatically detect and respond in lead's language</p>
            </div>
            <Switch
              checked={aiSettings.languageDetection}
              onCheckedChange={(checked) => setAiSettings({...aiSettings, languageDetection: checked})}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Response Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Response Template
            </label>
            <textarea 
              className="w-full p-3 border border-gray-200 rounded-lg h-24 text-sm"
              defaultValue="Hi {name}! Thank you for your interest in {property}. I'd love to help you with your real estate needs. When would be a good time for a quick call?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Template
            </label>
            <textarea 
              className="w-full p-3 border border-gray-200 rounded-lg h-24 text-sm"
              defaultValue="Hi {name}, just following up on your interest in {property}. I have some great market insights to share. Are you available for a brief chat this week?"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Email Alerts</h4>
            <p className="text-sm text-gray-600">Receive email notifications for important events</p>
          </div>
          <Switch
            checked={notifications.emailAlerts}
            onCheckedChange={(checked) => setNotifications({...notifications, emailAlerts: checked})}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">SMS Notifications</h4>
            <p className="text-sm text-gray-600">Get text messages for urgent lead activity</p>
          </div>
          <Switch
            checked={notifications.smsNotifications}
            onCheckedChange={(checked) => setNotifications({...notifications, smsNotifications: checked})}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">New Lead Alerts</h4>
            <p className="text-sm text-gray-600">Instant notifications when new leads come in</p>
          </div>
          <Switch
            checked={notifications.newLeads}
            onCheckedChange={(checked) => setNotifications({...notifications, newLeads: checked})}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">System Updates</h4>
            <p className="text-sm text-gray-600">Notifications about system maintenance and updates</p>
          </div>
          <Switch
            checked={notifications.systemUpdates}
            onCheckedChange={(checked) => setNotifications({...notifications, systemUpdates: checked})}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Weekly Reports</h4>
            <p className="text-sm text-gray-600">Receive weekly performance summary emails</p>
          </div>
          <Switch
            checked={notifications.weeklyReports}
            onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Connected Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Twilio SMS</h4>
                <p className="text-sm text-gray-600">SMS messaging service</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Supabase</h4>
                <p className="text-sm text-gray-600">Database and authentication</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
          </div>
          
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <Input 
              defaultValue="https://your-domain.com/webhook" 
              className="border-gray-200"
              placeholder="Enter your webhook URL" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Rate Limit
            </label>
            <Input 
              defaultValue="100" 
              className="border-gray-200"
              placeholder="Requests per minute" 
            />
          </div>
        </CardContent>
      </Card>

        {/* Subscription moved to Billing section */}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <Input type="password" className="border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <Input type="password" className="border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <Input type="password" className="border-gray-200" />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Production API Key</h4>
              <p className="text-sm text-gray-600 font-mono">sk_prod_••••••••••••••••</p>
            </div>
            <Button variant="outline" size="sm" className="border-gray-200">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Test API Key</h4>
              <p className="text-sm text-gray-600 font-mono">sk_test_••••••••••••••••</p>
            </div>
            <Button variant="outline" size="sm" className="border-gray-200">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSettings();
      case 'ai': return renderAISettings();
      case 'notifications': return renderNotificationSettings();
      case 'integrations': return renderIntegrationSettings();
      case 'billing': return (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Billing & Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">Manage your subscription and payment methods via the Stripe Customer Portal.</p>
            {subStatusLoading ? (
              <div className="text-sm text-gray-500">Checking subscription...</div>
            ) : subscription?.subscribed ? (
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading} className="border-gray-200">
                  {portalLoading ? 'Opening...' : 'Manage Subscription'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>
                <Button onClick={handleStartSubscription} disabled={subLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {subLoading ? 'Redirecting...' : 'Start Subscription'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
      case 'security': return renderSecuritySettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 to-slate-600 rounded-3xl p-8 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
          <Settings className="w-8 h-8" />
          System Settings
        </h1>
        <p className="text-white/80 text-lg">Configure your AI assistant and platform preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card className="border-gray-200">
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-none first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-500">{section.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderContent()}
          
          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};