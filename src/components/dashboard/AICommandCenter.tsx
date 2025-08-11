import React from 'react';
import { 
  Brain, Bot, Upload, GraduationCap, 
  Cpu, Target, Sparkles, Gauge, ArrowUpRight, Activity,
  CheckCircle
} from 'lucide-react';

interface AICommandCenterProps {
  isAIProcessing: boolean;
  onLaunchCampaign: () => void;
  onImportLeads: () => void;
  onTrainModel: () => void;
}

export const AICommandCenter: React.FC<AICommandCenterProps> = ({ isAIProcessing, onLaunchCampaign, onImportLeads, onTrainModel }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section - Matching Claude's exact design */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-bold text-white">AI Command Center</h1>
                {isAIProcessing && (
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">Processing</span>
                  </div>
                )}
              </div>
              <p className="text-white/90 text-lg">Neural network analyzing 1,247 conversations in real-time</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/70 mb-2">System Intelligence</div>
              <div className="text-6xl font-bold text-white">98.7%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">Response Rate</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">1.2 sec</div>
              <div className="text-sm text-white/70">23% faster</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">Lead Quality</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">87%</div>
              <div className="text-sm text-white/70">ML confidence</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">Conversions</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">342</div>
              <div className="text-sm text-white/70">This week</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">Accuracy</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">99.2%</div>
              <div className="text-sm text-white/70">+2.3% weekly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards - Matching Claude's layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={onLaunchCampaign}>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Launch AI Campaign</h3>
          <p className="text-gray-600 leading-relaxed">Deploy intelligent outreach</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={onImportLeads}>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Import Lead List</h3>
          <p className="text-gray-600 leading-relaxed">Process with AI enrichment</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={onTrainModel}>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Train AI Model</h3>
          <p className="text-gray-600 leading-relaxed">Improve responses</p>
        </div>
      </div>

      {/* AI Activity Stream - Matching Claude's style */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Activity Stream</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 mb-1">AI qualified Sarah Johnson - Score: 92/100</div>
              <div className="text-sm text-gray-600">2 min ago • $385K property value</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};