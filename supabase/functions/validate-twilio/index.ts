import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface TwilioValidationRequest {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accountSid, authToken, phoneNumber }: TwilioValidationRequest = await req.json();

    if (!accountSid || !authToken || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required Twilio credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Twilio credentials by making a test API call
    const twilioAuth = btoa(`${accountSid}:${authToken}`);
    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`;

    const twilioResponse = await fetch(twilioApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio validation failed:', errorText);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid Twilio credentials or phone number not found',
          details: twilioResponse.status === 401 ? 'Invalid Account SID or Auth Token' : 'Phone number not found in account'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioData = await twilioResponse.json();
    
    // Check if phone number is found and active
    const isValidNumber = twilioData.incoming_phone_numbers && 
                         twilioData.incoming_phone_numbers.length > 0 &&
                         twilioData.incoming_phone_numbers.some((num: any) => 
                           num.phone_number === phoneNumber && num.status_callback_method
                         );

    if (!isValidNumber) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Phone number not found or not properly configured in Twilio account',
          details: 'Make sure the phone number is purchased and active in your Twilio account'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we get here, credentials are valid
    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'Twilio credentials validated successfully',
        phoneNumber: phoneNumber
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Twilio validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Failed to validate Twilio credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});