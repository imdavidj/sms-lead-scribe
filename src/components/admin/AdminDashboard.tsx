import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  Plus,
  Mail,
  Building,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  subscription_status: string;
  subscription_plan: string;
  created_at: string;
  is_setup_complete: boolean;
}

interface ClientStats {
  total_clients: number;
  active_clients: number;
  trial_clients: number;
  total_sms_sent: number;
  revenue_estimate: number;
}

const AdminDashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    total_clients: 0,
    active_clients: 0,
    trial_clients: 0,
    total_sms_sent: 0,
    revenue_estimate: 0
  });
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Calculate stats
      const totalClients = clientsData?.length || 0;
      const activeClients = clientsData?.filter(c => c.subscription_status === 'active').length || 0;
      const trialClients = clientsData?.filter(c => c.subscription_status === 'trial').length || 0;

      // Get SMS usage from client_config
      const { data: configData } = await supabase
        .from('client_config')
        .select('sms_used');
      
      const totalSms = configData?.reduce((sum, config) => sum + (config.sms_used || 0), 0) || 0;

      setStats({
        total_clients: totalClients,
        active_clients: activeClients,
        trial_clients: trialClients,
        total_sms_sent: totalSms,
        revenue_estimate: activeClients * 1000 // Assuming $1000/month per active client
      });

    } catch (error: any) {
      toast.error('Failed to load admin data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error('Email is required');
      return;
    }

    try {
      // Get current user's client_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.client_id) throw new Error('No client found');

      // Get client UUID from client_id
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('created_by_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!client) throw new Error('Client not found');

      // Create invite
      const { error } = await supabase
        .from('client_invites')
        .insert({
          client_id: client.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by_user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error: any) {
      toast.error('Failed to send invitation: ' + error.message);
    }
  };

  const updateClientPlan = async (clientId: string, newPlan: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ subscription_plan: newPlan })
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Client plan updated');
      loadData();
    } catch (error: any) {
      toast.error('Failed to update plan: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={loadData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active_clients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sms_sent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Est. Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue_estimate.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{client.company || client.name}</h3>
                        <Badge variant={client.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {client.subscription_status}
                        </Badge>
                        {!client.is_setup_complete && (
                          <Badge variant="destructive">Setup Incomplete</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={client.subscription_plan}
                        onChange={(e) => updateClientPlan(client.id, e.target.value)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="inviteRole">Role</Label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button onClick={handleInviteUser} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced settings and configuration options will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;