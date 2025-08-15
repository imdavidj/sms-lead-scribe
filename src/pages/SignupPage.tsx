import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import { SITE_URL } from '@/lib/env';

const SignupPage = () => {
  console.log('SignupPage component loading...', window.location.href);
  console.log('Route match - SignupPage is rendering!');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPostCheckout, setIsPostCheckout] = useState(false);

  useEffect(() => {
    console.log('SignupPage mounted, location:', location.pathname, location.search);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    });

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session check:', session?.user?.email);
      if (session) {
        console.log('User already logged in, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    });

    // Check if this is a post-checkout signup
    const params = new URLSearchParams(location.search);
    const afterCheckout = params.get('afterCheckout');
    console.log('afterCheckout parameter:', afterCheckout);
    if (afterCheckout === 'true') {
      console.log('Setting post-checkout flag to true');
      setIsPostCheckout(true);
    }

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const handleSignup = async () => {
    console.log('Starting signup process...');
    
    if (!fullName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const [firstName, ...rest] = fullName.trim().split(' ');
      const lastName = rest.join(' ');
      const redirectUrl = `${SITE_URL}/confirm`;
      
      console.log('Attempting signup with:', { email, firstName, lastName, company, redirectUrl });
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { 
            first_name: firstName || null, 
            last_name: lastName || null,
            company: company || null
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      console.log('Signup successful:', data);
      toast.success('Account created! Check your email to confirm your account.');
      
      // If signup is successful and we have a session, redirect to dashboard
      if (data.session) {
        console.log('Session created, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
      
    } catch (e: any) {
      console.error('Signup error:', e);
      toast.error(e.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignup();
    }
  };

  console.log('Rendering SignupPage, isPostCheckout:', isPostCheckout);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isPostCheckout ? 'Complete Your Account' : 'Create Your Account'}
            </CardTitle>
            <p className="text-muted-foreground">
              {isPostCheckout 
                ? 'Payment successful! Now create your account to get started.' 
                : 'Join AI Qualify and start converting more leads today'
              }
            </p>
          </CardHeader>

          {isPostCheckout && (
            <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Payment completed successfully!
              </span>
            </div>
          )}
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="John Doe"
                  className="h-11"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your Real Estate Company"
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="you@company.com"
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Create a secure password"
                  className="h-11"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>
            </div>

            <Button 
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
              onClick={handleSignup} 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-purple-600 hover:text-purple-700"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;