import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Template {
  id: number;
  name: string;
  category: string;
  body: string;
}

export const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([
    { 
      id: 1, 
      name: 'Welcome Intro', 
      category: 'Intro', 
      body: 'Hey {{fname}}, thanks for your interest! I wanted to reach out personally to see if you have any questions about our services. Would you be available for a quick 15-minute call this week?' 
    },
    { 
      id: 2, 
      name: 'Follow-Up Check', 
      category: 'Follow-Up', 
      body: 'Hi {{fname}}, just following up on our previous conversation. Have you had a chance to review the information I sent over? I\'m here if you have any questions.' 
    },
    { 
      id: 3, 
      name: 'Price Objection', 
      category: 'Pushback', 
      body: 'I understand price is a consideration, {{fname}}. Let me share how other clients in similar situations have found the ROI to be worth the investment. Can we discuss this further?' 
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    body: ''
  });

  const openTemplateModal = (id: number | null = null) => {
    setEditingTemplateId(id);
    
    if (id) {
      const template = templates.find(t => t.id === id);
      if (template) {
        setFormData({
          name: template.name,
          category: template.category,
          body: template.body
        });
      }
    } else {
      setFormData({ name: '', category: '', body: '' });
    }
    
    setIsModalOpen(true);
  };

  const closeTemplateModal = () => {
    setIsModalOpen(false);
    setEditingTemplateId(null);
    setFormData({ name: '', category: '', body: '' });
  };

  const saveTemplate = () => {
    if (!formData.name.trim() || !formData.category || !formData.body.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    if (editingTemplateId) {
      setTemplates(templates.map(t => 
        t.id === editingTemplateId 
          ? { ...t, name: formData.name, category: formData.category, body: formData.body }
          : t
      ));
    } else {
      const newId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;
      setTemplates([...templates, {
        id: newId,
        name: formData.name,
        category: formData.category,
        body: formData.body
      }]);
    }
    
    closeTemplateModal();
  };

  const deleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const useTemplate = (id: number) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      // Try to find a chat input field and insert the template body
      const chatInput = document.querySelector('textarea[placeholder*="message"], textarea[placeholder*="chat"], input[placeholder*="message"], input[placeholder*="chat"]') as HTMLInputElement | HTMLTextAreaElement;
      if (chatInput) {
        chatInput.value = template.body;
        chatInput.focus();
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(template.body).then(() => {
          alert('Template copied to clipboard!');
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = template.body;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Template copied to clipboard!');
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">SMS Templates</h2>
          <p className="text-muted-foreground">Manage your SMS message templates</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => openTemplateModal(null)}
            >
              Create New Template
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTemplateId ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intro">Intro</SelectItem>
                    <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                    <SelectItem value="Pushback">Pushback</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-body">Message Body</Label>
                <Textarea
                  id="template-body"
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  placeholder="Enter your SMS template here. Use {{fname}} for first name, {{lname}} for last name..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeTemplateModal}>
                  Cancel
                </Button>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={saveTemplate}
                >
                  Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">No templates yet</h3>
          <p className="text-muted-foreground">Create your first SMS template to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">{template.name}</h3>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                  {template.category}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.body.substring(0, 100)}{template.body.length > 100 ? '...' : ''}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => useTemplate(template.id)}
                >
                  Use
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => openTemplateModal(template.id)}
                >
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteTemplate(template.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};