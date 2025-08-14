import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Building, 
  Mail, 
  Eye, 
  X,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

export const ClientSwitcher: React.FC = () => {
  const {
    isSuperAdmin,
    clients,
    currentImpersonation,
    startImpersonation,
    endImpersonation,
    refreshClients
  } = useSuperAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [impersonationReason, setImpersonationReason] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  if (!isSuperAdmin) {
    return null;
  }

  const handleImpersonate = async (clientId: string) => {
    setSelectedClientId(clientId);
    setIsModalOpen(true);
  };

  const confirmImpersonation = async () => {
    const success = await startImpersonation(selectedClientId, impersonationReason);
    if (success) {
      setIsModalOpen(false);
      setImpersonationReason('');
      setSelectedClientId('');
    }
  };

  const handleEndImpersonation = async () => {
    await endImpersonation();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-orange-100 text-orange-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Impersonation Status */}
      {currentImpersonation && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-orange-600" />
              Currently Impersonating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-orange-900">
                  Client: {currentImpersonation.impersonated_client_id}
                </p>
                <p className="text-sm text-orange-700">
                  Started: {new Date(currentImpersonation.started_at).toLocaleString()}
                </p>
                {currentImpersonation.reason && (
                  <p className="text-sm text-orange-700">
                    Reason: {currentImpersonation.reason}
                  </p>
                )}
              </div>
              <Button 
                onClick={handleEndImpersonation}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <X className="h-4 w-4 mr-2" />
                End Impersonation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Super Admin Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Client Management
            </span>
            <Button onClick={refreshClients} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>SMS Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.client_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.company || client.client_name}</p>
                        <p className="text-sm text-muted-foreground">{client.client_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(client.subscription_status)}>
                        {client.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanColor(client.subscription_plan)}>
                        {client.subscription_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {client.total_users}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.sms_used.toLocaleString()} / {client.sms_limit.toLocaleString()}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((client.sms_used / client.sms_limit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleImpersonate(client.client_id)}
                        size="sm"
                        variant="outline"
                        disabled={currentImpersonation?.impersonated_client_id === client.client_id}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {currentImpersonation?.impersonated_client_id === client.client_id 
                          ? 'Current' 
                          : 'Impersonate'
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {clients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No clients found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Impersonation Confirmation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Client Impersonation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to impersonate client: <strong>{selectedClientId}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              This action will be logged for security audit purposes.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for impersonation</Label>
              <Input
                id="reason"
                value={impersonationReason}
                onChange={(e) => setImpersonationReason(e.target.value)}
                placeholder="e.g., Customer support, Bug investigation"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmImpersonation}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Start Impersonation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};