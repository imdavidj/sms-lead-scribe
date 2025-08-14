import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

export interface SetupStatus {
  setup_completed: boolean;
  company_complete: boolean;
  twilio_complete: boolean;
  twilio_verified: boolean;
}

export interface ClientProfile {
  client_id: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export const useClientSetup = () => {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { getCurrentClientContext } = useSuperAdmin();

  const fetchSetupStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if super admin is impersonating a client
      const impersonatedClientId = getCurrentClientContext();
      let targetClientId: string;

      if (impersonatedClientId) {
        // Use impersonated client ID
        targetClientId = impersonatedClientId;
        setProfile({
          client_id: impersonatedClientId,
          role: 'super_admin_impersonating',
          first_name: 'Super',
          last_name: 'Admin'
        });
      } else {
        // Get user profile normally
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('client_id, role, first_name, last_name')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData?.client_id) {
          throw new Error('No client associated with user');
        }

        setProfile(profileData as ClientProfile);
        targetClientId = profileData.client_id;
      }

      // Get setup status using the database function
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_setup_status', { p_client_id: targetClientId });

      if (statusError) throw statusError;
      
      if (statusData && statusData.length > 0) {
        setSetupStatus(statusData[0] as SetupStatus);
      } else {
        // Default status if no data found
        setSetupStatus({
          setup_completed: false,
          company_complete: false,
          twilio_complete: false,
          twilio_verified: false
        });
      }
    } catch (err: any) {
      console.error('Error fetching setup status:', err);
      setError(err.message);
      toast({
        title: "Failed to load setup status",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetupStep = async (step: string, completed: boolean = true) => {
    if (!profile?.client_id) return false;

    try {
      const { data, error } = await supabase
        .rpc('update_setup_progress', {
          p_client_id: profile.client_id,
          p_step: step,
          p_completed: completed
        });

      if (error) throw error;

      // Refresh setup status
      await fetchSetupStatus();
      
      return data; // Returns true if all setup is complete
    } catch (err: any) {
      console.error('Error updating setup step:', err);
      toast({
        title: "Failed to update setup",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const markCompanySetupComplete = async (companyData: any) => {
    try {
      // Update client information
      if (profile?.client_id) {
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            name: companyData.company,
            company: companyData.company,
            industry: companyData.industry,
            domain: companyData.domain,
            updated_at: new Date().toISOString()
          })
          .eq('created_by_user_id', (await supabase.auth.getUser()).data.user?.id);

        if (clientError) throw clientError;
      }

      // Mark company step as complete
      return await updateSetupStep('company', true);
    } catch (err: any) {
      console.error('Error completing company setup:', err);
      toast({
        title: "Failed to save company information",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const markTwilioSetupComplete = async (twilioData: any) => {
    try {
      if (!profile?.client_id) return false;

      // Update client_config with Twilio settings
      const { error: configError } = await supabase
        .from('client_config')
        .update({
          twilio_configured: true,
          twilio_phone_number: twilioData.phoneNumber,
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', profile.client_id);

      if (configError) throw configError;

      // Mark twilio step as complete
      return await updateSetupStep('twilio', true);
    } catch (err: any) {
      console.error('Error completing Twilio setup:', err);
      toast({
        title: "Failed to save Twilio configuration",
        description: err.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const needsOnboarding = () => {
    return setupStatus && !setupStatus.setup_completed;
  };

  const getNextRequiredStep = () => {
    if (!setupStatus) return null;
    
    if (!setupStatus.company_complete) return 'company';
    if (!setupStatus.twilio_complete) return 'twilio';
    return null;
  };

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  return {
    setupStatus,
    profile,
    loading,
    error,
    needsOnboarding,
    getNextRequiredStep,
    updateSetupStep,
    markCompanySetupComplete,
    markTwilioSetupComplete,
    refetch: fetchSetupStatus
  };
};