import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedDashboardLayout } from "@/components/dashboard/EnhancedDashboardLayout";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";


const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: subLoading, subscribed, refresh } = useSubscription();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      
      setUser(session.user);
      
      setChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleStartSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast({ title: "Unable to start subscription", description: e?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      // After redirecting user, we can refresh periodically if needed
      setTimeout(() => refresh(), 5000);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (e: any) {
      toast({ title: "Unable to open portal", description: e?.message ?? "Please try again.", variant: "destructive" });
    }
  };

  if (checking || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <h1 className="text-xl font-semibold">Subscription required</h1>
          <p className="text-sm text-muted-foreground">
            Your account doesn't have an active subscription yet. Activate your plan to access the dashboard.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleStartSubscription}>Start Subscription</Button>
            <Button variant="outline" onClick={handleManageSubscription}>Manage Subscription</Button>
          </div>
        </div>
      </div>
    );
  }

  return <EnhancedDashboardLayout />;
};
export default Index;
