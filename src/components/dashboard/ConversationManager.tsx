import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Phone, Clock, Bot, User, Send, MoreVertical, StopCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, Message } from '@/types/conversation';

export const ConversationManager: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [leadInfo, setLeadInfo] = useState({
    propertyAddress: '',
    timeline: '',
    sellingReason: '',
    condition: '',
    expectedPrice: ''
  });

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

  const getStatusBadge = (status: string) => {
    const config = {
      'open': { variant: 'default' as const, color: 'bg-blue-500', label: 'Active' },
      'qualified': { variant: 'default' as const, color: 'bg-green-500', label: 'Qualified' },
      'closed': { variant: 'outline' as const, color: 'bg-gray-500', label: 'Closed' }
    };
    const statusConfig = config[status as keyof typeof config] || config.open;
    
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`}></div>
        <Badge variant={statusConfig.variant} className="text-xs">
          {statusConfig.label}
        </Badge>
      </div>
    );
  };

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

  const renderMessage = (message: Message) => {
    const isAI = message.direction === 'outbound';
    const isInbound = message.direction === 'inbound';
    
    return (
      <div key={message.id} className={`flex gap-3 mb-6 ${isAI ? 'justify-end' : 'justify-start'}`}>
        {isInbound && (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-accent text-accent-foreground">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isAI ? 'order-first' : ''}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isAI 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-accent text-accent-foreground'
          }`}>
            <p className="text-sm leading-relaxed">{message.body}</p>
          </div>
          <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
            isAI ? 'justify-end' : 'justify-start'
          }`}>
            {isAI && <Bot className="w-3 h-3" />}
            <span>{formatMessageTime(message.created_at)}</span>
          </div>
        </div>
        
        {isAI && (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
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

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <div className="col-span-4 bg-card rounded-xl border border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`p-4 hover:bg-accent cursor-pointer transition-all border-l-4 ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-accent border-l-primary' 
                    : 'border-l-transparent hover:border-l-muted'
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {conv.contact?.first_name?.[0] || conv.contact?.phone_e164.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-card-foreground text-sm">
                        {conv.contact?.first_name} {conv.contact?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {conv.contact?.phone_e164}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(conv.status)}
                </div>
                <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {conv.messages?.[conv.messages.length - 1]?.body?.substring(0, 80)}...
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.last_msg_at || conv.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {conv.messages?.length || 0} msgs
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="col-span-5 bg-card rounded-xl border border-border flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedConversation.contact?.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-card-foreground">
                        {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {selectedConversation.contact?.phone_e164}
                        {getStatusBadge(selectedConversation.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" className="text-xs">
                      <StopCircle className="w-4 h-4 mr-1" />
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {selectedConversation.messages?.map(renderMessage)}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-accent/10">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="resize-none bg-background"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage} className="self-end">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>

        {/* Lead Information Panel */}
        <div className="col-span-3 bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-card-foreground">Lead Information</h3>
          </div>
          {selectedConversation ? (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Property Address
                </label>
                <Input
                  placeholder="Enter property address"
                  value={leadInfo.propertyAddress}
                  onChange={(e) => setLeadInfo(prev => ({ ...prev, propertyAddress: e.target.value }))}
                  className="bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Timeline
                </label>
                <Input
                  placeholder="When do they want to sell?"
                  value={leadInfo.timeline}
                  onChange={(e) => setLeadInfo(prev => ({ ...prev, timeline: e.target.value }))}
                  className="bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Reason for Selling
                </label>
                <Input
                  placeholder="Why are they selling?"
                  value={leadInfo.sellingReason}
                  onChange={(e) => setLeadInfo(prev => ({ ...prev, sellingReason: e.target.value }))}
                  className="bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Property Condition
                </label>
                <Input
                  placeholder="Property condition"
                  value={leadInfo.condition}
                  onChange={(e) => setLeadInfo(prev => ({ ...prev, condition: e.target.value }))}
                  className="bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Expected Price
                </label>
                <Input
                  placeholder="Expected selling price"
                  value={leadInfo.expectedPrice}
                  onChange={(e) => setLeadInfo(prev => ({ ...prev, expectedPrice: e.target.value }))}
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2 pt-4">
                <Button className="w-full">
                  Save Lead Information
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    Send to CRM
                  </Button>
                  <Button variant="outline" size="sm">
                    Add to Leads
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Select a conversation to view lead details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};