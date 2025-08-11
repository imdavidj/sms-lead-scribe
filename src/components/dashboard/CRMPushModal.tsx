import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lead } from '@/types/dashboard';
import { useToast } from "@/hooks/use-toast";

interface CRMPushModalProps {
  lead: Lead;
  onClose: () => void;
}

export const CRMPushModal: React.FC<CRMPushModalProps> = ({ lead, onClose }) => {
  const { toast } = useToast();

  const handlePushToCRM = () => {
    // Here you would implement the actual CRM push logic
    // For now, we'll just show a success toast
    toast({
      title: "Success!",
      description: `Lead ${lead.name} has been pushed to CRM successfully.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Push to CRM</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900">{lead.name}</div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                AI Score: {lead.aiScore}/100
              </Badge>
            </div>
            <div className="text-sm text-gray-600">{lead.property}</div>
            <div className="text-sm text-gray-600">
              {lead.value} • Timeline: {lead.timeline}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select CRM
            </label>
            <Select defaultValue="salesforce">
              <SelectTrigger className="border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="salesforce">Salesforce (webhook configured)</SelectItem>
                <SelectItem value="hubspot">HubSpot (webhook configured)</SelectItem>
                <SelectItem value="pipedrive">Pipedrive</SelectItem>
                <SelectItem value="custom">Custom Webhook URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handlePushToCRM} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Push to CRM
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 border-gray-200 hover:bg-gray-50">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};