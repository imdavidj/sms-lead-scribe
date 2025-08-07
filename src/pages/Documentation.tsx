import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Documentation = () => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">System Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Complete documentation of our SMS conversation management system, including code examples and implementation details.
        </p>
      </div>

      <Tabs defaultValue="edge-functions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="database">Database Schema</TabsTrigger>
          <TabsTrigger value="sms-service">SMS Service</TabsTrigger>
        </TabsList>

        <TabsContent value="edge-functions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Supabase Edge Function</Badge>
                Webhook Handler
              </CardTitle>
              <CardDescription>
                Handles incoming webhook messages and manages conversation data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border p-4">
                <pre className="text-sm">
                  <code>{`// supabase/functions/hooks/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MessageWebhookPayload {
  phone: string
  direction: 'inbound' | 'outbound'
  body: string
  ai_summary?: {
    address?: string
    timeline?: string
    reason?: string
    condition?: string
    price?: string
  } | null
  twilio_sid?: string
  // AI Classification fields
  conversationid?: string
  leadid?: string
  tag?: string
  reason?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const payload: MessageWebhookPayload = await req.json()
      console.log('Received message webhook:', payload)

      // Validate required fields
      if (!payload.phone || !payload.direction || !payload.body) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: phone, direction, body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Normalize phone number to E164 format
      const phoneE164 = payload.phone.startsWith('+') ? payload.phone : \`+\${payload.phone}\`

      // Upsert contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .upsert(
          { phone_e164: phoneE164 },
          { 
            onConflict: 'phone_e164',
            ignoreDuplicates: false 
          }
        )
        .select('id')
        .single()

      if (contactError) {
        console.error('Error upserting contact:', contactError)
        return new Response(
          JSON.stringify({ error: 'Failed to create/update contact' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find or create open conversation
      let { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('status', 'open')
        .maybeSingle()

      if (!conversation) {
        const { data: newConversation, error: newConversationError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contact.id,
            status: 'open',
            last_msg_at: new Date().toISOString()
          })
          .select('id')
          .single()

        conversation = newConversation
      }

      // Insert message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          direction: payload.direction,
          body: payload.body,
          ai_summary: payload.ai_summary || null,
          twilio_sid: payload.twilio_sid || null
        })

      // Handle AI classification data for leads
      if (payload.tag && payload.phone) {
        await supabase
          .from('leads')
          .upsert({
            phone: phoneE164,
            ai_tag: payload.tag,
            ai_classification_reason: payload.reason,
            last_classification_at: new Date().toISOString(),
            status: 'No Response'
          }, { 
            onConflict: 'phone',
            ignoreDuplicates: false 
          })
      }

      return new Response(
        JSON.stringify({ success: true, conversation_id: conversation.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})`}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Reply Function</Badge>
                SMS Reply Handler
              </CardTitle>
              <CardDescription>
                Handles outbound message sending and n8n webhook forwarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <pre className="text-sm">
                  <code>{`// supabase/functions/reply/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ReplyPayload {
  conversation_id: string
  phone: string
  message: string
  user_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'POST') {
    const payload: ReplyPayload = await req.json()
    
    // Insert outbound message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: payload.conversation_id,
        direction: 'outbound',
        body: payload.message,
        ai_summary: null,
        twilio_sid: null
      })
      .select('id')
      .single()

    // Forward to n8n webhook for SMS sending
    const n8nWebhookUrl = Deno.env.get('N8N_REPLY_WEBHOOK_URL')
    
    if (n8nWebhookUrl) {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: payload.conversation_id,
          phone: payload.phone,
          message: payload.message,
          user_id: payload.user_id,
          lovable_message_id: message.id
        })
      })
    }

    return new Response(
      JSON.stringify({ success: true, message_id: message.id }),
      { status: 200, headers: corsHeaders }
    )
  }
})`}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">React Component</Badge>
                ConversationThread
              </CardTitle>
              <CardDescription>
                Main component for displaying conversation messages and managing lead information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border p-4">
                <pre className="text-sm">
                  <code>{`// src/components/ConversationThread.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Save, UserPlus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Message, Conversation, Contact } from '@/types/conversation';
import { SendToCRMModal } from './SendToCRMModal';

interface Lead {
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  timeline: string;
  reason: string;
  condition: string;
  price: string;
}

declare global {
  interface Window {
    globalLeads: Lead[];
  }
}

if (!window.globalLeads) {
  window.globalLeads = [];
}

interface ConversationThreadProps {
  conversation: Conversation | null;
  onConversationUpdate?: () => void;
  leadPhone?: string;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  conversation,
  onConversationUpdate,
  leadPhone
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [phone, setPhone] = useState(leadPhone || '');
  const [leadFields, setLeadFields] = useState({
    address: '',
    timeline: '',
    reason: '',
    condition: '',
    price: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (leadPhone) {
      setPhone(leadPhone);
    }
  }, [leadPhone]);

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages || []);
      
      // Extract AI summary data from messages
      const latestAISummary = conversation.messages
        ?.filter(msg => msg.ai_summary)
        ?.pop()?.ai_summary;
      
      if (latestAISummary) {
        setLeadFields({
          address: latestAISummary.address || '',
          timeline: latestAISummary.timeline || '',
          reason: latestAISummary.reason || '',
          condition: latestAISummary.condition || '',
          price: latestAISummary.price || ''
        });
      }

      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('messages-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: \`conversation_id=eq.\${conversation.id}\`
          },
          (payload) => {
            console.log('New message received:', payload);
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('reply', {
        body: {
          conversation_id: conversation.id,
          phone: conversation.contact.phone_e164,
          message: newMessage.trim()
        }
      });

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const updateConversationStatus = async (newStatus: string) => {
    if (!conversation) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', conversation.id);

      if (error) throw error;

      toast.success(\`Conversation status updated to \${newStatus}\`);
      onConversationUpdate?.();
    } catch (error) {
      console.error('Error updating conversation status:', error);
      toast.error('Failed to update conversation status');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateLeadFields = async () => {
    if (!conversation) return;

    try {
      // Find the latest message to update its AI summary
      const latestMessage = messages[messages.length - 1];
      if (!latestMessage) return;

      const { error } = await supabase
        .from('messages')
        .update({
          ai_summary: {
            address: leadFields.address,
            timeline: leadFields.timeline,
            reason: leadFields.reason,
            condition: leadFields.condition,
            price: leadFields.price
          }
        })
        .eq('id', latestMessage.id);

      if (error) throw error;

      toast.success('Lead information updated');
    } catch (error) {
      console.error('Error updating lead fields:', error);
      toast.error('Failed to update lead information');
    }
  };

  const addToLeads = () => {
    const newLead: Lead = {
      phone: conversation?.contact.phone_e164 || phone,
      firstName: conversation?.contact.first_name || '',
      lastName: conversation?.contact.last_name || '',
      address: leadFields.address,
      timeline: leadFields.timeline,
      reason: leadFields.reason,
      condition: leadFields.condition,
      price: leadFields.price
    };

    window.globalLeads.push(newLead);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('leadsUpdated', { 
      detail: { leads: window.globalLeads } 
    }));
    
    toast.success('Contact added to leads list');
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a conversation to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Conversation Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              {getContactDisplayName(conversation.contact)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {conversation.contact.phone_e164}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(conversation.status)}>
              {conversation.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateConversationStatus(
                conversation.status === 'open' ? 'closed' : 'open'
              )}
              disabled={isUpdating}
            >
              {conversation.status === 'open' ? 'Close' : 'Reopen'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={\`flex \${
                  message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                }\`}
              >
                <div
                  className={\`max-w-[70%] rounded-lg p-3 \${
                    message.direction === 'outbound'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }\`}
                >
                  <p className="text-sm">{message.body}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {format(new Date(message.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isSending}
              />
              <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lead Information Sidebar */}
        <div className="w-80 border-l bg-muted/30">
          <Card className="h-full rounded-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={leadFields.address}
                    onChange={(e) => setLeadFields(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Property address"
                  />
                </div>
                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    value={leadFields.timeline}
                    onChange={(e) => setLeadFields(prev => ({ ...prev, timeline: e.target.value }))}
                    placeholder="When to sell"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={leadFields.reason}
                    onChange={(e) => setLeadFields(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Why selling"
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    value={leadFields.condition}
                    onChange={(e) => setLeadFields(prev => ({ ...prev, condition: e.target.value }))}
                    placeholder="Property condition"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="price">Price Expectation</Label>
                  <Input
                    id="price"
                    value={leadFields.price}
                    onChange={(e) => setLeadFields(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Expected price"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={updateLeadFields} variant="outline" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Lead Info
                </Button>
                
                <SendToCRMModal conversation={conversation} />
                
                <Button onClick={addToLeads} variant="secondary" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add to Leads
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};`}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Database Schema</Badge>
                Supabase Tables
              </CardTitle>
              <CardDescription>
                Core database structure for the SMS conversation system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">contacts</h4>
                  <div className="space-y-2 text-sm">
                    <div><code>id</code> - uuid (Primary Key)</div>
                    <div><code>phone_e164</code> - text (Unique)</div>
                    <div><code>first_name</code> - text (Nullable)</div>
                    <div><code>last_name</code> - text (Nullable)</div>
                    <div><code>created_at</code> - timestamp</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">conversations</h4>
                  <div className="space-y-2 text-sm">
                    <div><code>id</code> - uuid (Primary Key)</div>
                    <div><code>contact_id</code> - uuid (Foreign Key)</div>
                    <div><code>status</code> - text (Default: 'open')</div>
                    <div><code>last_msg_at</code> - timestamp</div>
                    <div><code>created_at</code> - timestamp</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">messages</h4>
                  <div className="space-y-2 text-sm">
                    <div><code>id</code> - uuid (Primary Key)</div>
                    <div><code>conversation_id</code> - uuid (Foreign Key)</div>
                    <div><code>direction</code> - text ('inbound'|'outbound')</div>
                    <div><code>body</code> - text</div>
                    <div><code>ai_summary</code> - jsonb (Nullable)</div>
                    <div><code>twilio_sid</code> - text (Nullable)</div>
                    <div><code>created_at</code> - timestamp</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">leads</h4>
                  <div className="space-y-2 text-sm">
                    <div><code>id</code> - uuid (Primary Key)</div>
                    <div><code>phone</code> - text</div>
                    <div><code>first_name</code> - text (Nullable)</div>
                    <div><code>last_name</code> - text (Nullable)</div>
                    <div><code>email</code> - text (Nullable)</div>
                    <div><code>address</code> - text (Nullable)</div>
                    <div><code>city</code> - text (Nullable)</div>
                    <div><code>state</code> - text (Nullable)</div>
                    <div><code>zip</code> - text (Nullable)</div>
                    <div><code>status</code> - text (Default: 'No Response')</div>
                    <div><code>ai_tag</code> - text (Nullable)</div>
                    <div><code>ai_classification_reason</code> - text (Nullable)</div>
                    <div><code>last_classification_at</code> - timestamp</div>
                    <div><code>created_at</code> - timestamp</div>
                    <div><code>updated_at</code> - timestamp</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">profiles</h4>
                  <div className="space-y-2 text-sm">
                    <div><code>id</code> - uuid (Primary Key)</div>
                    <div><code>user_id</code> - uuid (Auth User Reference)</div>
                    <div><code>first_name</code> - text (Nullable)</div>
                    <div><code>last_name</code> - text (Nullable)</div>
                    <div><code>role</code> - text (Default: 'agent')</div>
                    <div><code>created_at</code> - timestamp</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">analytics_metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div><code>id</code> - uuid (Primary Key)</div>
                    <div><code>date</code> - date (Default: CURRENT_DATE)</div>
                    <div><code>leads_per_day</code> - text (Nullable)</div>
                    <div><code>response_rate</code> - text (Nullable)</div>
                    <div><code>qualification_rate</code> - text (Nullable)</div>
                    <div><code>block_rate</code> - text (Nullable)</div>
                    <div><code>avg_time_to_qualify</code> - text (Nullable)</div>
                    <div><code>created_at</code> - timestamp</div>
                    <div><code>updated_at</code> - timestamp</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Row Level Security (RLS) Policies</CardTitle>
              <CardDescription>
                Security policies applied to each table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">General Pattern:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li><strong>SELECT:</strong> Authenticated users can view all records</li>
                    <li><strong>INSERT/UPDATE:</strong> Agents and admins can create/modify records</li>
                    <li><strong>DELETE:</strong> Only admins can delete records (where applicable)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold">Profile-specific policies:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Only admins can create new profiles</li>
                    <li>Users can update their own profile information</li>
                    <li>All users can view profile information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms-service" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">External Service</Badge>
                SMS Service Integration
              </CardTitle>
              <CardDescription>
                Integration with external SMS service via n8n webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Service Flow</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">1</Badge>
                      <div>
                        <div className="font-medium">Incoming SMS</div>
                        <div className="text-sm text-muted-foreground">
                          External SMS service receives message and calls our webhook
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">2</Badge>
                      <div>
                        <div className="font-medium">Webhook Processing</div>
                        <div className="text-sm text-muted-foreground">
                          Supabase Edge Function processes the webhook and stores data
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">3</Badge>
                      <div>
                        <div className="font-medium">Real-time Updates</div>
                        <div className="text-sm text-muted-foreground">
                          UI automatically updates via Supabase real-time subscriptions
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">4</Badge>
                      <div>
                        <div className="font-medium">Outbound SMS</div>
                        <div className="text-sm text-muted-foreground">
                          Reply function forwards message to n8n webhook for SMS sending
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Required Environment Variables</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">N8N_REPLY_WEBHOOK_URL</code>
                      <span className="text-sm text-muted-foreground">- URL for outbound SMS webhook</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">SUPABASE_URL</code>
                      <span className="text-sm text-muted-foreground">- Supabase project URL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">SUPABASE_SERVICE_ROLE_KEY</code>
                      <span className="text-sm text-muted-foreground">- Supabase service role key</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Webhook Payload Examples</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium">Incoming Message (to hooks function)</h5>
                      <ScrollArea className="h-32 w-full rounded-md border p-4">
                        <pre className="text-sm">
                          <code>{`{
  "phone": "+1234567890",
  "direction": "inbound",
  "body": "Hi, I'm interested in selling my house",
  "twilio_sid": "SM1234567890abcdef",
  "ai_summary": {
    "address": "123 Main St",
    "timeline": "3-6 months",
    "reason": "relocating",
    "condition": "good",
    "price": "$250,000"
  },
  "tag": "qualified",
  "reason": "Motivated seller with timeline"
}`}</code>
                        </pre>
                      </ScrollArea>
                    </div>

                    <div>
                      <h5 className="font-medium">Outbound Message (to n8n webhook)</h5>
                      <ScrollArea className="h-32 w-full rounded-md border p-4">
                        <pre className="text-sm">
                          <code>{`{
  "conversation_id": "uuid-here",
  "phone": "+1234567890",
  "message": "Thank you for your interest! When would be a good time to discuss your property?",
  "user_id": "agent-uuid",
  "lovable_message_id": "message-uuid"
}`}</code>
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documentation;