import React, { useState } from 'react';
import { 
  BarChart, TrendingUp, Users, MessageSquare, Target, 
  Calendar, Download, Filter, RefreshCw, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
}

const metrics: MetricCard[] = [
  {
    title: 'Lead Response Rate',
    value: '34.2%',
    change: 12.5,
    trend: 'up',
    icon: MessageSquare,
    color: 'blue'
  },
  {
    title: 'Conversion Rate',
    value: '8.7%',
    change: -2.1,
    trend: 'down', 
    icon: Target,
    color: 'green'
  },
  {
    title: 'Active Conversations',
    value: '247',
    change: 23.8,
    trend: 'up',
    icon: Users,
    color: 'purple'
  },
  {
    title: 'AI Accuracy Score',
    value: '94.3%',
    change: 5.2,
    trend: 'up',
    icon: BarChart,
    color: 'orange'
  }
];

const timeRanges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This year', value: '1y' }
];

const campaignPerformanceData = [
  { campaign: 'Austin Investor List', leads: 156, responses: 89, conversion: 35.2, color: 'bg-blue-500' },
  { campaign: 'Dallas Home Owners', leads: 134, responses: 72, conversion: 30.2, color: 'bg-green-500' },
  { campaign: 'Houston High Equity', leads: 89, responses: 45, conversion: 20.1, color: 'bg-purple-500' },
  { campaign: 'San Antonio Foreclosure', leads: 64, responses: 28, conversion: 14.5, color: 'bg-orange-500' }
];

const hourlyActivity = [
  { hour: '9 AM', activity: 65 },
  { hour: '10 AM', activity: 78 },
  { hour: '11 AM', activity: 82 },
  { hour: '12 PM', activity: 95 },
  { hour: '1 PM', activity: 88 },
  { hour: '2 PM', activity: 92 },
  { hour: '3 PM', activity: 97 },
  { hour: '4 PM', activity: 85 },
  { hour: '5 PM', activity: 72 }
];

export const AnalyticsView: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState('30d');

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
          <BarChart className="w-8 h-8" />
          Performance Analytics
        </h1>
        <p className="text-white/80 text-lg">Data-driven insights to optimize your AI conversations</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
              className={selectedRange === range.value ? "bg-blue-600 hover:bg-blue-700" : "border-gray-200"}
            >
              {range.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(metric.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge className={`flex items-center gap-1 ${
                    metric.trend === 'up' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(metric.change)}%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-900">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {campaignPerformanceData.map((campaign) => (
                <div key={campaign.campaign} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{campaign.campaign}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{campaign.leads}</span>
                      <span className="text-xs text-gray-500 ml-1">leads</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{campaign.responses} responses</span>
                    <span>{campaign.conversion}% conversion</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 ${campaign.color} rounded-full`}
                      style={{ width: `${campaign.conversion}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-900">Peak Activity Hours</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {hourlyActivity.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-600">
                    {hour.hour}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${hour.activity}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 w-8">
                      {hour.activity}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance Insights */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-bold text-gray-900">AI Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Response Optimization</span>
              </div>
              <p className="text-sm text-blue-700">
                Your AI responses are 23% more effective when sent between 2-4 PM
              </p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Lead Quality</span>
              </div>
              <p className="text-sm text-green-700">
                Facebook leads show 34% higher conversion rates than other sources
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Conversation Flow</span>
              </div>
              <p className="text-sm text-purple-700">
                Adding property details increases engagement by 45%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};