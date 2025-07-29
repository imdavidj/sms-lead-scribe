import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Automation {
  id: number;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export const Automations = () => {
  const [automations, setAutomations] = useState<Automation[]>([
    { 
      id: 1, 
      name: 'No Response Follow-Up', 
      trigger: '48h no reply', 
      action: 'Send Follow-Up SMS', 
      enabled: true 
    },
    { 
      id: 2, 
      name: 'On Qualified', 
      trigger: 'Lead Qualified', 
      action: 'Notify Slack', 
      enabled: false 
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAutomationId, setEditingAutomationId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger: '',
    action: '',
    enabled: true
  });

  const triggerOptions = [
    'No Reply After 24h',
    'No Reply After 48h', 
    'No Reply After 72h',
    'Lead Qualified',
    'Lead Unqualified',
    'Lead Status Change'
  ];

  const actionOptions = [
    'Send Follow-Up SMS',
    'Send Reminder SMS',
    'Notify Slack',
    'Mark As Qualified',
    'Mark As Unqualified',
    'Add to CRM'
  ];

  const openAutomationModal = (id: number | null = null) => {
    setEditingAutomationId(id);
    
    if (id) {
      const automation = automations.find(a => a.id === id);
      if (automation) {
        setFormData({
          name: automation.name,
          trigger: automation.trigger,
          action: automation.action,
          enabled: automation.enabled
        });
      }
    } else {
      setFormData({ name: '', trigger: '', action: '', enabled: true });
    }
    
    setIsModalOpen(true);
  };

  const closeAutomationModal = () => {
    setIsModalOpen(false);
    setEditingAutomationId(null);
    setFormData({ name: '', trigger: '', action: '', enabled: true });
  };

  const saveAutomation = () => {
    if (!formData.name.trim() || !formData.trigger || !formData.action) {
      alert('Please fill in all fields');
      return;
    }
    
    if (editingAutomationId) {
      setAutomations(automations.map(a => 
        a.id === editingAutomationId 
          ? { ...a, name: formData.name, trigger: formData.trigger, action: formData.action, enabled: formData.enabled }
          : a
      ));
    } else {
      const newId = automations.length > 0 ? Math.max(...automations.map(a => a.id)) + 1 : 1;
      setAutomations([...automations, {
        id: newId,
        name: formData.name,
        trigger: formData.trigger,
        action: formData.action,
        enabled: formData.enabled
      }]);
    }
    
    closeAutomationModal();
  };

  const deleteAutomation = (id: number) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      setAutomations(automations.filter(a => a.id !== id));
    }
  };

  const toggleAutomation = (id: number) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Automations</h2>
          <p className="text-muted-foreground">Configure automated follow-ups and notifications.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => openAutomationModal(null)}
            >
              + New Automation
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAutomationId ? 'Edit Automation' : 'Create New Automation'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="automation-name">Rule Name</Label>
                <Input
                  id="automation-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter automation name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="automation-trigger">Trigger</Label>
                <Select value={formData.trigger} onValueChange={(value) => setFormData({...formData, trigger: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="automation-action">Action</Label>
                <Select value={formData.action} onValueChange={(value) => setFormData({...formData, action: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="automation-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
                />
                <Label htmlFor="automation-enabled">Enabled</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeAutomationModal}>
                  Cancel
                </Button>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={saveAutomation}
                >
                  Save Automation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {automations.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">No automations yet</h3>
          <p className="text-muted-foreground">Create your first automation to get started.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell className="font-medium">{automation.name}</TableCell>
                  <TableCell>{automation.trigger}</TableCell>
                  <TableCell>{automation.action}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={automation.enabled}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                      />
                      <span className={`text-sm ${automation.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                        {automation.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openAutomationModal(automation.id)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteAutomation(automation.id)}
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
      )}
    </div>
  );
};