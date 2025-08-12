import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReplyPayload {
  conversation_id: string
  phone: string
  message: string
  idempotency_key?: string
}

function maskPhone(phone: string) {
  const p = phone?.replace(/\D/g, '') || ''
  if (p.length < 10) return '***'
  return `${p.slice(0,2)}****${p.slice(-2)}`
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    const { data: userResult, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userResult?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = userResult.user
    const payload: ReplyPayload = await req.json()
    console.log('Received reply request:', {
      conversation_id: payload.conversation_id,
      phone: maskPhone(payload.phone),
      message_len: payload.message?.length ?? 0,
      user_id: user.id
    })

    // Validate required fields
    if (!payload.conversation_id || !payload.phone || !payload.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: conversation_id, phone, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authorization: only agents/admins can send
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileErr || !profile || !['agent','admin'].includes((profile as any).role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ensure conversation exists and is accessible
    const { data: convo, error: convoErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', payload.conversation_id)
      .maybeSingle()

    if (convoErr || !convo) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Best-effort idempotency: avoid duplicates within 10s
    const windowStart = new Date(Date.now() - 10_000).toISOString()
    const { data: existing } = await supabase
      .from('messages')
      .select('id, created_at')
      .eq('conversation_id', payload.conversation_id)
      .eq('direction', 'outbound')
      .eq('body', payload.message)
      .gt('created_at', windowStart)
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message_id: (existing as any).id, deduped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      .maybeSingle()

    if (messageError || !message) {
      console.error('Error inserting outbound message:', messageError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update conversation last_msg_at (best effort)
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ last_msg_at: new Date().toISOString() })
      .eq('id', payload.conversation_id)

    if (updateError) {
      console.error('Error updating conversation:', updateError)
    }

    return new Response(
      JSON.stringify({ success: true, message_id: (message as any).id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing reply request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
