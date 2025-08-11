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

      // Message sent successfully
      console.log('Message sent successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
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
    console.error('Error processing reply request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})