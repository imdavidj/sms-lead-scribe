import React, { useState, useEffect } from 'react';
import { Database, Filter, Search, Eye, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from '@/types/dashboard';
import { LeadDetailsDrawer } from './LeadDetailsDrawer';

interface EnhancedLeadsViewProps {
  onPushToCRM: (lead: Lead) => void;
}

export const EnhancedLeadsView: React.FC<EnhancedLeadsViewProps> = ({ onPushToCRM }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLead, setViewLead] = useState<any | null>(null);

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
      
      // Add mock data to supplement real data
      const mockLeads = [
        {
          id: 'mock-1',
          first_name: 'Sarah',
          last_name: 'Johnson',
          phone: '+1 (555) 123-4567',
          email: 'sarah.johnson@email.com',
          address: '123 Main Street',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          status: 'Qualified',
          ai_tag: 'High Intent',
          ai_classification_reason: 'Actively looking to sell within 3 months',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          first_name: 'Michael',
          last_name: 'Davis',
          phone: '+1 (555) 987-6543',
          email: 'michael.davis@email.com',
          address: '456 Oak Avenue',
          city: 'Dallas',
          state: 'TX',
          zip: '75201',
          status: 'No Response',
          ai_tag: 'Medium Intent',
          ai_classification_reason: 'Considering selling in next 6 months',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'mock-3',
          first_name: 'Emily',
          last_name: 'Rodriguez',
          phone: '+1 (555) 456-7890',
          email: 'emily.rodriguez@email.com',
          address: '789 Pine Road',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
          status: 'Qualified',
          ai_tag: 'Hot Lead',
          ai_classification_reason: 'Urgent sale needed due to relocation',
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'mock-4',
          first_name: 'David',
          last_name: 'Wilson',
          phone: '+1 (555) 321-0987',
          address: '321 Elm Street',
          city: 'San Antonio',
          state: 'TX',
          zip: '78201',
          status: 'Unqualified',
          ai_tag: 'Low Intent',
          ai_classification_reason: 'Just curious about market value',
          created_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 'mock-5',
          first_name: 'Jessica',
          last_name: 'Brown',
          phone: '+1 (555) 654-3210',
          email: 'jessica.brown@email.com',
          address: '654 Maple Drive',
          city: 'Fort Worth',
          state: 'TX',
          zip: '76101',
          status: 'Blocked',
          ai_tag: 'Do Not Contact',
          ai_classification_reason: 'Requested no further contact',
          created_at: new Date(Date.now() - 345600000).toISOString()
        }
      ];

      setLeads([...(data || []), ...mockLeads]);
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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
          <Database className="w-8 h-8" />
          Intelligent Lead Database
        </h1>
        <p className="text-white/80 text-lg">AI-enriched profiles with predictive scoring</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search leads..." 
                className="pl-10 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="border-gray-200 hover:bg-gray-50">
              <Filter className="w-4 h-4 text-gray-600" />
            </Button>
      </div>

      <LeadDetailsDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        lead={viewLead}
        onPushToCRM={onPushToCRM}
      />
    </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {leadForCRM.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="text-sm text-gray-500">
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-green-500 rounded-full transition-all" 
                            style={{width: `${aiScore}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{aiScore}</span>
                      </div>
                      {lead.ai_tag && (
                        <div className="mt-1">
                          {lead.ai_tag === 'hot' ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">🔥 HOT</Badge>
                          ) : lead.ai_tag === 'warm' ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🟡 WARM</Badge>
                          ) : lead.ai_tag === 'cold' ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">❄️ COLD</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">{lead.ai_tag}</Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.address ? (
                        <div>
                          <div>{lead.address}</div>
                          {lead.city && lead.state && (
                            <div className="text-gray-500">
                              {lead.city}, {lead.state} {lead.zip}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No address</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPushToCRM(leadForCRM)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          Push to CRM
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                          onClick={() => { setViewLead(lead); setViewOpen(true); }}
                          aria-label="View lead details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
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
          <div className="text-center py-12 text-gray-500">
            No leads found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};