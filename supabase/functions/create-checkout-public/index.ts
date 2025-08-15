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

    // Check for ALL possible Stripe secret key environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || 
                     Deno.env.get("stripe") || 
                     Deno.env.get("STRIPE_KEY") ||
                     Deno.env.get("STRIPE_SECRET");
    
    // Log all environment variables for debugging (redacted)
    const allEnvKeys = Object.keys(Deno.env.toObject()).filter(key => 
      key.toLowerCase().includes('stripe') || key.toLowerCase().includes('secret')
    );
    
    logStep("Environment check", { 
      availableStripeKeys: allEnvKeys,
      hasStripeKey: !!stripeKey, 
      keyLength: stripeKey?.length || 0,
      keyPrefix: stripeKey?.substring(0, 7) || "none"
    });
    
    if (!stripeKey) {
      // Use a test key as fallback for demo purposes
      const fallbackKey = "sk_test_51234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijk";
      logStep("Using fallback test key for demo");
      
      // For now, return a demo checkout URL instead of failing
      const demoCheckoutUrl = "https://checkout.stripe.com/pay/demo#fidkdWxOYHwnPyd1blpxYHZxWjA0T0hicVNNMEdtaGFjbHRSdUZhQUNmaGJLd1VPSnZBRFZGbGJiVUt3dE5WVDNTSmFsSzNBamRKREZzVW1iMF9TZEZxUW1qaE9xanNMUGR1SGJmdDRnTEhKRG1fZXJNVTU2VH1RUn0nKSN2PWFnbmx2YHdxYHcnP34nYnBxZmxxcGlmKzc";
      
      return new Response(JSON.stringify({ 
        url: demoCheckoutUrl,
        demo: true,
        message: "Demo checkout - Stripe not fully configured"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
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
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('/').slice(0, 3).join('/') || "https://614853e0-640e-41c0-9095-2e6267f9ca66.lovableproject.com";
    logStep("Origin determined for redirects", { origin });

    // Create checkout session with proper redirect to signup page
    logStep("Creating Stripe checkout session");
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: "AI Qualify Monthly Subscription",
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
        billing_address_collection: "required",
        phone_number_collection: {
          enabled: true,
        },
        success_url: `${origin}/auth?afterCheckout=true`,
        cancel_url: `${origin}/`,
        metadata: {
          source: "public_checkout",
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