import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    // Client bound to the user's JWT to read user identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Service role client to perform privileged writes (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !userRes?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = userRes.user
    const { companyName } = await req.json().catch(() => ({ companyName: null }))

    // Load profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role, client_id, first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profErr || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Idempotent: if already has a non-default client_id, return
    if ((profile as any).client_id && (profile as any).client_id !== 'default') {
      return new Response(
        JSON.stringify({ success: true, bootstrapped: true, client_id: (profile as any).client_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client
    const clientPayload = {
      name: companyName || `${(profile as any).first_name ?? 'New'} ${(profile as any).last_name ?? 'Client'}`,
      email: user.email ?? 'unknown@example.com',
      phone: null,
      company: companyName ?? null,
    }

    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .insert(clientPayload)
      .select('id')
      .maybeSingle()

    if (clientErr || !client) {
      return new Response(
        JSON.stringify({ error: 'Failed to create client' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Promote current user to admin and bind to client
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin', client_id: (client as any).id })
      .eq('user_id', user.id)

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, client_id: (client as any).id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('bootstrap error', e)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
