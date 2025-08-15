import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedDashboardLayout } from "@/components/dashboard/EnhancedDashboardLayout";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useClientSetup } from "@/hooks/useClientSetup";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: subLoading, subscribed, refresh } = useSubscription();
  const { needsOnboarding, loading: setupLoading } = useClientSetup();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      
      // Check if user has stripe customer ID
      const { data: userData } = await supabase.from('users')
        .select('stripe_customer_id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      setHasStripeCustomer(!!userData?.stripe_customer_id);
      setChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleStartSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("User not authenticated");
      }

      const res = await fetch(`https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbHNuc2lkZ3FsYWNkeWF0dmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTUzNjIsImV4cCI6MjA2ODk5MTM2Mn0.cS3_Iihv1_VhuoGhWb8CBl72cJx3WNRi1SjmPV6ntl0",
        },
        body: JSON.stringify({ returnTo: `${location.origin}/return` }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || "create-checkout failed");
      }
      window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Unable to start subscription", description: e?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      // After redirecting user, we can refresh periodically if needed
      setTimeout(() => refresh(), 5000);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const portal = await fetch(`https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/customer-portal`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbHNuc2lkZ3FsYWNkeWF0dmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTUzNjIsImV4cCI6MjA2ODk5MTM2Mn0.cS3_Iihv1_VhuoGhWb8CBl72cJx3WNRi1SjmPV6ntl0",
        },
      });
      
      const portalData = await portal.json();
      
      if (!portal.ok) {
        console.error('Error response:', portalData);
        throw new Error(portalData.error || "customer-portal failed");
      }
      window.location.href = portalData.url;
    } catch (e: any) {
      toast({ title: "Unable to open portal", description: e?.message ?? "Please try again.", variant: "destructive" });
    }
  };

  // Show onboarding if user needs setup
  useEffect(() => {
    if (!checking && !setupLoading && needsOnboarding()) {
      setShowOnboarding(true);
    }
  }, [checking, setupLoading, needsOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refresh(); // Refresh subscription status
  };

  if (checking || subLoading || setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show onboarding if setup is incomplete
  if (showOnboarding) {
    return <OnboardingManager onComplete={handleOnboardingComplete} />;
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
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={!hasStripeCustomer}
              title={!hasStripeCustomer ? "Complete a subscription first" : ""}
            >
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <EnhancedDashboardLayout />;
};
export default Index;
