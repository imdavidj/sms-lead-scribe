import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { handlePostCheckoutFlow } from '@/lib/subscription-utils';
import { useToast } from '@/components/ui/use-toast';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');
  const [subscription, setSubscription] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const verifySubscription = async () => {
      try {
        setStatus('checking');
        const result = await handlePostCheckoutFlow();
        
        if (result.success) {
          setStatus('success');
          setSubscription(result.subscription);
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated.",
          });
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/app');
          }, 3000);
        } else if (result.needsActivation) {
          setStatus('pending');
          toast({
            title: "Payment Received",
            description: "We're activating your subscription. This may take a few moments.",
            variant: "default"
          });
        } else {
          setStatus('error');
          toast({
            title: "Verification Failed",
            description: result.error || "Unable to verify your subscription.",
            variant: "destructive"
          });
        }
      } catch (error) {
        setStatus('error');
        toast({
          title: "Error",
          description: "Something went wrong verifying your payment.",
          variant: "destructive"
        });
      }
    };

    verifySubscription();
  }, [sessionId, navigate, toast]);

  const handleContinue = () => {
    navigate('/app');
  };

  const handleRetry = async () => {
    setStatus('checking');
    const result = await handlePostCheckoutFlow();
    
    if (result.success) {
      setStatus('success');
      setSubscription(result.subscription);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'checking' && 'Verifying Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'pending' && 'Activating Subscription...'}
            {status === 'error' && 'Payment Verification'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {status === 'checking' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Please wait while we verify your payment and activate your subscription...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-600">
                  Welcome to AI Qualify!
                </p>
                <p className="text-muted-foreground">
                  Your {subscription?.subscription_tier} subscription is now active.
                </p>
                {subscription?.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    Next billing: {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
            </>
          )}

          {status === 'pending' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-yellow-600" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-yellow-600">
                  Payment Received
                </p>
                <p className="text-muted-foreground">
                  We're processing your subscription. This usually takes just a few seconds.
                </p>
              </div>
              <Button onClick={handleRetry} variant="outline" className="w-full">
                Check Again
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-red-600">
                  Verification Issue
                </p>
                <p className="text-muted-foreground">
                  We're having trouble verifying your subscription. Please try again or contact support.
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Retry Verification
                </Button>
                <Button onClick={handleContinue} variant="outline" className="w-full">
                  Continue to Dashboard
                </Button>
              </div>
            </>
          )}

          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};