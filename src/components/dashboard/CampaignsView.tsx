import React, { useState } from 'react';
import { 
  Workflow, Play, Pause, Edit, Trash2, Plus, BarChart, 
  Users, MessageSquare, TrendingUp, Calendar, Target
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  type: 'nurture' | 'conversion' | 'reactivation';
  leads: number;
  responses: number;
  responseRate: number;
  conversions: number;
  startDate: string;
  nextAction: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'High-Intent Lead Nurture',
    status: 'active',
    type: 'nurture',
    leads: 234,
    responses: 89,
    responseRate: 38.0,
    conversions: 12,
    startDate: '2024-01-15',
    nextAction: 'Follow-up sequence starting tomorrow'
  },
  {
    id: '2', 
    name: 'Property Valuation Outreach',
    status: 'active',
    type: 'conversion',
    leads: 156,
    responses: 67,
    responseRate: 42.9,
    conversions: 8,
    startDate: '2024-01-20',
    nextAction: 'Sending market reports today'
  },
  {
    id: '3',
    name: 'Cold Lead Reactivation',
    status: 'paused',
    type: 'reactivation', 
    leads: 89,
    responses: 23,
    responseRate: 25.8,
    conversions: 3,
    startDate: '2024-01-10',
    nextAction: 'Campaign paused for optimization'
  },
  {
    id: '4',
    name: 'Expired Listing Conversion',
    status: 'draft',
    type: 'conversion',
    leads: 0,
    responses: 0,
    responseRate: 0,
    conversions: 0,
    startDate: '2024-02-01',
    nextAction: 'Launching next week'
  }
];

interface CampaignsViewProps {
  onNewCampaign?: () => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ onNewCampaign }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'nurture': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'conversion': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reactivation': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCampaigns = mockCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLeads = mockCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalResponses = mockCampaigns.reduce((sum, c) => sum + c.responses, 0);
  const avgResponseRate = totalLeads > 0 ? (totalResponses / totalLeads) * 100 : 0;
  const totalConversions = mockCampaigns.reduce((sum, c) => sum + c.conversions, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
          <Workflow className="w-8 h-8" />
          AI Campaign Manager
        </h1>
        <p className="text-white/80 text-lg">Intelligent automation driving your lead conversion</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockCampaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Workflow className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{totalLeads.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{avgResponseRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{totalConversions}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold text-gray-900">Campaign Performance</CardTitle>
            <div className="flex gap-3">
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 border-gray-200"
              />
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onNewCampaign}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Campaign
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Next Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-gray-900">{campaign.name}</div>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <Badge className={getTypeColor(campaign.type)}>
                            {campaign.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span>Started {campaign.startDate}</span>
                          <span>{campaign.leads} leads</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{campaign.responses}</span>
                            <span className="text-gray-500"> responses</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-green-600">{campaign.responseRate}%</span>
                            <span className="text-gray-500"> rate</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-green-500 rounded-full" 
                              style={{width: `${campaign.responseRate}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {campaign.conversions} conversions
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {campaign.nextAction}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {campaign.status === 'active' ? (
                          <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                            <Pause className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                          <BarChart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};