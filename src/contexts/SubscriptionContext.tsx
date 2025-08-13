import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionContextValue = {
  loading: boolean;
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  error: string | null;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue>({
  loading: true,
  subscribed: false,
  subscriptionTier: null,
  subscriptionEnd: null,
  error: null,
  refresh: async () => {},
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const result = data as { subscribed?: boolean; subscription_tier?: string | null; subscription_end?: string | null };
      setSubscribed(!!result?.subscribed);
      setSubscriptionTier(result?.subscription_tier ?? null);
      setSubscriptionEnd(result?.subscription_end ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to check subscription");
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Defer to avoid deadlocks in auth callback
        setTimeout(() => { refresh(); }, 0);
      } else {
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        setLoading(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        refresh();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  return (
    <SubscriptionContext.Provider value={{ loading, subscribed, subscriptionTier, subscriptionEnd, error, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
