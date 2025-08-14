import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-PUBLIC] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("Request received", { method: req.method, url: req.url });

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    logStep("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting checkout creation process");

    // Check for Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    logStep("Stripe key check", { 
      hasKey: !!stripeKey, 
      keyLength: stripeKey?.length || 0,
      keyPrefix: stripeKey?.substring(0, 7) || "none"
    });
    
    if (!stripeKey) {
      const errorMsg = "Stripe secret key not configured. Please add STRIPE_SECRET_KEY to your Supabase edge function secrets.";
      logStep("ERROR: Missing Stripe key");
      return new Response(JSON.stringify({ 
        error: errorMsg,
        details: "Configure STRIPE_SECRET_KEY in Supabase Dashboard > Edge Functions > Secrets"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    if (!stripeKey.startsWith('sk_')) {
      const errorMsg = "Invalid Stripe secret key format. Key must start with 'sk_'";
      logStep("ERROR: Invalid key format", { keyPrefix: stripeKey.substring(0, 7) });
      return new Response(JSON.stringify({ 
        error: errorMsg,
        details: "Use a valid Stripe secret key (sk_test_... for testing or sk_live_... for production)"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    logStep("Stripe key validation passed");

    // Initialize Stripe
    let stripe;
    try {
      stripe = new Stripe(stripeKey, { 
        apiVersion: "2023-10-16",
        timeout: 30000 // 30 second timeout
      });
      logStep("Stripe client initialized successfully");
    } catch (stripeError) {
      const errorMsg = "Failed to initialize Stripe client";
      logStep("ERROR: Stripe initialization failed", { error: stripeError });
      return new Response(JSON.stringify({ 
        error: errorMsg,
        details: stripeError instanceof Error ? stripeError.message : String(stripeError)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Determine origin for redirect URLs
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('/').slice(0, 3).join('/') || "https://fllsnsidgqlacdyatvbm.supabase.co";
    logStep("Origin determined for redirects", { origin });

    // Create checkout session
    logStep("Creating Stripe checkout session");
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: "AI Qualify Subscription",
                description: "AI-powered SMS lead conversion platform"
              },
              unit_amount: 100000, // $1,000.00 in cents
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        allow_promotion_codes: false,
        billing_address_collection: "auto",
        success_url: `${origin}/auth?afterCheckout=1`,
        cancel_url: `${origin}/`,
        metadata: {
          source: "landing_page",
          created_at: new Date().toISOString()
        }
      });
      
      logStep("Checkout session created successfully", { 
        sessionId: session.id, 
        url: session.url,
        amount: session.amount_total
      });
    } catch (stripeSessionError) {
      const errorMsg = "Failed to create Stripe checkout session";
      logStep("ERROR: Stripe session creation failed", { error: stripeSessionError });
      return new Response(JSON.stringify({ 
        error: errorMsg,
        details: stripeSessionError instanceof Error ? stripeSessionError.message : String(stripeSessionError)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!session?.url) {
      const errorMsg = "Checkout session created but no URL returned";
      logStep("ERROR: No checkout URL in session", { sessionId: session?.id });
      return new Response(JSON.stringify({ 
        error: errorMsg,
        details: "Stripe returned a session without a checkout URL"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    logStep("Successfully returning checkout URL", { url: session.url });
    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    logStep("UNHANDLED ERROR in create-checkout-public", { 
      message, 
      stack,
      errorType: error?.constructor?.name
    });
    
    return new Response(JSON.stringify({ 
      error: "An unexpected error occurred while creating checkout session",
      details: message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});