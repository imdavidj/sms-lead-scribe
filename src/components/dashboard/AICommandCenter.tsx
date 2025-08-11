import React from 'react';
import { 
  Brain, Loader2, Bot, Upload, GraduationCap, 
  Cpu, Target, Sparkles, Gauge, ArrowUpRight, Activity,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AICommandCenterProps {
  isAIProcessing: boolean;
}

export const AICommandCenter: React.FC<AICommandCenterProps> = ({ isAIProcessing }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section - Cleaner Design */}
      <div className="bg-gradient-to-r from-primary to-chart-2 rounded-3xl p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-background/5"></div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary-foreground/5 rounded-full"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary-foreground/5 rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Brain className="w-8 h-8" />
                <h1 className="text-3xl font-bold">AI Command Center</h1>
                {isAIProcessing && (
                  <div className="flex items-center gap-2 bg-primary-foreground/20 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                )}
              </div>
              <p className="text-primary-foreground/80 text-lg">Neural network analyzing 1,247 conversations in real-time</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-primary-foreground/70 mb-1">System Intelligence</div>
              <div className="text-5xl font-bold">98.7%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <Cpu className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/80 font-medium">Response Rate</span>
              </div>
              <div className="text-2xl font-bold mb-1">1.2 sec</div>
              <div className="text-xs text-primary-foreground/60">23% faster</div>
            </div>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <Target className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/80 font-medium">Lead Quality</span>
              </div>
              <div className="text-2xl font-bold mb-1">87%</div>
              <div className="text-xs text-primary-foreground/60">ML confidence</div>
            </div>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/80 font-medium">Conversions</span>
              </div>
              <div className="text-2xl font-bold mb-1">342</div>
              <div className="text-xs text-primary-foreground/60">This week</div>
            </div>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <Gauge className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/80 font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold mb-1">99.2%</div>
              <div className="text-xs text-primary-foreground/60">+2.3% weekly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards - Cleaner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Launch AI Campaign</h3>
          <p className="text-muted-foreground leading-relaxed">Deploy intelligent outreach</p>
        </div>
        
        <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-chart-1/10 rounded-xl">
              <Upload className="w-8 h-8 text-chart-1" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-chart-1 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Import Lead List</h3>
          <p className="text-muted-foreground leading-relaxed">Process with AI enrichment</p>
        </div>
        
        <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-chart-2/10 rounded-xl">
              <GraduationCap className="w-8 h-8 text-chart-2" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-chart-2 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Train AI Model</h3>
          <p className="text-muted-foreground leading-relaxed">Improve responses</p>
        </div>
      </div>

      {/* AI Activity Stream - Cleaner Design */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Activity Stream</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 p-4 bg-accent/30 rounded-xl border border-accent">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium mb-1">AI qualified Sarah Johnson - Score: 92/100</div>
              <div className="text-sm text-muted-foreground">2 min ago • $385K property value</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};