import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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
      const phoneE164 = payload.phone.startsWith('+') ? payload.phone : `+${payload.phone}`

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

      if (conversationError) {
        console.error('Error finding conversation:', conversationError)
        return new Response(
          JSON.stringify({ error: 'Failed to find conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create new conversation if none exists
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

        if (newConversationError) {
          console.error('Error creating conversation:', newConversationError)
          return new Response(
            JSON.stringify({ error: 'Failed to create conversation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

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
        .eq('id', conversation.id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }

      // Handle AI classification data for leads
      if (payload.tag && payload.phone) {
        console.log('Processing AI classification for lead:', {
          phone: payload.phone,
          tag: payload.tag,
          reason: payload.reason
        })

        // Update or create lead with AI classification
        const { error: leadError } = await supabase
          .from('leads')
          .upsert({
            phone: phoneE164,
            ai_tag: payload.tag,
            ai_classification_reason: payload.reason,
            last_classification_at: new Date().toISOString(),
            // Set default status if creating new lead
            status: 'No Response'
          }, { 
            onConflict: 'phone',
            ignoreDuplicates: false 
          })

        if (leadError) {
          console.error('Error updating lead with AI classification:', leadError)
        } else {
          console.log('Successfully updated lead with AI classification:', {
            phone: phoneE164,
            tag: payload.tag,
            reason: payload.reason
          })
        }
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
})