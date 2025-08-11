import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Phone, Clock, Send, MoreVertical, StopCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, Message } from '@/types/conversation';

export const ConversationManager: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

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
      
      const transformedData: Conversation[] = (data || []).map(conv => ({
        ...conv,
        messages: (conv.messages || []).map((msg: any) => ({
          ...msg,
          direction: msg.direction as 'inbound' | 'outbound'
        })).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const { error } = await supabase.functions.invoke('reply', {
        body: {
          conversation_id: selectedConversation.id,
          phone: selectedConversation.contact.phone_e164,
          message: newMessage
        }
      });

      if (error) throw error;
      
      setNewMessage('');
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      {/* Header */}
      <div className="bg-gradient-to-r from-chart-1 to-primary rounded-3xl p-8 text-primary-foreground">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
          <MessageSquare className="w-8 h-8" />
          AI Conversation Manager
        </h1>
        <p className="text-primary-foreground/80 text-lg">Monitor and control AI conversations in real-time</p>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-border bg-accent/5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 bg-background border-0 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation Layout */}
        <div className="flex h-[600px]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-border overflow-y-auto">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`p-6 hover:bg-accent/50 cursor-pointer transition-all border-l-4 ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-accent/30 border-l-primary' 
                    : 'border-l-transparent hover:border-l-muted'
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-base mb-1">
                      {conv.contact?.first_name} {conv.contact?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {conv.contact?.phone_e164}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      conv.status === 'open' ? 'bg-green-500' : 
                      conv.status === 'qualified' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></div>
                    <Badge variant="secondary" className="text-xs">
                      {conv.status === 'open' ? 'Active' : conv.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {conv.messages?.[conv.messages.length - 1]?.body?.substring(0, 80)}...
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.last_msg_at || conv.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="font-medium text-primary">$385K</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-border bg-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {selectedConversation.contact?.first_name?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {selectedConversation.contact?.phone_e164}
                          <Badge variant="secondary" className="text-xs">
                            {selectedConversation.status === 'open' ? 'Active' : selectedConversation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="destructive" size="sm">
                        <StopCircle className="w-4 h-4 mr-2" />
                        Stop AI
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-popover border border-border shadow-lg z-50">
                          <DropdownMenuItem>View Lead Details</DropdownMenuItem>
                          <DropdownMenuItem>Export Conversation</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Close Conversation</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages - WhatsApp Style */}
                <div className="flex-1 overflow-y-auto p-6 bg-accent/5">
                  <div className="space-y-4">
                    {selectedConversation.messages?.map(message => (
                      <div key={message.id} className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          message.direction === 'outbound' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background border border-border'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.body}</p>
                          <div className={`text-xs mt-2 ${
                            message.direction === 'outbound' 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatMessageTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-border bg-background">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="resize-none border-0 shadow-sm"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} className="px-6">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation to start viewing messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};