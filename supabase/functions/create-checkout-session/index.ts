import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client for user authentication (anon key)
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Initialize Supabase client for admin operations (service role key)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const priceId = Deno.env.get("PRICE_ID");
    const appUrl = Deno.env.get("APP_URL");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!priceId) throw new Error("PRICE_ID is not set");
    if (!appUrl) throw new Error("APP_URL is not set");

    logStep("Environment variables verified");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // 1) Get or create a single Stripe customer for this user
    const { data: existingSubscriber } = await supabaseAdmin
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existingSubscriber?.stripe_customer_id || null;
    logStep("Checked existing subscriber", { customerId });

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({ 
        email: user.email, 
        metadata: { user_id: user.id } 
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });

      // Store customer ID in database
      await supabaseAdmin.from("subscribers").upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customerId,
        subscribed: false,
        updated_at: new Date().toISOString(),
      });
      logStep("Stored customer ID in database");
    }

    // 2) Create checkout session with that SAME customer
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      client_reference_id: user.id,
      metadata: { user_id: user.id, email: user.email }
    });

    logStep("Created checkout session", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});