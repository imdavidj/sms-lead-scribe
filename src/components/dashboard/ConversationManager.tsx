import React, { useState, useEffect } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Conversation } from '@/types/conversation';
import { ConversationThread } from '../ConversationThread';

export const ConversationManager: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(*),
          messages(*)
        `)
        .order('last_msg_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to match our Conversation type
      const transformedData: Conversation[] = (data || []).map(conv => ({
        ...conv,
        messages: (conv.messages || []).map((msg: any) => ({
          ...msg,
          direction: msg.direction as 'inbound' | 'outbound'
        }))
      }));
      
      setConversations(transformedData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.contact?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact?.phone_e164?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'open': 'default',
      'qualified': 'secondary',
      'closed': 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-chart-1 to-primary rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-7 h-7" />
          AI Conversation Manager
        </h1>
        <p className="text-primary-foreground/80 mt-1">Monitor and control AI conversations in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-card-foreground">
                    {conv.contact?.first_name} {conv.contact?.last_name}
                  </div>
                  {getStatusBadge(conv.status)}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {conv.contact?.phone_e164}
                </div>
                <div className="text-sm text-muted-foreground">
                  {conv.messages?.[0]?.body?.substring(0, 50)}...
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(conv.last_msg_at || conv.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          {selectedConversation ? (
            <div>
              <div className="p-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-card-foreground">
                      {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedConversation.contact?.phone_e164}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm">
                    Stop AI
                  </Button>
                </div>
              </div>
              <div className="h-96">
                <ConversationThread 
                  conversation={selectedConversation} 
                  onConversationUpdate={loadConversations}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              Select a conversation to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};