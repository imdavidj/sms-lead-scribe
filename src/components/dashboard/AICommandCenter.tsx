import React from 'react';
import { 
  Brain, Loader2, Bot, Upload, GraduationCap, 
  Cpu, Target, Sparkles, Gauge, ArrowUpRight 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AICommandCenterProps {
  isAIProcessing: boolean;
}

export const AICommandCenter: React.FC<AICommandCenterProps> = ({ isAIProcessing }) => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary via-chart-1 to-primary rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-background/10"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-foreground/5 rounded-full"></div>
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-primary-foreground/5 rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-8 h-8" />
                <h1 className="text-3xl font-bold">AI Command Center</h1>
                {isAIProcessing && (
                  <div className="flex items-center gap-2 bg-primary-foreground/20 px-3 py-1 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing</span>
                  </div>
                )}
              </div>
              <p className="text-primary-foreground/80">Neural network analyzing 1,247 conversations in real-time</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-primary-foreground/70 mb-1">System Intelligence</div>
              <div className="text-4xl font-bold">98.7%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-primary-foreground/70" />
                <span className="text-sm text-primary-foreground/70">Response Rate</span>
              </div>
              <div className="text-2xl font-bold">1.2 sec</div>
              <div className="text-xs text-primary-foreground/60 mt-1">23% faster</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary-foreground/70" />
                <span className="text-sm text-primary-foreground/70">Lead Quality</span>
              </div>
              <div className="text-2xl font-bold">87%</div>
              <div className="text-xs text-primary-foreground/60 mt-1">ML confidence</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary-foreground/70" />
                <span className="text-sm text-primary-foreground/70">Conversions</span>
              </div>
              <div className="text-2xl font-bold">342</div>
              <div className="text-xs text-primary-foreground/60 mt-1">This week</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-primary-foreground/70" />
                <span className="text-sm text-primary-foreground/70">Accuracy</span>
              </div>
              <div className="text-2xl font-bold">99.2%</div>
              <div className="text-xs text-primary-foreground/60 mt-1">+2.3% weekly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-auto p-6 flex-col items-start space-y-4 border-2 hover:border-primary hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between w-full">
            <Bot className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg mb-1">Launch AI Campaign</h3>
            <p className="text-sm text-muted-foreground">Deploy intelligent outreach</p>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto p-6 flex-col items-start space-y-4 border-2 hover:border-chart-1 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between w-full">
            <Upload className="w-8 h-8 text-chart-1 group-hover:scale-110 transition-transform" />
            <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg mb-1">Import Lead List</h3>
            <p className="text-sm text-muted-foreground">Process with AI enrichment</p>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto p-6 flex-col items-start space-y-4 border-2 hover:border-chart-2 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between w-full">
            <GraduationCap className="w-8 h-8 text-chart-2 group-hover:scale-110 transition-transform" />
            <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg mb-1">Train AI Model</h3>
            <p className="text-sm text-muted-foreground">Improve responses</p>
          </div>
        </Button>
      </div>
    </div>
  );
};