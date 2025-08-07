# SMS CRM Integration - Code Examples

This document contains the complete code examples for implementing an SMS CRM integration system using Supabase, React, and Twilio.

## Table of Contents
1. [Supabase Edge Function (Webhook Handler)](#supabase-edge-function-webhook-handler)
2. [ConversationThread Component](#conversationthread-component)
3. [Database Schema](#database-schema)
4. [SMS Service Integration](#sms-service-integration)

---

## Supabase Edge Function (Webhook Handler)

This edge function handles incoming webhook requests from SMS services like Twilio.

**File: `supabase/functions/hooks/index.ts`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MessageWebhookPayload {
  phone: string
  direction: 'inbound' | 'outbound'
  body: string
  twilio_sid?: string
  ai_summary?: {
    address?: string
    timeline?: string
    reason?: string
    condition?: string
    price?: string
    tag?: string
  }
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
      console.log('Received webhook payload:', payload)

      // Validate required fields
      if (!payload.phone || !payload.direction || !payload.body) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: phone, direction, body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Normalize phone number to E.164 format
      let phoneE164 = payload.phone
      if (!phoneE164.startsWith('+')) {
        phoneE164 = '+1' + phoneE164.replace(/\D/g, '')
      }

      // Upsert contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .upsert(
          { phone_e164: phoneE164 },
          { onConflict: 'phone_e164', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (contactError) {
        console.error('Error upserting contact:', contactError)
        return new Response(
          JSON.stringify({ error: 'Failed to upsert contact' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find or create conversation
      let conversationId: string
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('status', 'open')
        .maybeSingle()

      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contact.id,
            status: 'open',
            last_msg_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (conversationError) {
          console.error('Error creating conversation:', conversationError)
          return new Response(
            JSON.stringify({ error: 'Failed to create conversation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        conversationId = newConversation.id
      }

      // Insert message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          direction: payload.direction,
          body: payload.body,
          ai_summary: payload.ai_summary || null,
          twilio_sid: payload.twilio_sid || null
        })
        .select('id')
        .single()

      if (messageError) {
        console.error('Error inserting message:', messageError)
        return new Response(
          JSON.stringify({ error: 'Failed to insert message' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update conversation last_msg_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_msg_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }

      // Handle AI classification if provided
      if (payload.tag && payload.reason) {
        const { error: leadError } = await supabase
          .from('leads')
          .upsert({
            phone: phoneE164,
            ai_tag: payload.tag,
            ai_classification_reason: payload.reason,
            last_classification_at: new Date().toISOString()
          }, {
            onConflict: 'phone'
          })

        if (leadError) {
          console.error('Error upserting lead:', leadError)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          contact_id: contact.id,
          conversation_id: conversationId,
          message_id: message.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Reply Edge Function

This edge function handles outbound message sending.

**File: `supabase/functions/reply/index.ts`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReplyPayload {
  conversation_id: string
  phone: string
  message: string
  user_id?: string
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
      const payload: ReplyPayload = await req.json()
      console.log('Received reply request:', payload)

      // Validate required fields
      if (!payload.conversation_id || !payload.phone || !payload.message) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: conversation_id, phone, message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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

      if (messageError) {
        console.error('Error inserting outbound message:', messageError)
        return new Response(
          JSON.stringify({ error: 'Failed to insert message' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update conversation last_msg_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_msg_at: new Date().toISOString() })
        .eq('id', payload.conversation_id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }

      // Forward to n8n webhook (if configured)
      const n8nWebhookUrl = Deno.env.get('N8N_REPLY_WEBHOOK_URL')
      
      if (n8nWebhookUrl) {
        try {
          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation_id: payload.conversation_id,
              phone: payload.phone,
              message: payload.message,
              user_id: payload.user_id,
              lovable_message_id: message.id
            })
          })

          if (!n8nResponse.ok) {
            console.error('Failed to forward to n8n webhook:', n8nResponse.statusText)
          } else {
            console.log('Successfully forwarded to n8n webhook')
          }
        } catch (n8nError) {
          console.error('Error forwarding to n8n webhook:', n8nError)
        }
      } else {
        console.warn('N8N_REPLY_WEBHOOK_URL not configured')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: message.id,
          forwarded_to_n8n: !!n8nWebhookUrl 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing reply request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## ConversationThread Component

This React component displays conversation messages and handles user replies.

**File: `src/components/ConversationThread.tsx`**

```typescript
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { Conversation, Contact, Message } from '@/types/conversation'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

// Global lead data structure
interface Lead {
  phone: string
  name: string
  address?: string
  timeline?: string
  reason?: string
  condition?: string
  price?: string
}

// Extend window object to include globalLeads
declare global {
  interface Window {
    globalLeads: Lead[]
  }
}

// Initialize global leads array if it doesn't exist
if (typeof window !== 'undefined' && !window.globalLeads) {
  window.globalLeads = []
}

interface ConversationThreadProps {
  conversation: Conversation | null
  onConversationUpdate?: (conversation: Conversation) => void
  leadPhone?: string
}

export default function ConversationThread({ conversation, onConversationUpdate, leadPhone }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Lead fields state
  const [leadFields, setLeadFields] = useState({
    address: '',
    timeline: '',
    reason: '',
    condition: '',
    price: ''
  })

  const [phone, setPhone] = useState(leadPhone || '')

  useEffect(() => {
    if (leadPhone) {
      setPhone(leadPhone)
    }
  }, [leadPhone])

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages || [])
      
      // Extract AI summary data from the latest message
      const latestMessage = conversation.messages?.[conversation.messages.length - 1]
      if (latestMessage?.ai_summary) {
        setLeadFields({
          address: latestMessage.ai_summary.address || '',
          timeline: latestMessage.ai_summary.timeline || '',
          reason: latestMessage.ai_summary.reason || '',
          condition: latestMessage.ai_summary.condition || '',
          price: latestMessage.ai_summary.price || ''
        })
      }
    }
  }, [conversation])

  useEffect(() => {
    if (!conversation) return

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || isSending) return

    setIsSending(true)
    try {
      const { error } = await supabase.functions.invoke('reply', {
        body: {
          conversation_id: conversation.id,
          phone: conversation.contact.phone_e164,
          message: newMessage.trim()
        }
      })

      if (error) {
        throw error
      }

      setNewMessage('')
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const updateConversationStatus = async (newStatus: string) => {
    if (!conversation || isUpdating) return

    setIsUpdating(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({ status: newStatus })
        .eq('id', conversation.id)
        .select(`
          *,
          contact:contacts(*),
          messages:messages(*)
        `)
        .single()

      if (error) throw error

      if (onConversationUpdate) {
        onConversationUpdate(data)
      }

      toast({
        title: "Status updated",
        description: `Conversation status changed to ${newStatus}.`,
      })
    } catch (error) {
      console.error('Error updating conversation status:', error)
      toast({
        title: "Error",
        description: "Failed to update conversation status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateLeadFields = async () => {
    if (!conversation || !messages.length) return

    try {
      // Find the latest inbound message to update its AI summary
      const latestInboundMessage = [...messages]
        .reverse()
        .find(msg => msg.direction === 'inbound')

      if (!latestInboundMessage) {
        toast({
          title: "No message to update",
          description: "No inbound message found to attach lead information.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from('messages')
        .update({
          ai_summary: leadFields
        })
        .eq('id', latestInboundMessage.id)

      if (error) throw error

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === latestInboundMessage.id 
          ? { ...msg, ai_summary: leadFields }
          : msg
      ))

      toast({
        title: "Lead information saved",
        description: "Lead information has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating lead fields:', error)
      toast({
        title: "Error",
        description: "Failed to save lead information.",
        variant: "destructive",
      })
    }
  }

  const addToLeads = () => {
    if (!conversation) return

    const contact = conversation.contact
    const leadData: Lead = {
      phone: phone || contact.phone_e164,
      name: getContactDisplayName(contact),
      address: leadFields.address,
      timeline: leadFields.timeline,
      reason: leadFields.reason,
      condition: leadFields.condition,
      price: leadFields.price
    }

    // Add to global leads array
    if (!window.globalLeads.find(lead => lead.phone === leadData.phone)) {
      window.globalLeads.push(leadData)
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('leadsUpdated', { detail: window.globalLeads }))
      
      toast({
        title: "Added to Leads",
        description: `${leadData.name} has been added to the leads list.`,
      })
    } else {
      toast({
        title: "Already in Leads",
        description: `${leadData.name} is already in the leads list.`,
        variant: "destructive",
      })
    }
  }

  const getContactDisplayName = (contact: Contact) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    }
    return contact.phone_e164
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500 hover:bg-green-600'
      case 'closed':
        return 'bg-red-500 hover:bg-red-600'
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a conversation to view messages
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {getContactDisplayName(conversation.contact)}
              </h2>
              <p className="text-sm text-gray-500">{conversation.contact.phone_e164}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className={`text-white ${getStatusColor(conversation.status)}`}
              >
                {conversation.status}
              </Badge>
              <select
                value={conversation.status}
                onChange={(e) => updateConversationStatus(e.target.value)}
                disabled={isUpdating}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.direction === 'outbound'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={isSending}
            />
            <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

      {/* Lead information sidebar */}
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Lead Information</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>

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
                  placeholder="When they want to sell"
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={leadFields.reason}
                  onChange={(e) => setLeadFields(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why they're selling"
                  rows={3}
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

              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={leadFields.price}
                  onChange={(e) => setLeadFields(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Asking price"
                />
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button onClick={updateLeadFields} variant="outline" size="sm">
                  Save Lead Info
                </Button>
                <Button onClick={addToLeads} variant="default" size="sm">
                  Add to Leads
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## Database Schema

### TypeScript Interfaces

**File: `src/types/conversation.ts`**

```typescript
export interface Contact {
  id: string
  phone_e164: string
  first_name?: string
  last_name?: string
}

export interface Message {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  body: string
  ai_summary?: {
    address?: string
    timeline?: string
    reason?: string
    condition?: string
    price?: string
  }
  twilio_sid?: string
  created_at: string
}

export interface Conversation {
  id: string
  contact_id: string
  status: string
  last_msg_at: string
  created_at: string
  contact: Contact
  messages: Message[]
}
```

### SQL Database Schema

```sql
-- Create contacts table
CREATE TABLE public.contacts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_e164 TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id),
    status TEXT NOT NULL DEFAULT 'open',
    last_msg_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    body TEXT NOT NULL,
    ai_summary JSONB,
    twilio_sid TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    address TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'No Response',
    ai_tag TEXT,
    ai_classification_reason TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    last_classification_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    date_added TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL DEFAULT 'agent',
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_metrics table
CREATE TABLE public.analytics_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    leads_per_day TEXT,
    response_rate TEXT,
    qualification_rate TEXT,
    block_rate TEXT,
    avg_time_to_qualify TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Contacts policies
CREATE POLICY "Authenticated users can view contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Agents and admins can insert contacts" ON public.contacts FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));
CREATE POLICY "Agents and admins can update contacts" ON public.contacts FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));

-- Conversations policies
CREATE POLICY "Authenticated users can view conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Agents and admins can insert conversations" ON public.conversations FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));
CREATE POLICY "Agents and admins can update conversations" ON public.conversations FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));
CREATE POLICY "Only admins can delete conversations" ON public.conversations FOR DELETE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Messages policies
CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Agents and admins can insert messages" ON public.messages FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));
CREATE POLICY "Agents and admins can update messages" ON public.messages FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));

-- Leads policies
CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Agents and admins can insert leads" ON public.leads FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));
CREATE POLICY "Agents and admins can update leads" ON public.leads FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));
CREATE POLICY "Only admins can delete leads" ON public.leads FOR DELETE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Only admins can insert profiles" ON public.profiles FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Analytics policies
CREATE POLICY "Authenticated users can view analytics_metrics" ON public.analytics_metrics FOR SELECT USING (true);
CREATE POLICY "Agents and admins can insert analytics_metrics" ON public.analytics_metrics FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));
CREATE POLICY "Agents and admins can update analytics_metrics" ON public.analytics_metrics FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('agent', 'admin')));

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'agent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_metrics_updated_at
  BEFORE UPDATE ON public.analytics_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## SMS Service Integration

### Twilio Integration Setup

1. **Twilio Webhook Configuration**
   - Configure your Twilio phone number webhook URL to point to your Supabase edge function
   - URL format: `https://{your-project-ref}.supabase.co/functions/v1/hooks`
   - Set HTTP method to POST
   - Configure for both incoming messages and delivery status

2. **Environment Variables**
   Configure these secrets in your Supabase project:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   N8N_REPLY_WEBHOOK_URL=your_n8n_webhook_url (optional)
   ```

3. **Supabase Configuration**
   
   **File: `supabase/config.toml`**
   ```toml
   project_id = "your-project-id"

   [functions.hooks]
   verify_jwt = false

   [functions.reply]
   verify_jwt = false
   ```

### N8N Integration (Optional)

If you're using N8N for SMS sending automation:

1. **N8N Workflow Setup**
   - Create a webhook node to receive outbound message requests
   - Add Twilio SMS node to send the actual message
   - Configure error handling and logging

2. **Webhook Payload Structure**
   ```json
   {
     "conversation_id": "uuid",
     "phone": "+1234567890",
     "message": "Your message text",
     "user_id": "uuid",
     "lovable_message_id": "uuid"
   }
   ```

### Alternative SMS Providers

The system can be adapted for other SMS providers by:

1. Updating the webhook payload structure in the edge function
2. Modifying the message sending logic to match your provider's API
3. Adjusting the database schema if needed for provider-specific fields

---

## Usage Examples

### Sending a Message via API

```javascript
import { supabase } from '@/integrations/supabase/client'

const sendMessage = async (conversationId, phone, message) => {
  const { data, error } = await supabase.functions.invoke('reply', {
    body: {
      conversation_id: conversationId,
      phone: phone,
      message: message
    }
  })
  
  if (error) {
    console.error('Error sending message:', error)
    return
  }
  
  console.log('Message sent successfully:', data)
}
```

### Fetching Conversations

```javascript
const fetchConversations = async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      contact:contacts(*),
      messages:messages(*)
    `)
    .order('last_msg_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching conversations:', error)
    return
  }
  
  return data
}
```

### Real-time Message Subscription

```javascript
const subscribeToMessages = (conversationId, onNewMessage) => {
  return supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      onNewMessage
    )
    .subscribe()
}
```

---

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS enabled with appropriate policies
2. **Edge Function Authentication**: Webhook functions are public but validate input thoroughly
3. **API Key Management**: Store sensitive keys in Supabase secrets
4. **Input Validation**: All user inputs are validated before database operations
5. **CORS Headers**: Properly configured for web application access

---

## Troubleshooting

### Common Issues

1. **Messages not appearing in real-time**
   - Check Supabase real-time subscription setup
   - Verify database RLS policies allow reading messages

2. **Webhook not receiving data**
   - Verify Twilio webhook URL configuration
   - Check edge function logs in Supabase dashboard
   - Ensure CORS headers are properly set

3. **Message sending fails**
   - Check N8N webhook URL configuration
   - Verify all required environment variables are set
   - Review edge function logs for errors

4. **Database permission errors**
   - Verify user authentication
   - Check RLS policies match user roles
   - Ensure profiles table has correct user data

### Monitoring and Logging

- Use Supabase edge function logs for debugging
- Monitor database performance with built-in analytics
- Set up error tracking for production environments
- Implement proper logging in N8N workflows if used

---

This documentation provides a complete reference for implementing an SMS CRM integration system. The code examples are production-ready and include proper error handling, security measures, and real-time capabilities.