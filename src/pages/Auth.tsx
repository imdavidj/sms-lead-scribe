import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast.error(e.message || 'Login failed');
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
            </div>
          </div>

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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
