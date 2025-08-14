import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImpersonationLogEntry {
  id: string;
  super_admin_user_id: string;
  impersonated_client_id: string;
  started_at: string;
  ended_at?: string;
  reason?: string;
  created_at: string;
}

export const ImpersonationLog: React.FC = () => {
  const [logs, setLogs] = useState<ImpersonationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('impersonation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading impersonation logs:', error);
      toast({
        title: "Failed to load impersonation logs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getStatusBadge = (log: ImpersonationLogEntry) => {
    if (log.ended_at) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Impersonation Audit Log
          </span>
          <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Ended</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.impersonated_client_id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {new Date(log.started_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.ended_at ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(log.ended_at).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDuration(log.started_at, log.ended_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {log.reason || 'No reason provided'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No impersonation logs found.
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading impersonation logs...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};