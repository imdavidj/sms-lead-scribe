import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Users, 
  Building, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { ClientSwitcher } from './ClientSwitcher';
import { ImpersonationLog } from './ImpersonationLog';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

export const SuperAdminDashboard: React.FC = () => {
  const { isSuperAdmin, clients, currentImpersonation } = useSuperAdmin();

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-red-700">Super admin privileges required</p>
        </div>
      </div>
    );
  }

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.subscription_status === 'active').length;
  const totalUsers = clients.reduce((sum, client) => sum + client.total_users, 0);
  const totalSmsUsed = clients.reduce((sum, client) => sum + client.sms_used, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform-wide management and client impersonation</p>
        </div>
        {currentImpersonation && (
          <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
            Impersonating: {currentImpersonation.impersonated_client_id}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Across all plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              {totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Platform-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              SMS Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSmsUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <ClientSwitcher />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <ImpersonationLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};