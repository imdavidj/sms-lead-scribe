import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Integration {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
}

interface AccountSettings {
  companyName: string;
  plan: string;
  sendCap: number;
}

export const Admin = () => {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', status: 'Active' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'User', status: 'Inactive' }
  ]);

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: 1, name: 'Slack Notifications', url: 'https://hooks.slack.com/services/...', enabled: true },
    { id: 2, name: 'CRM Webhook', url: 'https://api.crm.com/webhook', enabled: false },
    { id: 3, name: 'Zapier Integration', url: 'https://hooks.zapier.com/hooks/catch/...', enabled: true }
  ]);

  const [account, setAccount] = useState<AccountSettings>({
    companyName: 'SMS Qualifier Inc',
    plan: 'Pro',
    sendCap: 3000
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingIntegrationId, setEditingIntegrationId] = useState<number | null>(null);

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const [integrationFormData, setIntegrationFormData] = useState({
    name: '',
    url: '',
    enabled: true
  });

  // User functions
  const openUserModal = (id: number | null = null) => {
    setEditingUserId(id);
    
    if (id) {
      const user = users.find(u => u.id === id);
      if (user) {
        setUserFormData({
          name: user.name,
          email: user.email,
          role: user.role
        });
      }
    } else {
      setUserFormData({ name: '', email: '', role: '' });
    }
    
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUserId(null);
    setUserFormData({ name: '', email: '', role: '' });
  };

  const saveUser = () => {
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.role) {
      alert('Please fill in all fields');
      return;
    }
    
    if (editingUserId) {
      setUsers(users.map(u => 
        u.id === editingUserId 
          ? { ...u, name: userFormData.name, email: userFormData.email, role: userFormData.role }
          : u
      ));
    } else {
      const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      setUsers([...users, {
        id: newId,
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        status: 'Active'
      }]);
    }
    
    closeUserModal();
  };

  const deleteUser = (id: number) => {
    if (confirm('Are you sure you want to remove this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  // Integration functions
  const openIntegrationModal = (id: number | null = null) => {
    setEditingIntegrationId(id);
    
    if (id) {
      const integration = integrations.find(i => i.id === id);
      if (integration) {
        setIntegrationFormData({
          name: integration.name,
          url: integration.url,
          enabled: integration.enabled
        });
      }
    } else {
      setIntegrationFormData({ name: '', url: '', enabled: true });
    }
    
    setIsIntegrationModalOpen(true);
  };

  const closeIntegrationModal = () => {
    setIsIntegrationModalOpen(false);
    setEditingIntegrationId(null);
    setIntegrationFormData({ name: '', url: '', enabled: true });
  };

  const saveIntegration = () => {
    if (!integrationFormData.name.trim() || !integrationFormData.url.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    if (editingIntegrationId) {
      setIntegrations(integrations.map(i => 
        i.id === editingIntegrationId 
          ? { ...i, name: integrationFormData.name, url: integrationFormData.url, enabled: integrationFormData.enabled }
          : i
      ));
    } else {
      const newId = integrations.length > 0 ? Math.max(...integrations.map(i => i.id)) + 1 : 1;
      setIntegrations([...integrations, {
        id: newId,
        name: integrationFormData.name,
        url: integrationFormData.url,
        enabled: integrationFormData.enabled
      }]);
    }
    
    closeIntegrationModal();
  };

  const deleteIntegration = (id: number) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      setIntegrations(integrations.filter(i => i.id !== id));
    }
  };

  const toggleIntegration = (id: number) => {
    setIntegrations(integrations.map(i => 
      i.id === id ? { ...i, enabled: !i.enabled } : i
    ));
  };

  const saveAccountSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin</h2>
        <p className="text-muted-foreground">Manage users, integrations, and account settings.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users & Permissions</TabsTrigger>
          <TabsTrigger value="integrations">Webhooks & Integrations</TabsTrigger>
          <TabsTrigger value="settings">Account Settings</TabsTrigger>
        </TabsList>

        {/* Users & Permissions Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Users & Permissions</h3>
            
            <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => openUserModal(null)}
                >
                  Add User
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingUserId ? 'Edit User' : 'Add User'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Name</Label>
                    <Input
                      id="user-name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-role">Role</Label>
                    <Select value={userFormData.role} onValueChange={(value) => setUserFormData({...userFormData, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={closeUserModal}>
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={saveUser}
                    >
                      {editingUserId ? 'Save' : 'Invite'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(user.status)}`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openUserModal(user.id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteUser(user.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Webhooks & Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Webhooks & Integrations</h3>
            
            <Dialog open={isIntegrationModalOpen} onOpenChange={setIsIntegrationModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => openIntegrationModal(null)}
                >
                  Add Integration
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingIntegrationId ? 'Edit Integration' : 'Add Integration'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="integration-name">Name</Label>
                    <Input
                      id="integration-name"
                      value={integrationFormData.name}
                      onChange={(e) => setIntegrationFormData({...integrationFormData, name: e.target.value})}
                      placeholder="e.g., Slack, CRM, Zapier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="integration-url">Webhook URL</Label>
                    <Input
                      id="integration-url"
                      type="url"
                      value={integrationFormData.url}
                      onChange={(e) => setIntegrationFormData({...integrationFormData, url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="integration-enabled"
                      checked={integrationFormData.enabled}
                      onCheckedChange={(checked) => setIntegrationFormData({...integrationFormData, enabled: checked})}
                    />
                    <Label htmlFor="integration-enabled">Enabled</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={closeIntegrationModal}>
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={saveIntegration}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell className="font-medium">{integration.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{integration.url}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
                        <span className={`text-sm ${integration.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                          {integration.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openIntegrationModal(integration.id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteIntegration(integration.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-semibold">Account Settings</h3>
          
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <form onSubmit={saveAccountSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={account.companyName}
                    onChange={(e) => setAccount({...account, companyName: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-type">Plan Type</Label>
                  <Select value={account.plan} onValueChange={(value) => setAccount({...account, plan: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="send-cap">Send Cap (messages per month)</Label>
                <Input
                  id="send-cap"
                  type="number"
                  min="0"
                  value={account.sendCap}
                  onChange={(e) => setAccount({...account, sendCap: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};