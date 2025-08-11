export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  property: string;
  value: string;
  aiScore: number;
  timeline: string;
  motivation?: string;
  temperature?: 'hot' | 'warm' | 'cold';
}

export interface AIMessage {
  id: number;
  sender: 'ai' | 'contact';
  text: string;
  time: string;
  confidence?: number;
  reasoning?: string;
}

export interface EnhancedConversation {
  id: number;
  name: string;
  phone: string;
  status: 'ai-active' | 'qualified' | 'unqualified';
  lastMessage: string;
  temperature: 'hot' | 'warm' | 'cold';
  time: string;
  value: string;
  aiScore: number;
  confidence: number;
  property: string;
  timeline: string;
  motivation: string;
  messages?: AIMessage[];
}

export interface AIAnalytics {
  responseTime: string;
  leadQuality: string;
  conversions: string;
  accuracy: string;
  systemIntelligence: string;
}