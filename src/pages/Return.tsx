import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Return() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'timeout' | 'error'>('checking');
  const [pollingCount, setPollingCount] = useState(0);
  const maxPollingAttempts = 30; // 30 seconds of polling

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    const checkSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setStatus('error');
          return;
        }

        const res = await fetch(`https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/check-subscription`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbHNuc2lkZ3FsYWNkeWF0dmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTUzNjIsImV4cCI6MjA2ODk5MTM2Mn0.cS3_Iihv1_VhuoGhWb8CBl72cJx3WNRi1SjmPV6ntl0",
          },
        });

        const data = await res.json();

        if (res.ok && data.subscribed === true) {
          setStatus('success');
          clearInterval(pollInterval);
          clearTimeout(timeoutTimer);
          
          // Wait a moment to show success, then redirect
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setPollingCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setPollingCount(prev => prev + 1);
      }
    };

    // Start polling immediately
    checkSubscription();

    // Set up polling interval (every 1 second)
    pollInterval = setInterval(checkSubscription, 1000);

    // Set up timeout (30 seconds)
    timeoutTimer = setTimeout(() => {
      clearInterval(pollInterval);
      setStatus('timeout');
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
    };
  }, [navigate]);

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing your subscription</h2>
            <p className="text-muted-foreground mb-4">
              Please wait while we confirm your payment...
            </p>
            <div className="text-sm text-muted-foreground">
              Checking... ({Math.min(pollingCount, maxPollingAttempts)}/{maxPollingAttempts})
            </div>
          </>
        );
      
      case 'success':
        return (
          <>
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Subscription activated!</h2>
            <p className="text-muted-foreground mb-4">
              Your subscription has been successfully activated. Redirecting to dashboard...
            </p>
          </>
        );
      
      case 'timeout':
        return (
          <>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Taking longer than expected</h2>
            <p className="text-muted-foreground mb-4">
              Your payment is being processed. This can take a few minutes.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full"
              >
                Continue to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Check Again
              </Button>
            </div>
          </>
        );
      
      case 'error':
        return (
          <>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              We encountered an error while checking your subscription status.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/subscribe')} 
                className="w-full"
              >
                Back to Subscription
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}