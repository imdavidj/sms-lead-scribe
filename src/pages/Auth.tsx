import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [afterCheckout, setAfterCheckout] = useState(false);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Bootstrap tenant idempotently
        supabase.functions.invoke('bootstrap', { body: { companyName: company || undefined } })
          .then(() => navigate('/dashboard', { replace: true }))
          .catch(() => navigate('/dashboard', { replace: true }));
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, company]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('afterCheckout')) {
      setMode('signup');
      setAfterCheckout(true);
    }
  }, [location.search]);

  const handleSignup = async () => {
    try {
      setLoading(true);
      const [firstName, ...rest] = fullName.trim().split(' ');
      const lastName = rest.join(' ');
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { first_name: firstName || null, last_name: lastName || null }
        }
      });
      if (error) throw error;
      toast.success('Check your email to confirm your account.');
    } catch (e: any) {
      toast.error(e.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Logged in');
    } catch (e: any) {
      // If login fails, check if this email has an active subscription
      try {
        const { data, error: fnError } = await supabase.functions.invoke('is-paid-email', { body: { email } });
        if (fnError) throw fnError;
        if (data?.paid) {
          toast.info('We found your payment. Create your account with the same email.');
          setMode('signup');
        } else {
          toast.info('No subscription found for this email. Redirecting to checkout...');
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout-public');
          if (checkoutError) throw checkoutError;
          if (checkoutData?.url) {
            window.location.href = checkoutData.url;
          } else {
            throw new Error('Unable to open checkout');
          }
        }
      } catch (inner: any) {
        toast.error(inner?.message || e?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) throw error;
      toast.success('Magic link sent! Check your email.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout-public');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Unable to open checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Button variant={mode === 'signup' ? 'default' : 'outline'} onClick={() => setMode('signup')}>Sign Up</Button>
              <Button variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')}>Log In</Button>
              <Button variant={mode === 'magic' ? 'default' : 'outline'} onClick={() => setMode('magic')}>Magic Link</Button>
            </div>
        </div>

        {afterCheckout && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 text-blue-800 p-3 text-sm">
            Payment complete. Create your account with the same email used at checkout.
          </div>
        )}

        {mode === 'signup' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Realty" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button className="w-full" onClick={handleSignup} disabled={loading}>Create account</Button>
              <p className="text-sm text-muted-foreground text-center">By signing up you agree to our Terms.</p>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email2">Email</Label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="password2">Password</Label>
                <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>Log in</Button>
              <Button variant="outline" className="w-full" onClick={handleCheckout} disabled={loading}>Start subscription</Button>
            </div>
          )}

          {mode === 'magic' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email3">Email</Label>
                <Input id="email3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button className="w-full" onClick={handleMagicLink} disabled={loading}>Send magic link</Button>
              <p className="text-xs text-muted-foreground text-center">We’ll email you a one-time login link. No password needed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
