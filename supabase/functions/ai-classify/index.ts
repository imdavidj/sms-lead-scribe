import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClassifyRequest {
  phone: string
  direction: string
  body: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const payload: ClassifyRequest = await req.json()
      console.log('Received AI classification request:', payload)

      // Validate required fields
      if (!payload.phone || !payload.direction || !payload.body) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: phone, direction, body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Forward to n8n webhook
      const n8nWebhookUrl = 'https://n1agetns.app.n8n.cloud/webhook-test/webhook/ai-classify'
      
      try {
        console.log('Forwarding to n8n webhook:', n8nWebhookUrl)
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: payload.phone,
            direction: payload.direction,
            body: payload.body
          })
        })

        if (!n8nResponse.ok) {
          console.error('N8N webhook failed:', n8nResponse.status, n8nResponse.statusText)
          const errorText = await n8nResponse.text()
          console.error('N8N error response:', errorText)
          
          return new Response(
            JSON.stringify({ 
              error: 'AI classification service unavailable',
              details: `Status: ${n8nResponse.status}`
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const result = await n8nResponse.json()
        console.log('N8N webhook response:', result)

        return new Response(
          JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (n8nError) {
        console.error('Error calling n8n webhook:', n8nError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to connect to AI classification service',
            details: n8nError.message 
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing AI classification request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})