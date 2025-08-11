import React, { useState, useEffect } from 'react';
import { Database, Filter, Search, Eye, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from '@/types/dashboard';

interface EnhancedLeadsViewProps {
  onPushToCRM: (lead: Lead) => void;
}

export const EnhancedLeadsView: React.FC<EnhancedLeadsViewProps> = ({ onPushToCRM }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAIScore = (lead: any) => {
    // Generate a mock AI score based on available data
    let score = 50;
    if (lead.status === 'Qualified') score += 30;
    if (lead.ai_tag) score += 20;
    if (lead.email) score += 10;
    if (lead.address) score += 15;
    return Math.min(score, 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Qualified': 'default',
      'No Response': 'secondary',
      'Unqualified': 'destructive',
      'Blocked': 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const filteredLeads = leads.filter(lead =>
    lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-chart-2 to-chart-3 rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-7 h-7" />
          Intelligent Lead Database
        </h1>
        <p className="text-primary-foreground/80 mt-1">AI-enriched profiles with predictive scoring</p>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search leads..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  AI Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Property Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead) => {
                const aiScore = getAIScore(lead);
                const leadForCRM: Lead = {
                  id: lead.id,
                  name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
                  phone: lead.phone || '',
                  property: lead.address || 'Property info not available',
                  value: '$0', // This would come from your property valuation
                  aiScore,
                  timeline: 'Unknown',
                  motivation: lead.ai_classification_reason || 'Not specified'
                };

                return (
                  <tr key={lead.id} className="hover:bg-accent/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-card-foreground">
                          {leadForCRM.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="text-sm text-muted-foreground">
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="h-2 bg-primary rounded-full transition-all" 
                            style={{width: `${aiScore}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{aiScore}</span>
                      </div>
                      {lead.ai_tag && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {lead.ai_tag}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-card-foreground">
                      {lead.address ? (
                        <div>
                          <div>{lead.address}</div>
                          {lead.city && lead.state && (
                            <div className="text-muted-foreground">
                              {lead.city}, {lead.state} {lead.zip}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No address</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPushToCRM(leadForCRM)}
                        >
                          Push to CRM
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No leads found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};