import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Subscribe() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<{ stripe_customer_id: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      // ensure session first
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        try {
          await supabase.auth.exchangeCodeForSession(window.location.href);
          ({ data: { session } } = await supabase.auth.getSession());
        } catch {}
      }

      if (!session?.user?.id) {
        window.location.replace("/auth?error=no_session");
        return;
      }

      // safe read after session exists
      const { data, error } = await supabase
        .from("users")
        .select("stripe_customer_id, subscription_status")
        .eq("id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("users select error:", error);
      }

      setMe(data ?? { stripe_customer_id: null });
      setReady(true);
    })();
  }, []);

  const handleStartSubscription = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
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
        throw new Error(data.error || "create-checkout failed");
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error in handleStartSubscription:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to start subscription process",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
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
        throw new Error(portalData.error || "customer-portal failed");
      }

      if (portalData?.url) {
        window.location.href = portalData.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error in handleManageSubscription:', error);
      let errorMessage = "Failed to access subscription management";
      
      if (error.message?.includes('No Stripe customer')) {
        errorMessage = "Please complete a subscription first to manage your account.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null; // or spinner

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground">
              Select a subscription plan to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Basic Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Basic Plan</CardTitle>
                <div className="text-3xl font-bold">$7.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Essential features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Basic analytics</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleStartSubscription}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    'Start Subscription'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Premium Plan</CardTitle>
                <div className="text-3xl font-bold">$19.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>All Basic features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Custom integrations</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleStartSubscription}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    'Start Subscription'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              Already have a subscription?
            </p>
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={loading || !me?.stripe_customer_id}
              title={!me?.stripe_customer_id ? "Complete a subscription first" : ""}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</>
              ) : (
                'Manage Subscription'
              )}
            </Button>
          </div>

          <div className="text-center mt-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}