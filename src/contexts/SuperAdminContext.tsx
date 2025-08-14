import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientInfo {
  client_id: string;
  client_name: string;
  company: string;
  email: string;
  subscription_status: string;
  subscription_plan: string;
  created_at: string;
  total_users: number;
  sms_used: number;
  sms_limit: number;
}

interface ImpersonationStatus {
  log_id: string;
  impersonated_client_id: string;
  started_at: string;
  reason?: string;
}

interface SuperAdminContextValue {
  isSuperAdmin: boolean;
  loading: boolean;
  clients: ClientInfo[];
  currentImpersonation: ImpersonationStatus | null;
  startImpersonation: (clientId: string, reason?: string) => Promise<boolean>;
  endImpersonation: () => Promise<boolean>;
  refreshClients: () => Promise<void>;
  getCurrentClientContext: () => string | null;
}

const SuperAdminContext = createContext<SuperAdminContextValue | undefined>(undefined);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

interface SuperAdminProviderProps {
  children: ReactNode;
}

export const SuperAdminProvider: React.FC<SuperAdminProviderProps> = ({ children }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [currentImpersonation, setCurrentImpersonation] = useState<ImpersonationStatus | null>(null);
  const { toast } = useToast();

  const checkSuperAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (error) throw error;
      setIsSuperAdmin(data || false);
    } catch (error: any) {
      console.error('Error checking super admin status:', error);
      setIsSuperAdmin(false);
    }
  };

  const loadClients = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // Try the original function first
      const { data: clientsData, error: clientsError } = await supabase.rpc('get_all_clients_for_super_admin');
      
      if (clientsData && clientsData.length > 0) {
        setClients(clientsData);
        return;
      }
      
      // Fallback: Load demo clients from client_config for testing
      const { data: configData, error: configError } = await supabase
        .from('client_config')
        .select('*');
      
      if (configError) throw configError;
      
      // Transform client_config data to match expected format
      const transformedClients = (configData || []).map(config => ({
        client_id: config.client_id,
        client_name: config.client_name,
        company: config.client_name,
        email: `admin@${config.client_name.toLowerCase().replace(/\s+/g, '')}.com`,
        subscription_status: config.subscription_plan === 'trial' ? 'trial' : 'active',
        subscription_plan: config.subscription_plan,
        created_at: config.created_at,
        total_users: 1, // Demo data
        sms_used: config.sms_used || 0,
        sms_limit: config.sms_limit || 100
      }));
      
      setClients(transformedClients);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      toast({
        title: "Failed to load clients",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadCurrentImpersonation = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data, error } = await supabase.rpc('get_current_impersonation');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentImpersonation(data[0]);
      } else {
        setCurrentImpersonation(null);
      }
    } catch (error: any) {
      console.error('Error loading impersonation status:', error);
    }
  };

  const startImpersonation = async (clientId: string, reason?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('start_impersonation', {
        target_client_id: clientId,
        reason: reason || 'Customer support'
      });

      if (error) throw error;

      await loadCurrentImpersonation();
      
      toast({
        title: "Impersonation started",
        description: `Now viewing as client: ${clientId}`,
        variant: "default"
      });

      return true;
    } catch (error: any) {
      console.error('Error starting impersonation:', error);
      toast({
        title: "Failed to start impersonation",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const endImpersonation = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('end_impersonation');
      if (error) throw error;

      setCurrentImpersonation(null);
      
      toast({
        title: "Impersonation ended",
        description: "Returned to super admin view",
        variant: "default"
      });

      return true;
    } catch (error: any) {
      console.error('Error ending impersonation:', error);
      toast({
        title: "Failed to end impersonation",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const refreshClients = async () => {
    await loadClients();
  };

  const getCurrentClientContext = (): string | null => {
    return currentImpersonation?.impersonated_client_id || null;
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await checkSuperAdminStatus();
      setLoading(false);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadClients();
      loadCurrentImpersonation();
    }
  }, [isSuperAdmin]);

  const value: SuperAdminContextValue = {
    isSuperAdmin,
    loading,
    clients,
    currentImpersonation,
    startImpersonation,
    endImpersonation,
    refreshClients,
    getCurrentClientContext
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};