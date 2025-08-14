import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Settings, MessageSquare, CreditCard } from 'lucide-react';

interface ClientSetupWizardProps {
  onComplete: () => void;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

const ClientSetupWizard: React.FC<ClientSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    domain: ''
  });
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({
    accountSid: '',
    authToken: '',
    phoneNumber: ''
  });

  const steps = [
    { id: 1, title: 'Company Info', icon: Settings },
    { id: 2, title: 'SMS Setup', icon: MessageSquare },
    { id: 3, title: 'Complete', icon: CheckCircle }
  ];

  const handleCompanySubmit = async () => {
    if (!companyInfo.name) {
      toast.error('Company name is required');
      return;
    }

    setLoading(true);
    try {
      // Update client record with company info
      const { error } = await supabase
        .from('clients')
        .update({
          company: companyInfo.name,
          domain: companyInfo.domain,
          industry: companyInfo.industry
        })
        .eq('created_by_user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      setStep(2);
    } catch (error: any) {
      toast.error('Failed to save company info: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTwilioSubmit = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber) {
      toast.error('All Twilio fields are required');
      return;
    }

    setLoading(true);
    try {
      // Get current user's client_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.client_id) throw new Error('No client found');

      // Update client_config with Twilio credentials
      const { error } = await supabase
        .from('client_config')
        .update({
          twilio_account_sid: twilioConfig.accountSid,
          twilio_auth_token: twilioConfig.authToken,
          twilio_phone_number: twilioConfig.phoneNumber,
          is_verified: true
        })
        .eq('client_id', profile.client_id);

      if (error) throw error;

      // Mark client setup as complete
      await supabase
        .from('clients')
        .update({ is_setup_complete: true })
        .eq('created_by_user_id', (await supabase.auth.getUser()).data.user?.id);

      setStep(3);
      setTimeout(onComplete, 2000);
    } catch (error: any) {
      toast.error('Failed to save Twilio config: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                placeholder="Acme Real Estate"
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={companyInfo.industry}
                onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                placeholder="Real Estate"
              />
            </div>
            <div>
              <Label htmlFor="domain">Website Domain</Label>
              <Input
                id="domain"
                value={companyInfo.domain}
                onChange={(e) => setCompanyInfo({ ...companyInfo, domain: e.target.value })}
                placeholder="acmerealestate.com"
              />
            </div>
            <Button onClick={handleCompanySubmit} className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              <p>Connect your Twilio account to send and receive SMS messages.</p>
              <a 
                href="https://console.twilio.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get your Twilio credentials →
              </a>
            </div>
            <div>
              <Label htmlFor="accountSid">Account SID *</Label>
              <Input
                id="accountSid"
                value={twilioConfig.accountSid}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <Label htmlFor="authToken">Auth Token *</Label>
              <Input
                id="authToken"
                type="password"
                value={twilioConfig.authToken}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                placeholder="Your Twilio Auth Token"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={twilioConfig.phoneNumber}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleTwilioSubmit} className="flex-1" disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Setup Complete!</h3>
            <p className="text-muted-foreground">
              Your client account is now configured and ready to use.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Client Setup</CardTitle>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-2 mt-4">
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <Separator className={`w-8 ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetupWizard;