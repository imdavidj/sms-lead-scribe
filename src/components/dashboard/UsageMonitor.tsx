import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsageData {
  sms_used: number;
  sms_limit: number;
  subscription_plan: string;
  client_name: string;
}

const UsageMonitor: React.FC = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
    
    // Set up real-time updates
    const interval = setInterval(loadUsageData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUsageData = async () => {
    try {
      // Get current user's client_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.client_id) {
        throw new Error('No client found');
      }

      // Get usage data
      const { data: clientConfig, error } = await supabase
        .from('client_config')
        .select('sms_used, sms_limit, subscription_plan, client_name')
        .eq('client_id', profile.client_id)
        .single();

      if (error) throw error;
      setUsage(clientConfig);
    } catch (error: any) {
      console.error('Error loading usage data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!usage) return 0;
    return Math.round((usage.sms_used / usage.sms_limit) * 100);
  };

  const getUsageStatus = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return { color: 'destructive', icon: AlertTriangle, text: 'Critical' };
    if (percentage >= 75) return { color: 'warning', icon: AlertTriangle, text: 'Warning' };
    return { color: 'default', icon: CheckCircle, text: 'Good' };
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error('Failed to open upgrade page: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No usage data available</p>
        </CardContent>
      </Card>
    );
  }

  const percentage = getUsagePercentage();
  const status = getUsageStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Usage
          </div>
          <Badge variant={status.color as any} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Messages sent this month</span>
            <span className="font-medium">
              {usage.sms_used.toLocaleString()} / {usage.sms_limit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-3 ${percentage >= 90 ? 'bg-red-100' : percentage >= 75 ? 'bg-yellow-100' : 'bg-green-100'}`}
          />
          <div className="text-xs text-muted-foreground">
            {percentage}% of monthly limit used
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Current Plan</div>
            <div className="font-medium capitalize">{usage.subscription_plan}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Remaining</div>
            <div className="font-medium">
              {(usage.sms_limit - usage.sms_used).toLocaleString()} messages
            </div>
          </div>
        </div>

        {percentage >= 75 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Running low on messages?</div>
                <div className="text-xs text-muted-foreground">
                  Upgrade your plan for unlimited messaging
                </div>
              </div>
              <Button size="sm" onClick={handleUpgrade}>
                <Zap className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageMonitor;