import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Phone, Clock, Send, MoreVertical, StopCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Conversation, Message } from '@/types/conversation';

export const ConversationManager: React.FC<{ preselectPhone?: string }> = ({ preselectPhone }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    // Support deep-link via ?phone=... if preselectPhone not provided
    if (preselectPhone) return;
    const phoneParam = new URLSearchParams(window.location.search).get('phone');
    if (!phoneParam) return;
    const match = conversations.find(
      (c) => c.contact?.phone_e164 && c.contact.phone_e164.includes(phoneParam)
    );
    if (match) {
      setSelectedConversation(match);
    } else {
      setSearchTerm(phoneParam);
    }
  }, [conversations, preselectPhone]);

  useEffect(() => {
    // Reflect selected conversation in URL
    const params = new URLSearchParams(window.location.search);
    if (selectedConversation?.contact?.phone_e164) {
      params.set('phone', selectedConversation.contact.phone_e164);
    } else {
      params.delete('phone');
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [selectedConversation]);

  useEffect(() => {
    if (!preselectPhone) return;
    const match = conversations.find(
      (c) => c.contact?.phone_e164 && c.contact.phone_e164.includes(preselectPhone)
    );
    if (match) {
      setSelectedConversation(match);
    } else {
      setSearchTerm(preselectPhone);
    }
  }, [preselectPhone, conversations]);
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
    
    const to = selectedConversation.contact.phone_e164;
    const messageText = newMessage.trim();
    const conversationId = selectedConversation.id;

    console.log('Sending SMS:', { to, message: messageText, conversationId });
    
    try {
      const response = await fetch('https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbHNuc2lkZ3FsYWNkeWF0dmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTUzNjIsImV4cCI6MjA2ODk5MTM2Mn0.cS3_Iihv1_VhuoGhWb8CBl72cJx3WNRi1SjmPV6ntl0'
        },
        body: JSON.stringify({ to, message: messageText, conversationId })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }

      await response.json().catch(() => null);
      setNewMessage('');
      toast({ title: 'Message sent', description: 'Your reply has been sent successfully' });
      loadConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: error.message || 'Failed to send message', variant: 'destructive' });
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
          <MessageSquare className="w-8 h-8" />
          AI Conversation Manager
        </h1>
        <p className="text-white/80 text-lg">Monitor and control AI conversations in real-time</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 bg-white border-gray-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation Layout */}
        <div className="flex h-[600px]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-all border-l-4 ${
                  selectedConversation?.id === conv.id 
                    ? 'bg-blue-50 border-l-blue-500' 
                    : 'border-l-transparent hover:border-l-gray-300'
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-base text-gray-900 mb-1">
                      {conv.contact?.first_name} {conv.contact?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
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
                
                <div className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {conv.messages?.[conv.messages.length - 1]?.body?.substring(0, 80)}...
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.last_msg_at || conv.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="font-medium text-blue-600">$385K</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {selectedConversation.contact?.first_name?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900">
                          {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
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
                        <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50">
                          <DropdownMenuItem>View Lead Details</DropdownMenuItem>
                          <DropdownMenuItem>Export Conversation</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Close Conversation</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages - WhatsApp Style */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="space-y-4">
                    {selectedConversation.messages?.map(message => (
                      <div key={message.id} className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          message.direction === 'outbound' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.body}</p>
                          <div className={`text-xs mt-2 ${
                            message.direction === 'outbound' 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="resize-none border-gray-200 shadow-sm"
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
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a conversation to start viewing messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};