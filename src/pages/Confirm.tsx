import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Confirm() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if we have a code in the URL hash or search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Try to get code from either hash or search params
        const code = hashParams.get('access_token') || searchParams.get('code');
        
        if (code) {
          console.log('Found verification code, exchanging for session...');
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            // Redirect to auth page with error
            navigate('/auth?error=confirmation_failed');
            return;
          }

          console.log('Successfully exchanged code for session:', data);
          
          // Session is now established, redirect to subscription page
          setTimeout(() => {
            navigate('/subscribe');
          }, 1000);
        } else {
          console.log('No verification code found, redirecting to auth...');
          // No code found, redirect to auth
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error during email confirmation:', error);
        navigate('/auth?error=confirmation_failed');
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Verifying your email</h2>
          <p className="text-muted-foreground">
            Please wait while we confirm your email address...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}