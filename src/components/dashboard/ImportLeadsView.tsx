import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const ImportLeadsView = () => {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [listName, setListName] = useState('');
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleImport = async () => {
    if (!sheetUrl) {
      setStatus({ type: 'error', message: 'Please enter a Google Sheets URL' });
      return;
    }

    // Extract sheet ID from URL
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      setStatus({ type: 'error', message: 'Invalid Google Sheets URL' });
      return;
    }

    setImporting(true);
    setStatus({ type: 'info', message: 'Starting import...' });

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const response = await fetch('https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/import-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbHNuc2lkZ3FsYWNkeWF0dmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTUzNjIsImV4cCI6MjA2ODk5MTM2Mn0.cS3_Iihv1_VhuoGhWb8CBl72cJx3WNRi1SjmPV6ntl0'
        },
        body: JSON.stringify({
          sheet_url: sheetIdMatch[1],
          sheet_name: listName || 'Imported List',
          client_id: user?.user?.id || 'default'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({
          type: 'success',
          message: `Import completed! Processed ${result.processed || 0} leads, Failed ${result.failed || 0} leads`
        });
        setSheetUrl('');
        setListName('');
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Import failed. Please check your sheet format.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to connect to import service. Please try again.'
      });
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setImportHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            Import Leads from Google Sheets
          </CardTitle>
          <p className="text-muted-foreground">
            Import your lead list from Google Sheets. Make sure your sheet has the required columns.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listName">List Name (Optional)</Label>
            <Input
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g., Phoenix Absentee Owners"
              disabled={importing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheetUrl">Google Sheets URL *</Label>
            <Input
              id="sheetUrl"
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              disabled={importing}
            />
            <p className="text-xs text-muted-foreground">
              Paste your Google Sheets URL. Make sure the sheet is viewable by anyone with the link.
            </p>
          </div>

          {status && (
            <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
              {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
              {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {status.type === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleImport}
              disabled={importing || !sheetUrl}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Leads
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchImportHistory();
              }}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </div>
        </CardContent>
      </Card>

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
          </CardHeader>
          <CardContent>
            {importHistory.length === 0 ? (
              <p className="text-muted-foreground">No imports yet</p>
            ) : (
              <div className="space-y-3">
                {importHistory.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{job.sheet_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                        {job.total_rows && (
                          <p className="text-sm text-muted-foreground">
                            {job.processed_rows || 0}/{job.total_rows} processed
                          </p>
                        )}
                      </div>
                    </div>
                    {job.failed_rows > 0 && (
                      <p className="text-sm text-orange-600 mt-2">
                        {job.failed_rows} rows failed to import
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Required Sheet Columns</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Owner 1 First Name</li>
            <li>• Owner 1 Last Name</li>
            <li>• Full Address</li>
            <li>• Phone 1 (required, additional phones optional: Phone 2, 3, 4)</li>
            <li>• Lead Type (optional, e.g., "Absentee", "High Equity")</li>
            <li>• SMS Status (optional, e.g., "not sent", "sent")</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Tip: Use the exact column names above for best results. The sheet must be publicly viewable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportLeadsView;