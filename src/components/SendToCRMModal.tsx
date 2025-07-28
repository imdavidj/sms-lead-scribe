import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SendToCRMModalProps {
  conversation?: any;
}

export const SendToCRMModal = ({ conversation }: SendToCRMModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    webhookUrl: '',
    fname: '',
    lname: '',
    phone: conversation?.contact?.phone_e164 || '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    ask_price: '',
    beds: '',
    baths: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.webhookUrl.trim()) {
      setMessage({ type: 'error', text: 'Webhook URL is required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const payload = new URLSearchParams();
      payload.append('api_key', '2e465833-b9ae-4852-9efd-4031a77a2641');
      payload.append('leadsource', 'Lovable AI');
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'webhookUrl') {
          payload.append(key, value);
        }
      });

      const response = await fetch(formData.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.result === 'success') {
        setMessage({ type: 'success', text: 'Lead successfully sent to CRM!' });
        toast({
          title: "Success",
          description: "Lead successfully sent to CRM!",
        });
      } else if (result.result === 'fail') {
        setMessage({ type: 'error', text: `Failed to send lead: ${result.reason || 'Unknown error'}` });
      } else {
        setMessage({ type: 'error', text: 'Unexpected response from CRM' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="w-4 h-4 mr-2" />
          Send to CRM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send to CRM</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="webhookUrl">Webhook URL *</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
              placeholder="https://your-crm.com/webhook"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fname">First Name</Label>
              <Input
                id="fname"
                value={formData.fname}
                onChange={(e) => handleInputChange('fname', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lname">Last Name</Label>
              <Input
                id="lname"
                value={formData.lname}
                onChange={(e) => handleInputChange('lname', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                maxLength={2}
                placeholder="CA"
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                maxLength={5}
                pattern="[0-9]{5}"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ask_price">Asking Price</Label>
              <Input
                id="ask_price"
                type="number"
                value={formData.ask_price}
                onChange={(e) => handleInputChange('ask_price', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="beds">Beds</Label>
              <Input
                id="beds"
                type="number"
                value={formData.beds}
                onChange={(e) => handleInputChange('beds', e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="baths">Baths</Label>
              <Input
                id="baths"
                type="number"
                value={formData.baths}
                onChange={(e) => handleInputChange('baths', e.target.value)}
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {message && (
            <Card className={`${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-3 flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {message.text}
                </span>
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sending...' : 'Send to CRM'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};